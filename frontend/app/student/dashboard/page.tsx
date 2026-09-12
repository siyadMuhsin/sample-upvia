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
import { useI18n } from '../../../lib/i18n';
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  ArrowRight,
  MapPin,
  Clock,
  BookOpen,
  Award,
  AlertCircle,
} from 'lucide-react';

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient('/dashboards/student');
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
        title={`Good morning, ${user?.firstNameEn || 'Student'}`}
        subtitle="Here is your personal employability roadmap, co-op placement progress, and matched opportunities."
        actions={
          <Link
            href="/student/opportunities"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-upvia-blue text-white hover:bg-upvia-blue-hover transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-upvia-cyan" />
            <span>Explore Matches</span>
          </Link>
        }
      />

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Profile Completion"
          value={`${data?.student?.profileCompletionScore || 85}%`}
          subtitle="Verified by SIS transcript"
          variant="highlight"
          icon={<Award className="w-5 h-5 text-upvia-blue" />}
        />
        <StatCard
          title="Active Applications"
          value={data?.recentApplications?.length || 0}
          subtitle="In recruiter review pipeline"
          icon={<Briefcase className="w-5 h-5 text-upvia-blue" />}
        />
        <StatCard
          title="Upcoming Interviews"
          value={data?.upcomingInterviews?.length || 0}
          subtitle="Scheduled this week"
          icon={<Calendar className="w-5 h-5 text-upvia-blue" />}
        />
        <StatCard
          title="Co-op Attendance"
          value={`${data?.activeTraining?.attendancePercentage || 96.5}%`}
          subtitle="Accreditation status active"
          icon={<GraduationCap className="w-5 h-5 text-upvia-blue" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Recommended Opportunities & Active Training */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Co-op Placement Tracker */}
          {data?.activeTraining && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                    Active Cooperative Training Placement
                  </h2>
                </div>
                <StatusBadge status={data.activeTraining.status} />
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-base text-upvia-navy">
                    {data.activeTraining.trainingEntityName}
                  </h3>
                  <p className="text-xs text-upvia-secondary mt-0.5">
                    Sector: {data.activeTraining.companyId?.sector || 'Energy & Technology'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right rtl:text-left">
                    <p className="text-xs text-slate-500">Attendance</p>
                    <p className="text-base font-bold text-emerald-600">
                      {data.activeTraining.attendancePercentage}%
                    </p>
                  </div>
                  <Link
                    href="/student/training"
                    className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-upvia-navy text-white hover:bg-upvia-navy-light transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Recommended Opportunities with Explainable Match Scores */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-upvia-navy">
                  Algorithm-Matched Opportunities
                </h2>
                <p className="text-xs text-upvia-secondary mt-0.5">
                  Ranked by curriculum compatibility, skill taxonomy, and academic eligibility.
                </p>
              </div>
              <Link
                href="/student/opportunities"
                className="text-xs font-bold text-upvia-blue hover:text-upvia-blue-hover flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </Link>
            </div>

            <div className="space-y-4">
              {data?.recommendedOpportunities?.map((opp: any) => (
                <div
                  key={opp._id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <MatchScore
                        score={opp.matchScore}
                        breakdown={opp.matchDetails?.breakdown}
                        matchedSkills={opp.matchDetails?.matchedSkills}
                        missingSkills={opp.matchDetails?.missingSkills}
                        recommendedCourses={opp.matchDetails?.recommendedCourses}
                        explanation={opp.matchExplanation}
                        size="sm"
                      />
                      <span className="text-[11px] font-medium text-slate-500">
                        {opp.companyId?.nameEn}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-upvia-navy">
                      {opp.titleEn}
                    </h4>

                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {opp.city}
                      </span>
                      <span>•</span>
                      <span>{opp.workMode}</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-medium">
                        {opp.seatsRemaining} seats left
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/student/opportunities`}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-upvia-blue text-white hover:bg-upvia-blue-hover transition-colors text-center shadow-2xs"
                  >
                    Apply Now
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Upcoming Interviews, Pending Offers & Profile Summary */}
        <div className="space-y-8">
          {/* Pending Job Offers Alert Card */}
          {data?.pendingJobOffers?.length > 0 && (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 p-6 rounded-2xl border border-emerald-200/80 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Job Offer Extended!</span>
              </div>
              <h3 className="text-base font-bold text-emerald-950">
                {data.pendingJobOffers[0].jobTitleEn}
              </h3>
              <p className="text-xs text-emerald-800 mt-1">
                Employer: {data.pendingJobOffers[0].companyId?.nameEn}
              </p>
              <p className="text-sm font-extrabold text-emerald-900 mt-2">
                SAR {data.pendingJobOffers[0].salary.toLocaleString()} / month
              </p>
              <Link
                href="/student/jobs"
                className="mt-4 inline-flex items-center justify-center w-full py-2 px-3 text-xs font-bold rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-2xs"
              >
                Review & Accept Offer
              </Link>
            </div>
          )}

          {/* Upcoming Technical Interviews */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-upvia-blue" />
              <span>Upcoming Interviews</span>
            </h3>

            {data?.upcomingInterviews?.length > 0 ? (
              <div className="space-y-3">
                {data.upcomingInterviews.map((iv: any) => (
                  <div key={iv._id} className="p-3 rounded-xl border border-slate-100 bg-slate-50 text-xs">
                    <p className="font-bold text-upvia-navy">
                      {iv.companyId?.nameEn}
                    </p>
                    <p className="text-slate-500 mt-0.5">{iv.time}</p>
                    <p className="text-blue-700 font-medium mt-1.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(iv.date).toLocaleDateString()}</span>
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No interviews scheduled today.</p>
            )}
          </div>

          {/* Academic Profile Snapshot (SIS Synchronized) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600 mb-4 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-upvia-blue" />
              <span>Academic Snapshot</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Student ID</span>
                <span className="font-bold text-upvia-navy">{data?.student?.studentId}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Cumulative GPA</span>
                <span className="font-bold text-upvia-navy">{data?.student?.gpa} / {data?.student?.maxGpa}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Completed Credits</span>
                <span className="font-bold text-upvia-navy">{data?.student?.creditsCompleted} Credits</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Specialization</span>
                <span className="font-bold text-upvia-navy">{data?.student?.specialization}</span>
              </div>
            </div>

            <Link
              href="/student/profile"
              className="mt-5 block text-center py-2 px-3 text-xs font-semibold rounded-lg border border-slate-200 text-upvia-navy hover:bg-slate-50 transition-colors"
            >
              Manage Full Profile & CV
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
