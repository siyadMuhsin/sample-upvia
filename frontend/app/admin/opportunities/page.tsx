'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { apiClient } from '../../../lib/api';
import { OpportunityStatus } from '@upvia/shared';
import { CheckCircle2, Building2, MapPin, ArrowRight, ShieldCheck } from 'lucide-react';

export default function AdminOpportunitiesWorkflowPage() {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

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
    try {
      const res = await apiClient(`/opportunities/${oppId}/workflow`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: nextStatus,
          comment: `Accreditation workflow transitioned to ${nextStatus}`,
        }),
      });

      if (res.success) {
        fetchOpportunities();
      }
    } catch (e: any) {
      alert(e.message || 'Workflow transition error');
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
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
