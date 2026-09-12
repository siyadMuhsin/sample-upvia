'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { MatchScore } from '../../../components/ui/MatchScore';
import { apiClient } from '../../../lib/api';
import { Building2, Calendar, Clock, FileText } from 'lucide-react';

export default function StudentApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient('/applications/my');
      if (res.success && res.data) {
        setApplications(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="My Submitted Applications"
        subtitle="Track the operational status of your co-op placement applications and recruiter shortlisting."
      />

      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-upvia-blue border-t-transparent rounded-full animate-spin" />
          <span>Loading submitted applications...</span>
        </div>
      ) : applications.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
          You have not submitted any applications yet. Explore matching opportunities to apply.
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app._id}
              className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2.5 mb-2">
                  <StatusBadge status={app.status} />
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(app.submittedAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-base font-bold text-upvia-navy">
                  {app.opportunityId?.titleEn || 'Cooperative Training Placement'}
                </h3>

                <div className="mt-1 flex items-center gap-2 text-xs text-upvia-secondary font-medium">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{app.opportunityId?.companyId?.nameEn}</span>
                  <span>•</span>
                  <span>{app.opportunityId?.location}</span>
                </div>

                {app.notes && (
                  <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700">
                    <span className="font-semibold text-slate-900">Recruiter Note: </span>
                    {app.notes}
                  </div>
                )}
              </div>

              <div className="flex flex-col md:items-end gap-2 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Algorithm Fit</p>
                <MatchScore
                  score={app.matchScore}
                  breakdown={app.matchDetails?.breakdown}
                  matchedSkills={app.matchDetails?.matchedSkills}
                  missingSkills={app.matchDetails?.missingSkills}
                  recommendedCourses={app.matchDetails?.recommendedCourses}
                  explanation={app.matchDetails?.explanation}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
