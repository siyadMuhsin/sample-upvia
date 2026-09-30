'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { apiClient } from '../../../lib/api';
import { OpportunityStatus } from '@/shared';
import { CheckCircle2, Building2, MapPin, ArrowRight, ShieldCheck, XCircle, PencilLine, X } from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';
import { useConfirm } from '../../../components/ui/ConfirmDialog';

const TRANSITION_LABELS: Record<string, string> = {
  [OpportunityStatus.PROGRAM_REVIEW]: 'forward this posting to Program Review',
  [OpportunityStatus.TRAINING_UNIT_REVIEW]: 'forward this posting to the Training Unit for review',
  [OpportunityStatus.APPROVED]: 'approve this posting for accreditation',
  [OpportunityStatus.PUBLISHED]: 'publish this posting to the student portal',
};

const REJECTION_PATH_LABELS: Record<string, { title: string; confirmLabel: string }> = {
  [OpportunityStatus.REJECTED]: { title: 'Reject Opportunity Posting', confirmLabel: 'Reject Posting' },
  [OpportunityStatus.NEEDS_REVISION]: { title: 'Request Changes from Company', confirmLabel: 'Request Changes' },
};

export default function AdminOpportunitiesWorkflowPage() {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [rejectionTarget, setRejectionTarget] = useState<{ oppId: string; status: OpportunityStatus } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingRejection, setIsSubmittingRejection] = useState(false);
  const { showToast } = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    fetchOpportunities();
  }, [statusFilter]);

  const fetchOpportunities = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient('/opportunities', {
        params: {
          status: statusFilter || undefined,
          limit: 30,
        },
      });
      if (res.success && res.data) {
        setOpportunities(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransition = async (oppId: string, nextStatus: OpportunityStatus) => {
    const isCritical = nextStatus === OpportunityStatus.APPROVED || nextStatus === OpportunityStatus.PUBLISHED;
    const ok = await confirm({
      title: 'Confirm workflow transition',
      description: `Are you sure you want to ${TRANSITION_LABELS[nextStatus] || 'change this posting’s status'}? This action will be recorded in the accreditation audit trail.`,
      confirmLabel: 'Confirm',
      variant: isCritical ? 'warning' : 'info',
    });
    if (!ok) return;

    try {
      const res = await apiClient(`/opportunities/${oppId}/workflow`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: nextStatus,
          comment: `Accreditation workflow transitioned to ${nextStatus}`,
        }),
      });

      if (res.success) {
        showToast('Workflow status updated successfully.', 'success');
        fetchOpportunities();
      }
    } catch (e: any) {
      showToast(e.message || 'Workflow transition error', 'error');
    }
  };

  const handleSubmitRejection = async () => {
    if (!rejectionTarget || !rejectionReason.trim()) return;
    setIsSubmittingRejection(true);
    try {
      const res = await apiClient(`/opportunities/${rejectionTarget.oppId}/workflow`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: rejectionTarget.status,
          rejectionReason: rejectionReason.trim(),
        }),
      });

      if (res.success) {
        showToast(
          rejectionTarget.status === OpportunityStatus.REJECTED
            ? 'Opportunity rejected.'
            : 'Revision requested from the company.',
          'success'
        );
        setRejectionTarget(null);
        setRejectionReason('');
        fetchOpportunities();
      }
    } catch (e: any) {
      showToast(e.message || 'Failed to submit decision', 'error');
    } finally {
      setIsSubmittingRejection(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Opportunity Accreditation & Workflow Engine"
        subtitle="Review industrial company postings, evaluate curriculum alignment, and accredit placements into the published student portal."
      />

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2 text-xs font-semibold">
        {[
          { label: 'All Postings', value: '' },
          { label: 'Submitted by Company', value: OpportunityStatus.SUBMITTED },
          { label: 'Program Review', value: OpportunityStatus.PROGRAM_REVIEW },
          { label: 'Training Unit Review', value: OpportunityStatus.TRAINING_UNIT_REVIEW },
          { label: 'Approved', value: OpportunityStatus.APPROVED },
          { label: 'Published to Students', value: OpportunityStatus.PUBLISHED },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 rounded-lg border transition-colors ${
              statusFilter === tab.value
                ? 'bg-upvia-navy text-white border-upvia-navy'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-upvia-blue border-t-transparent rounded-full animate-spin" />
          <span>Loading workflow pipeline...</span>
        </div>
      ) : opportunities.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
          No opportunities found in this workflow state.
        </div>
      ) : (
        <div className="space-y-4">
          {opportunities.map((opp) => (
            <div
              key={opp._id}
              className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2.5 mb-2">
                  <StatusBadge status={opp.status} />
                  <StatusBadge status={opp.type} />
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-semibold text-slate-600">
                    {opp.seatsRemaining} of {opp.numberOfSeats} Seats Allocated
                  </span>
                </div>

                <h3 className="text-base font-bold text-upvia-navy">{opp.titleEn}</h3>

                <div className="mt-1.5 flex items-center gap-3 text-xs text-upvia-secondary">
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {opp.companyId?.nameEn}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {opp.city} ({opp.workMode})
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-600 line-clamp-2">{opp.descriptionEn}</p>
              </div>

              {/* Workflow Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                {opp.status === OpportunityStatus.SUBMITTED && (
                  <button
                    onClick={() => handleTransition(opp._id, OpportunityStatus.PROGRAM_REVIEW)}
                    className="px-3.5 py-2 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                  >
                    Start Program Review
                  </button>
                )}

                {opp.status === OpportunityStatus.PROGRAM_REVIEW && (
                  <button
                    onClick={() => handleTransition(opp._id, OpportunityStatus.TRAINING_UNIT_REVIEW)}
                    className="px-3.5 py-2 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                  >
                    Forward to Training Unit
                  </button>
                )}

                {opp.status === OpportunityStatus.TRAINING_UNIT_REVIEW && (
                  <button
                    onClick={() => handleTransition(opp._id, OpportunityStatus.APPROVED)}
                    className="px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                  >
                    Approve Accreditation
                  </button>
                )}

                {opp.status === OpportunityStatus.APPROVED && (
                  <button
                    onClick={() => handleTransition(opp._id, OpportunityStatus.PUBLISHED)}
                    className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Publish to Portal</span>
                  </button>
                )}

                {[OpportunityStatus.SUBMITTED, OpportunityStatus.PROGRAM_REVIEW, OpportunityStatus.TRAINING_UNIT_REVIEW].includes(
                  opp.status
                ) && (
                  <>
                    <button
                      onClick={() => setRejectionTarget({ oppId: opp._id, status: OpportunityStatus.NEEDS_REVISION })}
                      className="px-3.5 py-2 text-xs font-bold rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 flex items-center gap-1.5"
                    >
                      <PencilLine className="w-3.5 h-3.5" />
                      <span>Request Changes</span>
                    </button>
                    <button
                      onClick={() => setRejectionTarget({ oppId: opp._id, status: OpportunityStatus.REJECTED })}
                      className="px-3.5 py-2 text-xs font-bold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection / Revision Reason Modal (custom — never native prompt()) */}
      {rejectionTarget && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-upvia-navy">
                {REJECTION_PATH_LABELS[rejectionTarget.status]?.title}
              </h3>
              <button
                onClick={() => {
                  setRejectionTarget(null);
                  setRejectionReason('');
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 text-xs">
              <label className="block font-semibold text-slate-700 mb-1">
                Reason {rejectionTarget.status === OpportunityStatus.REJECTED ? '(required)' : 'for requested changes (required)'}
              </label>
              <textarea
                rows={4}
                autoFocus
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain what curriculum, compliance, or seat-allocation issue must be addressed..."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-upvia-blue/20"
              />
              <p className="text-slate-400">
                This reason is sent to the company and recorded in the accreditation audit trail.
              </p>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
              <button
                onClick={() => {
                  setRejectionTarget(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRejection}
                disabled={!rejectionReason.trim() || isSubmittingRejection}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-2xs disabled:opacity-50"
              >
                {isSubmittingRejection ? 'Submitting...' : REJECTION_PATH_LABELS[rejectionTarget.status]?.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
