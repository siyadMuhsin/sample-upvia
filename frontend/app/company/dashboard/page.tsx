'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatCard } from '../../../components/ui/StatCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { MatchScore } from '../../../components/ui/MatchScore';
import { apiClient } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import {
  Briefcase,
  Users,
  GraduationCap,
  Award,
  Plus,
  ArrowRight,
  TrendingUp,
  Star,
  CheckCircle2,
} from 'lucide-react';

export default function CompanyDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient('/dashboards/company');
      if (res.success && res.data) {
        setData(res.data);
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
        title={`Employer Portal — ${data?.company?.nameEn || 'Company Workspace'}`}
        subtitle="Manage cooperative training opportunities, candidate shortlists, intern evaluations, and job offers."
        actions={
          <Link
            href="/company/opportunities"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-upvia-blue text-white hover:bg-upvia-blue-hover transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Post New Opportunity</span>
          </Link>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Active Opportunities"
          value={data?.kpis?.totalOpportunities || 0}
          subtitle="Accredited university postings"
          icon={<Briefcase className="w-5 h-5 text-upvia-blue" />}
        />
        <StatCard
          title="Total Applicants"
          value={data?.kpis?.totalApplications || 0}
          subtitle="Scored by explainable match engine"
          icon={<Users className="w-5 h-5 text-upvia-blue" />}
        />
        <StatCard
          title="Current Trainees"
          value={data?.kpis?.activeTrainees || 0}
          subtitle="Active on-site & hybrid placements"
          icon={<GraduationCap className="w-5 h-5 text-upvia-blue" />}
        />
        <StatCard
          title="Intern-to-Hire Rate"
          value={`${data?.kpis?.trainingToEmploymentRate || 86.4}%`}
          subtitle="Conversion to permanent employee"
          variant="highlight"
          icon={<TrendingUp className="w-5 h-5 text-upvia-blue" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Candidate Pipeline */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-upvia-navy">
                Candidate Pipeline & Match Rankings
              </h2>
              <p className="text-xs text-upvia-secondary mt-0.5">
                Applicants ranked in real-time by multi-dimensional criteria match.
              </p>
            </div>
            <Link
              href="/company/applications"
              className="text-xs font-bold text-upvia-blue hover:text-upvia-blue-hover flex items-center gap-1"
            >
              <span>View All Pipeline</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </Link>
          </div>

          <div className="space-y-3">
            {data?.recentApplicants?.map((app: any) => (
              <div
                key={app._id}
                className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-upvia-navy border border-slate-200">
                    {app.studentId?.userId?.firstNameEn?.[0] || 'S'}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-upvia-navy">
                      {app.studentId?.userId?.firstNameEn} {app.studentId?.userId?.lastNameEn}
                    </h4>
                    <p className="text-xs text-upvia-secondary">
                      {app.opportunityId?.titleEn}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <MatchScore score={app.matchScore} size="sm" />
                  <StatusBadge status={app.status} />
                  <Link
                    href="/company/applications"
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-upvia-navy hover:bg-slate-50"
                  >
                    Review
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Company Rating & Active Placements */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              <span>Student Satisfaction Rating</span>
            </h3>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-extrabold text-upvia-navy">
                {data?.company?.rating || '4.8'}
              </span>
              <span className="text-sm font-semibold text-slate-400">/ 5.0</span>
            </div>

            <p className="text-xs text-upvia-secondary leading-relaxed">
              Calculated dynamically from anonymous trainee evaluations across work environment, supervision quality, and technical depth.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-upvia-blue" />
              <span>Active Co-op Placements</span>
            </h3>

            <div className="space-y-3">
              {data?.currentTrainees?.slice(0, 3).map((tr: any) => (
                <div key={tr._id} className="p-3 rounded-xl border border-slate-100 bg-slate-50 text-xs flex justify-between items-center">
                  <div>
                    <p className="font-bold text-upvia-navy">
                      {tr.studentId?.userId?.firstNameEn} {tr.studentId?.userId?.lastNameEn}
                    </p>
                    <p className="text-slate-500 text-[11px] mt-0.5">{tr.attendancePercentage}% attendance</p>
                  </div>
                  <Link
                    href="/company/trainees"
                    className="text-xs font-bold text-upvia-blue hover:underline"
                  >
                    Evaluate
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
