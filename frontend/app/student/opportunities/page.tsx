'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { MatchScore } from '../../../components/ui/MatchScore';
import { apiClient } from '../../../lib/api';
import {
  Search,
  Building2,
  MapPin,
  Calendar,
  Send,
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react';

export default function StudentOpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedOpp, setSelectedOpp] = useState<any>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchOpportunities();
  }, [search]);

  const fetchOpportunities = async () => {
    setIsLoading(true);
    try {
      // First fetch recommendations with match scores
      const res = await apiClient('/matching/recommended');
      if (res.success && res.data) {
        setOpportunities(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async () => {
    if (!selectedOpp) return;
    setIsApplying(true);
    try {
      const res = await apiClient('/applications', {
        method: 'POST',
        body: JSON.stringify({
          opportunityId: selectedOpp._id,
          coverLetter,
        }),
      });

      if (res.success) {
        setSuccessMessage(`Application for "${selectedOpp.titleEn}" submitted successfully!`);
        setSelectedOpp(null);
        setCoverLetter('');
      }
    } catch (e: any) {
      alert(e.message || 'Application error');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Explore Opportunities & Co-op Placements"
        subtitle="Ranked dynamically by our explainable matching algorithm comparing your transcripts and skills with industry criteria."
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

      {/* Filter Toolbar */}
      <div className="mb-6 flex flex-col sm:flex-row items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search opportunities by title, required skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 rtl:pl-4 rtl:pr-9 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-upvia-blue/20"
          />
        </div>
      </div>

      {/* Opportunities List */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-upvia-blue border-t-transparent rounded-full animate-spin" />
          <span>Computing multi-dimensional match scores...</span>
        </div>
      ) : opportunities.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
          No opportunities found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {opportunities.map((opp) => (
            <div
              key={opp._id}
              className="p-6 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <MatchScore
                    score={opp.matchScore}
                    breakdown={opp.matchDetails?.breakdown}
                    matchedSkills={opp.matchDetails?.matchedSkills}
                    missingSkills={opp.matchDetails?.missingSkills}
                    recommendedCourses={opp.matchDetails?.recommendedCourses}
                    explanation={opp.matchDetails?.explanation}
                    size="md"
                  />
                  <StatusBadge status={opp.type} />
                </div>

                <h3 className="text-base font-bold text-upvia-navy">{opp.titleEn}</h3>

                <div className="mt-1.5 flex items-center gap-2 text-xs text-upvia-secondary font-medium">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{opp.companyId?.nameEn}</span>
                  <span>•</span>
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>{opp.city} ({opp.workMode})</span>
                </div>

                <p className="mt-3 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {opp.descriptionEn}
                </p>

                {/* Skills tags */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                  {opp.requiredSkills?.map((s: any, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-medium"
                    >
                      {s.skillNameEn}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {opp.seatsRemaining} Seats Open
                </span>

                <button
                  onClick={() => setSelectedOpp(opp)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-upvia-blue text-white hover:bg-upvia-blue-hover transition-colors shadow-2xs"
                >
                  Apply with Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Application Submission Modal */}
      {selectedOpp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-upvia-navy">Submit Co-op Application</h3>
                <p className="text-xs text-upvia-secondary">{selectedOpp.titleEn} at {selectedOpp.companyId?.nameEn}</p>
              </div>
              <button onClick={() => setSelectedOpp(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-blue-900 leading-relaxed">
                Your verified university academic transcript, GPA ({selectedOpp.matchDetails?.breakdown ? 'Verified' : 'Active'}), and skill endorsements will be automatically packaged into your application package.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cover Letter / Note to Hiring Manager
                </label>
                <textarea
                  rows={4}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Introduce yourself and explain why your coursework and project portfolio make you an ideal candidate..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-upvia-blue/20"
                />
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setSelectedOpp(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-white"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={isApplying}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-upvia-blue text-white hover:bg-upvia-blue-hover transition-colors shadow-2xs flex items-center gap-1.5 disabled:opacity-60"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isApplying ? 'Submitting...' : 'Submit Application'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
