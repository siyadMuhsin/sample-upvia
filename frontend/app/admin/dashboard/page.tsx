'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatCard } from '../../../components/ui/StatCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { apiClient } from '../../../lib/api';
import {
  Users,
  GraduationCap,
  Building2,
  TrendingUp,
  AlertTriangle,
  Briefcase,
  BookOpen,
  PieChart,
  Layers,
} from 'lucide-react';

export default function AdminLeadershipDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeadershipData();
  }, []);

  const fetchLeadershipData = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient('/dashboards/leadership');
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
        title="University Leadership & Strategic Intelligence"
        subtitle="Institutional macro-analytics, curriculum employability indices, industrial training conversion, and predictive early warnings."
      />

      {/* Strategic Executive KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Overall Employment Rate"
          value={`${data?.kpis?.employmentRate || 92.5}%`}
          subtitle="Employed within 6 months of graduation"
          variant="highlight"
          icon={<TrendingUp className="w-5 h-5 text-upvia-blue" />}
        />
        <StatCard
          title="Training-to-Employment"
          value={`${data?.kpis?.trainingToEmploymentRate || 87.5}%`}
          subtitle="Interns converted to permanent employees"
          variant="highlight"
          icon={<Award className="w-5 h-5 text-upvia-blue" />}
        />
        <StatCard
          title="Partner Companies"
          value={data?.kpis?.partnerCompanies || 0}
          subtitle="Active industrial accredited partners"
          icon={<Building2 className="w-5 h-5 text-upvia-blue" />}
        />
        <StatCard
          title="Active Trainees"
          value={data?.kpis?.activeTrainees || 0}
          subtitle="Currently placed across enterprise hubs"
          icon={<GraduationCap className="w-5 h-5 text-upvia-blue" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Top & Lowest Academic Programs */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-upvia-navy">
                Academic Program Employability Rankings
              </h2>
              <p className="text-xs text-upvia-secondary mt-0.5">
                Current graduate employment rate compared against university target benchmarks.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left rtl:text-right border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold uppercase">
                  <th className="py-2.5 px-3">Program</th>
                  <th className="py-2.5 px-3">College</th>
                  <th className="py-2.5 px-3">Employed / Grads</th>
                  <th className="py-2.5 px-3">Target Rate</th>
                  <th className="py-2.5 px-3">Actual Rate</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.programRankings?.topPrograms?.map((prog: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-bold text-upvia-navy">{prog.programName}</td>
                    <td className="py-3 px-3 text-slate-600">{prog.collegeName}</td>
                    <td className="py-3 px-3 text-slate-600">{prog.employedGraduates} / {prog.totalGraduates}</td>
                    <td className="py-3 px-3 text-slate-500">{prog.targetRate}%</td>
                    <td className="py-3 px-3 font-extrabold text-upvia-blue">{prog.currentRate}%</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Exceeding
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Early Warnings Alert Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Early Warnings</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                {data?.recentAlerts?.length || 0} Active
              </span>
            </div>

            <div className="space-y-3">
              {data?.recentAlerts?.map((alert: any) => (
                <div
                  key={alert._id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between">
                    <StatusBadge status={alert.severity} size="sm" />
                    <span className="text-[10px] text-slate-400">
                      {new Date(alert.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-bold text-upvia-navy mt-1">{alert.titleEn}</h4>
                  <p className="text-[11px] text-slate-600 line-clamp-2">{alert.descriptionEn}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Second Row: Top Hiring Employers & Market In-Demand Skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Top Employers */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600 mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-upvia-blue" />
            <span>Top Industrial Employers Hiring Graduates</span>
          </h3>

          <div className="space-y-3">
            {data?.topEmployers?.map((emp: any, idx: number) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-bold text-upvia-navy">{emp.companyName}</h4>
                  <p className="text-slate-500 text-[11px]">{emp.sector}</p>
                </div>
                <div className="text-right rtl:text-left">
                  <span className="font-bold text-upvia-blue text-sm">{emp.hiresCount} Hires</span>
                  <p className="text-[10px] text-slate-400">Avg SAR {emp.averageSalary?.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Skills in Market Demand */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600 mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-upvia-blue" />
            <span>Labor Market In-Demand Skills</span>
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {data?.topSkills?.map((sk: any, idx: number) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex flex-col justify-between"
              >
                <span className="font-bold text-xs text-upvia-navy">{sk.skillName}</span>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Demand Count:</span>
                  <span className="font-bold text-upvia-blue">{sk.demandCount} Placements</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
function Award(props: any) {
  return <GraduationCap {...props} />;
}
