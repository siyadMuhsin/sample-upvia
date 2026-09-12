'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { MatchScore } from '../../../components/ui/MatchScore';
import { apiClient } from '../../../lib/api';
import { ApplicationStatus } from '@upvia/shared';
import { CheckCircle2, XCircle, Calendar, User, Mail, Sparkles } from 'lucide-react';

export default function CompanyApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient('/applications/company');
      if (res.success && res.data) {
        setApplications(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: ApplicationStatus) => {
    try {
      const res = await apiClient(`/applications/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (res.success) {
        fetchApplications();
      }
    } catch (e: any) {
      alert(e.message || 'Error updating status');
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Candidate Review & Selection Pipeline"
        subtitle="Evaluate student applicants ranked deterministically by multi-dimensional qualification match."
      />

      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-upvia-blue border-t-transparent rounded-full animate-spin" />
          <span>Loading applicants pipeline...</span>
        </div>
      ) : applications.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
          No candidate applications submitted for your postings yet.
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app._id}
              className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <StatusBadge status={app.status} />
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Applied on {new Date(app.submittedAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-upvia-navy border border-slate-200">
                    {app.studentId?.userId?.firstNameEn?.[0] || 'C'}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-upvia-navy">
                      {app.studentId?.userId?.firstNameEn} {app.studentId?.userId?.lastNameEn}
                    </h3>
                    <p className="text-xs text-upvia-secondary flex items-center gap-2">
                      <span>{app.opportunityId?.titleEn}</span>
                      <span>•</span>
                      <span className="text-slate-500">{app.studentId?.userId?.email}</span>
                    </p>
                  </div>
                </div>

                {app.coverLetter && (
                  <p className="mt-3 p-3 rounded-lg bg-slate-50 text-xs text-slate-700 italic border border-slate-100">
                    "{app.coverLetter}"
                  </p>
                )}
              </div>

              {/* Match Score & Action Buttons */}
              <div className="flex flex-col md:items-end gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                <MatchScore
                  score={app.matchScore}
                  breakdown={app.matchDetails?.breakdown}
                  matchedSkills={app.matchDetails?.matchedSkills}
                  missingSkills={app.matchDetails?.missingSkills}
                  recommendedCourses={app.matchDetails?.recommendedCourses}
                  explanation={app.matchDetails?.explanation}
                />

                <div className="flex items-center gap-2">
                  {app.status === ApplicationStatus.SUBMITTED && (
                    <button
                      onClick={() => handleUpdateStatus(app._id, ApplicationStatus.SHORTLISTED)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                    >
                      Shortlist Candidate
                    </button>
                  )}

                  {app.status === ApplicationStatus.SHORTLISTED && (
                    <button
                      onClick={() => handleUpdateStatus(app._id, ApplicationStatus.SELECTED)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-2xs"
                    >
                      Select for Co-op
                    </button>
                  )}

                  {app.status !== ApplicationStatus.REJECTED && app.status !== ApplicationStatus.SELECTED && (
                    <button
                      onClick={() => handleUpdateStatus(app._id, ApplicationStatus.REJECTED)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Decline
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
