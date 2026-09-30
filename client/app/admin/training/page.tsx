'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { apiClient } from '../../../lib/api';
import { GraduationCap, Building2, Calendar, UserCheck, AlertTriangle } from 'lucide-react';

export default function AdminTrainingOversightPage() {
  const [trainings, setTrainings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient('/training');
      if (res.success && res.data) {
        setTrainings(res.data);
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
        title="University Cooperative Training Oversight"
        subtitle="Live monitoring of active student placements, institutional supervisor assignments, and attendance thresholds across industrial entities."
      />

      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-upvia-blue border-t-transparent rounded-full animate-spin" />
          <span>Loading placements...</span>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-xs text-left rtl:text-right border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Trainee Student</th>
                <th className="py-3 px-4">Company & Entity</th>
                <th className="py-3 px-4">Placement Opportunity</th>
                <th className="py-3 px-4">Attendance Rate</th>
                <th className="py-3 px-4">Hours Logged</th>
                <th className="py-3 px-4">Placement Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trainings.map((tr) => (
                <tr key={tr._id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 font-bold text-upvia-navy">
                    {tr.studentId?.userId?.firstNameEn} {tr.studentId?.userId?.lastNameEn}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    <span className="font-semibold">{tr.trainingEntityName}</span>
                    <p className="text-[11px] text-slate-400">{tr.companyId?.sector}</p>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {tr.opportunityId?.titleEn}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 font-bold ${
                        tr.attendancePercentage < 80 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {tr.attendancePercentage < 80 && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
                      <span>{tr.attendancePercentage}%</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-upvia-navy">{tr.totalHoursCompleted} hrs</td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={tr.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
