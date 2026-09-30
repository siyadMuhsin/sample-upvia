'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { apiClient } from '../../../lib/api';
import { useToast } from '../../../components/ui/Toast';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
import { Building2, Star, Users, TrendingUp, ChevronDown, Check } from 'lucide-react';

type PartnershipDecision = 'ACTIVE' | 'STRENGTHEN' | 'REVIEW' | 'TERMINATE';

const DECISION_OPTIONS: { value: PartnershipDecision; label: string; description: string }[] = [
  { value: 'ACTIVE', label: 'Active', description: 'Standard, in-good-standing partnership' },
  { value: 'STRENGTHEN', label: 'Strengthen', description: 'Expand seat allocation & deepen ties' },
  { value: 'REVIEW', label: 'Review', description: 'Flag for training-unit follow-up' },
  { value: 'TERMINATE', label: 'Terminate', description: 'Discontinue this industrial partnership' },
];

export default function AdminCompaniesPage() {
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCompanies = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient('/companies', { params: { limit: 50 } });
      if (res.success && res.data) {
        setCompanies(res.data);
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to load partner companies.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecisionChange = async (companyId: string, decision: PartnershipDecision, companyName: string) => {
    setOpenMenuId(null);

    if (decision === 'TERMINATE') {
      const ok = await confirm({
        title: 'Terminate this partnership?',
        description: `This will discontinue ${companyName}'s cooperative-training partnership. Existing active placements will not be automatically cancelled, but no new postings will be accredited from this partner.`,
        confirmLabel: 'Terminate Partnership',
        variant: 'danger',
      });
      if (!ok) return;
    }

    setUpdatingId(companyId);
    const previous = companies;
    // Optimistic update
    setCompanies((prev) => prev.map((c) => (c._id === companyId ? { ...c, partnershipDecision: decision } : c)));

    try {
      const res = await apiClient(`/companies/${companyId}/partnership-decision`, {
        method: 'PATCH',
        body: JSON.stringify({ decision }),
      });
      if (res.success) {
        showToast(`Partnership status set to ${decision}.`, 'success');
      } else {
        throw new Error(res.message || 'Update failed');
      }
    } catch (err: any) {
      setCompanies(previous); // Roll back on failure
      showToast(err.message || 'Failed to update partnership decision.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Industrial Partner Companies"
        subtitle="Review partner performance and record university decisions on each company's cooperative-training partnership status."
      />

      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-upvia-blue border-t-transparent rounded-full animate-spin" />
          <span>Loading partner companies...</span>
        </div>
      ) : companies.length === 0 ? (
        <div className="py-20 text-center text-xs text-slate-400">No partner companies found.</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left rtl:text-right border-collapse">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Sector</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Trained / Employed</th>
                  <th className="py-3 px-4">Conversion Rate</th>
                  <th className="py-3 px-4">Partnership Status</th>
                  <th className="py-3 px-4 text-right rtl:text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {companies.map((company) => (
                  <tr key={company._id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-upvia-blue" />
                        </div>
                        <span className="font-bold text-upvia-navy">{company.nameEn}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{company.sector}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {company.averageRating > 0 ? company.averageRating.toFixed(1) : 'No ratings yet'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {company.studentsTrained ?? 0} / {company.studentsEmployed ?? 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-bold text-upvia-blue">
                        <TrendingUp className="w-3.5 h-3.5" />
                        {company.trainingToEmploymentRate ?? 0}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={company.partnershipDecision || 'ACTIVE'} />
                    </td>
                    <td className="py-3.5 px-4 relative text-right rtl:text-left">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === company._id ? null : company._id)}
                        disabled={updatingId === company._id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-upvia-navy font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
                      >
                        {updatingId === company._id ? (
                          <div className="w-3 h-3 border-2 border-upvia-blue border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>Set Status</span>
                            <ChevronDown className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>

                      {openMenuId === company._id && (
                        <div
                          ref={menuRef}
                          className="absolute z-20 right-4 rtl:right-auto rtl:left-4 mt-1 w-64 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden text-left rtl:text-right"
                        >
                          {DECISION_OPTIONS.map((opt) => {
                            const isCurrent = (company.partnershipDecision || 'ACTIVE') === opt.value;
                            return (
                              <button
                                key={opt.value}
                                onClick={() => handleDecisionChange(company._id, opt.value, company.nameEn)}
                                className={`w-full px-4 py-2.5 flex items-start gap-2 hover:bg-slate-50 transition-colors ${
                                  isCurrent ? 'bg-blue-50/50' : ''
                                }`}
                              >
                                <span className="flex-1">
                                  <span className="block font-semibold text-upvia-navy">{opt.label}</span>
                                  <span className="block text-[11px] text-slate-500">{opt.description}</span>
                                </span>
                                {isCurrent && <Check className="w-4 h-4 text-upvia-blue flex-shrink-0 mt-0.5" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppShell>
  );
}
