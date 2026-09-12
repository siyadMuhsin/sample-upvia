'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { apiClient } from '../../../lib/api';
import { Users, GraduationCap, Building2, Calendar, Star } from 'lucide-react';

export default function AdminGraduatesTrackingPage() {
  const [graduates, setGraduates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchGraduates();
  }, []);

  const fetchGraduates = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient('/graduates');
      if (res.success && res.data) {
        setGraduates(res.data);
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
        title="Longitudinal Graduate Tracking & Alumni Outcomes"
        subtitle="Monitors alumni employment status, time-to-first-job, specialization alignment, and satisfaction at 3, 6, 12, and 24 months."
      />

      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-upvia-blue border-t-transparent rounded-full animate-spin" />
          <span>Loading graduate records...</span>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-xs text-left rtl:text-right border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Graduate Name</th>
                <th className="py-3 px-4">Academic Program</th>
                <th className="py-3 px-4">Graduation Year</th>
                <th className="py-3 px-4">Employment Status</th>
                <th className="py-3 px-4">Current Employer</th>
                <th className="py-3 px-4">Months to 1st Job</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {graduates.map((grad) => (
                <tr key={grad._id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 font-bold text-upvia-navy">
                    {grad.studentId?.userId?.firstNameEn} {grad.studentId?.userId?.lastNameEn}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    {grad.programId?.nameEn}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{grad.graduationYear}</td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={grad.employmentStatus} />
                  </td>
                  <td className="py-3.5 px-4 text-slate-800 font-medium">
                    {grad.currentEmployer || 'Actively Seeking'}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-upvia-blue">
                    {grad.monthsToFirstJob ? `${grad.monthsToFirstJob} months` : '---'}
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
