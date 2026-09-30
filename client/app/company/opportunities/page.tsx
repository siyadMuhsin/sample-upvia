'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { apiClient } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import { Plus, X, Briefcase, MapPin, Calendar, CheckCircle2, AlertTriangle } from 'lucide-react';
import { OpportunityType, OpportunityStatus, WorkMode } from '@/shared';
import { useToast } from '../../../components/ui/Toast';

export default function CompanyOpportunitiesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [skillOptions, setSkillOptions] = useState<any[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);

  // Form states
  const [titleEn, setTitleEn] = useState('');
  const [type, setType] = useState<OpportunityType>(OpportunityType.COOP_TRAINING);
  const [city, setCity] = useState('Riyadh');
  const [workMode, setWorkMode] = useState<WorkMode>(WorkMode.HYBRID);
  const [numberOfSeats, setNumberOfSeats] = useState(5);
  const [descriptionEn, setDescriptionEn] = useState('');
  const [minimumGPA, setMinimumGPA] = useState(3.0);
  const [stipend, setStipend] = useState(4000);
  const [requiredSpecializationsInput, setRequiredSpecializationsInput] = useState('');

  useEffect(() => {
    fetchOpportunities();
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const res = await apiClient('/skills');
      if (res.success && res.data) {
        setSkillOptions(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSkill = (skillId: string) => {
    setSelectedSkillIds((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
    );
  };

  const fetchOpportunities = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient('/opportunities');
      if (res.success && res.data) {
        setOpportunities(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await apiClient('/opportunities', {
        method: 'POST',
        body: JSON.stringify({
          companyId: user?.companyId,
          titleEn,
          type,
          city,
          location: `${city} Technology Campus`,
          workMode,
          numberOfSeats,
          descriptionEn,
          minimumGPA,
          stipend,
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000),
          applicationDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          requiredSpecializations: requiredSpecializationsInput
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          requiredSkills: skillOptions
            .filter((s) => selectedSkillIds.includes(s._id))
            .map((s) => ({ skillId: s._id, skillNameEn: s.nameEn, minimumLevel: 3 })),
        }),
      });

      if (res.success) {
        setSuccessMessage('Opportunity created and submitted to University Program Coordinator for academic accreditation!');
        setIsModalOpen(false);
        setTitleEn('');
        setDescriptionEn('');
        setRequiredSpecializationsInput('');
        setSelectedSkillIds([]);
        fetchOpportunities();
      }
    } catch (e: any) {
      showToast(e.message || 'Error creating opportunity', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Manage Career & Co-op Postings"
        subtitle="Submit new placements into the university accreditation workflow and monitor seat fill rates."
        actions={
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-upvia-blue text-white hover:bg-upvia-blue-hover transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Placement</span>
          </button>
        }
      />

      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-upvia-blue border-t-transparent rounded-full animate-spin" />
          <span>Loading placements...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {opportunities.map((opp) => (
            <div
              key={opp._id}
              className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <StatusBadge status={opp.status} />
                  <StatusBadge status={opp.type} />
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200/60">
                    {opp.seatsRemaining} of {opp.numberOfSeats} Seats Open
                  </span>
                </div>

                <h3 className="text-base font-bold text-upvia-navy">{opp.titleEn}</h3>

                <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {opp.city} ({opp.workMode})
                  </span>
                  <span>•</span>
                  <span>Min GPA: {opp.minimumGPA}</span>
                  <span>•</span>
                  <span>Monthly Stipend: SAR {opp.stipend?.toLocaleString()}</span>
                </div>

                <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {opp.descriptionEn}
                </p>

                {(opp.status === OpportunityStatus.REJECTED || opp.status === OpportunityStatus.NEEDS_REVISION) &&
                  opp.rejectionReason && (
                    <div
                      className={`mt-3 p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2 ${
                        opp.status === OpportunityStatus.REJECTED
                          ? 'bg-rose-50 border-rose-200 text-rose-800'
                          : 'bg-amber-50 border-amber-200 text-amber-900'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>
                        <span className="font-bold">
                          {opp.status === OpportunityStatus.REJECTED
                            ? 'Rejected by University: '
                            : 'Changes Requested by University: '}
                        </span>
                        {opp.rejectionReason}
                      </span>
                    </div>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Opportunity Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-upvia-navy">Post New Training Opportunity</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 text-xs overflow-y-auto max-h-[80vh]">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Opportunity Title</label>
                <input
                  type="text"
                  required
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="e.g. Co-op Software Engineer — Data Systems"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-upvia-blue/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as OpportunityType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none"
                  >
                    <option value={OpportunityType.COOP_TRAINING}>Cooperative Training</option>
                    <option value={OpportunityType.SUMMER_TRAINING}>Summer Training</option>
                    <option value={OpportunityType.INTERNSHIP}>Internship</option>
                    <option value={OpportunityType.FULL_TIME}>Full-Time Job</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Work Mode</label>
                  <select
                    value={workMode}
                    onChange={(e) => setWorkMode(e.target.value as WorkMode)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none"
                  >
                    <option value={WorkMode.HYBRID}>Hybrid</option>
                    <option value={WorkMode.ON_SITE}>On-Site</option>
                    <option value={WorkMode.REMOTE}>Remote</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Number of Seats</label>
                  <input
                    type="number"
                    min={1}
                    value={numberOfSeats}
                    onChange={(e) => setNumberOfSeats(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Monthly Stipend (SAR)</label>
                  <input
                    type="number"
                    value={stipend}
                    onChange={(e) => setStipend(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description & Scope</label>
                <textarea
                  rows={4}
                  required
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  placeholder="Outline responsibilities, learning outcomes, and prerequisites..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-upvia-blue/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Required Specializations</label>
                <input
                  type="text"
                  required
                  value={requiredSpecializationsInput}
                  onChange={(e) => setRequiredSpecializationsInput(e.target.value)}
                  placeholder="e.g. Software Engineering, Computer Science (comma-separated)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-upvia-blue/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Required Skills</label>
                {skillOptions.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl border border-slate-100">
                    No skills found in the taxonomy yet.
                  </p>
                ) : (
                  <div className="max-h-36 overflow-y-auto flex flex-wrap gap-1.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                    {skillOptions.map((skill) => {
                      const isSelected = selectedSkillIds.includes(skill._id);
                      return (
                        <button
                          type="button"
                          key={skill._id}
                          onClick={() => toggleSkill(skill._id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                            isSelected
                              ? 'bg-upvia-blue text-white border-upvia-blue'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {skill.nameEn}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg font-bold bg-upvia-blue text-white hover:bg-upvia-blue-hover shadow-2xs"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit for Academic Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
