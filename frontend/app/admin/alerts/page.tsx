'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { apiClient } from '../../../lib/api';
import { AlertTriangle, ShieldCheck, Play, CheckCircle2, RefreshCw } from 'lucide-react';

export default function AdminAlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<string | null>(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient('/early-warnings');
      if (res.success && res.data) {
        setAlerts(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunEvaluation = async () => {
    setIsEvaluating(true);
    setEvalResult(null);
    try {
      const res = await apiClient('/early-warnings/evaluate', {
        method: 'POST',
      });
      if (res.success) {
        setEvalResult(res.message || 'Evaluation completed');
        fetchAlerts();
      }
    } catch (e: any) {
      alert(e.message || 'Error running evaluation');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const res = await apiClient(`/early-warnings/${alertId}/resolve`, {
        method: 'PATCH',
      });
      if (res.success) {
        fetchAlerts();
      }
    } catch (e: any) {
      alert(e.message || 'Error resolving alert');
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Predictive Early Warning & Quality Assurance System"
        subtitle="Automated institutional heuristics monitoring student graduation risks, low-placement cohorts, attendance anomalies, and industrial partner milestones."
        actions={
          <button
            onClick={handleRunEvaluation}
            disabled={isEvaluating}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-upvia-navy text-white hover:bg-upvia-navy-light transition-colors shadow-xs disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
            <span>{isEvaluating ? 'Evaluating Rules...' : 'Run Rules Evaluation Engine'}</span>
          </button>
        }
      />

      {evalResult && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{evalResult}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-upvia-blue border-t-transparent rounded-full animate-spin" />
          <span>Scanning institutional records...</span>
        </div>
      ) : alerts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
          All systems optimal. No unresolved early warnings currently detected.
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert._id}
              className={`p-6 rounded-2xl border bg-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                alert.severity === 'RED'
                  ? 'border-rose-200'
                  : alert.severity === 'ORANGE'
                  ? 'border-amber-200'
                  : 'border-emerald-200'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <StatusBadge status={alert.severity} />
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-bold text-slate-600">
                    Category: {alert.category}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500">
                    Target: {alert.entityName || alert.entityType}
                  </span>
                </div>

                <h3 className="text-base font-bold text-upvia-navy">{alert.titleEn}</h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">{alert.descriptionEn}</p>
              </div>

              <div className="border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 flex items-center">
                <button
                  onClick={() => handleResolveAlert(alert._id)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-upvia-navy hover:bg-slate-50 transition-colors"
                >
                  Mark as Resolved
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
