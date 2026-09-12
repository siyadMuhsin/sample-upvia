'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { apiClient } from '../../../lib/api';
import { BookOpen, AlertTriangle, TrendingUp, CheckCircle2, ArrowRight } from 'lucide-react';

export default function AdminSkillGapsPage() {
  const [skillGaps, setSkillGaps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSkillGaps();
  }, []);

  const fetchSkillGaps = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient('/analytics/skill-gaps');
      if (res.success && res.data) {
        setSkillGaps(res.data);
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
        title="Curriculum Skill-Gap Intelligence Engine"
        subtitle="Identifies discrepancies between actual labor market demand and university course coverage to empower Study Plan Directors."
      />

      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-upvia-blue border-t-transparent rounded-full animate-spin" />
          <span>Analyzing skill coverage across academic study plans...</span>
        </div>
      ) : skillGaps.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
          No critical skill gaps detected. Study plans are currently aligned with market demand.
        </div>
      ) : (
        <div className="space-y-4">
          {skillGaps.map((gap) => (
            <div
              key={gap._id}
              className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <StatusBadge status={gap.status} />
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-bold text-slate-600">
                    Program: {gap.programId?.nameEn || 'Software Engineering'}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-upvia-navy">{gap.skillName}</h3>

                {/* Progress Comparison Bars */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-500">Market Demand</span>
                      <span className="text-upvia-blue font-bold">{gap.marketDemandPercentage}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-upvia-blue rounded-full"
                        style={{ width: `${gap.marketDemandPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-500">Program Coverage</span>
                      <span className="text-slate-700 font-bold">{gap.programCoveragePercentage}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${gap.gapPercentage > 30 ? 'bg-rose-500' : 'bg-amber-500'}`}
                        style={{ width: `${gap.programCoveragePercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Recommended Study Plan Action */}
                <div className="mt-4 p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-950 flex items-start gap-2.5">
                  <BookOpen className="w-4 h-4 text-upvia-blue flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Recommended Curriculum Action: </span>
                    <span>{gap.recommendedAction}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start lg:items-end gap-1 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
                <span className="text-xs text-slate-400 font-semibold uppercase">Curriculum Deficit</span>
                <span className="text-3xl font-extrabold text-rose-600">
                  {gap.gapPercentage}% Gap
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
