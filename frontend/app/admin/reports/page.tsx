'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { apiClient } from '../../../lib/api';
import {
  FileText,
  Download,
  History,
  BarChart3,
  CheckCircle2,
  Layers,
  FileSpreadsheet,
  Building2,
  GraduationCap,
  Briefcase,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface ReportOption {
  id: string;
  title: string;
  description: string;
  icon: any;
  category: string;
}

const REPORT_OPTIONS: ReportOption[] = [
  {
    id: 'EMPLOYMENT_REPORT',
    title: 'Employment & Labor Market Report',
    description: 'Comprehensive graduate placement metrics, salary distributions, sectors, and job titles.',
    icon: Briefcase,
    category: 'Labor Intelligence',
  },
  {
    id: 'TRAINING_REPORT',
    title: 'Co-op Training Placements Report',
    description: 'Student internship status, supervisor allocations, milestone progress, and attendance rates.',
    icon: GraduationCap,
    category: 'Academic Training',
  },
  {
    id: 'COMPANIES_PERFORMANCE_REPORT',
    title: 'Industrial Partners Performance',
    description: 'Partner evaluation scores, student ratings, training-to-employment conversion rates.',
    icon: Building2,
    category: 'Industry Partnerships',
  },
  {
    id: 'SKILL_GAPS_REPORT',
    title: 'Academic Skill Gap Analysis',
    description: 'Program-level curriculum deficits versus live employer job postings and market demand.',
    icon: BarChart3,
    category: 'Curriculum Strategy',
  },
  {
    id: 'GRADUATE_TRACKING_REPORT',
    title: 'Longitudinal Graduate Tracking',
    description: 'Cohort survey responses and employment verification at 3, 6, 12, and 24-month intervals.',
    icon: Layers,
    category: 'Institutional Accreditation',
  },
];

export default function AdminReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string>('EMPLOYMENT_REPORT');
  const [format, setFormat] = useState<'JSON' | 'CSV'>('CSV');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportResult, setReportResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await apiClient('/reports/history');
      if (res.success && res.data) {
        setHistory(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setMessage(null);
    setReportResult(null);

    try {
      if (format === 'CSV') {
        const token = typeof window !== 'undefined' ? localStorage.getItem('upvia_token') : null;
        const response = await fetch('http://localhost:5000/api/v1/reports/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            reportType: selectedReport,
            format: 'CSV',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate CSV report');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `upvia-${selectedReport.toLowerCase()}-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setMessage(`CSV export for ${selectedReport} generated and downloaded successfully.`);
        fetchHistory();
      } else {
        const res = await apiClient('/reports/generate', {
          method: 'POST',
          body: JSON.stringify({
            reportType: selectedReport,
            format: 'JSON',
          }),
        });

        if (res.success && res.data) {
          setReportResult(res.data);
          setMessage(`JSON dataset compiled successfully (${res.data.totalRecords} records found).`);
          fetchHistory();
        }
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message || 'Report generation failed'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadJsonResult = () => {
    if (!reportResult) return;
    const blob = new Blob([JSON.stringify(reportResult.data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `upvia-${selectedReport.toLowerCase()}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <AppShell>
      <PageHeader
        title="Institutional Reports & Enterprise Data Exports"
        subtitle="Extract auditable datasets for national accreditation, university leadership, training unit audits, and labor market intelligence."
      />

      {message && (
        <div className={`mb-6 p-4 rounded-xl border text-xs font-semibold flex items-center gap-2.5 ${
          message.startsWith('Error')
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          {message.startsWith('Error') ? (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          )}
          <span>{message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Report Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-sm font-semibold text-upvia-navy mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-upvia-blue" />
              <span>Select Accreditation / Operational Domain</span>
            </h3>

            <div className="space-y-3">
              {REPORT_OPTIONS.map((opt) => {
                const IconComponent = opt.icon;
                const isSelected = selectedReport === opt.id;
                return (
                  <label
                    key={opt.id}
                    onClick={() => setSelectedReport(opt.id)}
                    className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-upvia-blue bg-blue-50/40 ring-1 ring-upvia-blue'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-upvia-blue text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900">{opt.title}</h4>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                          {opt.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{opt.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Export Format Selector */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <h4 className="text-xs font-semibold text-slate-700 mb-3">Export File Format</h4>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormat('CSV')}
                  className={`p-4 rounded-xl border flex items-center justify-center gap-3 text-xs font-semibold transition-all ${
                    format === 'CSV'
                      ? 'border-upvia-blue bg-blue-50/50 text-upvia-blue ring-1 ring-upvia-blue'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>CSV (Spreadsheet & Excel)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('JSON')}
                  className={`p-4 rounded-xl border flex items-center justify-center gap-3 text-xs font-semibold transition-all ${
                    format === 'JSON'
                      ? 'border-upvia-blue bg-blue-50/50 text-upvia-blue ring-1 ring-upvia-blue'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>JSON (Raw API & Data Pipeline)</span>
                </button>
              </div>
            </div>

            {/* Generate Button */}
            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-upvia-blue text-white hover:bg-upvia-blue-dark transition-colors shadow-xs disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Compiling Institutional Dataset...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Generate & {format === 'CSV' ? 'Download CSV' : 'Preview Dataset'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* JSON Preview Box */}
          {reportResult && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-upvia-navy">Data Preview: {reportResult.reportType}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {reportResult.totalRecords} records extracted directly from MongoDB
                  </p>
                </div>
                <button
                  onClick={downloadJsonResult}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download JSON</span>
                </button>
              </div>

              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono max-h-80 overflow-y-auto overflow-x-auto leading-relaxed">
                <pre>{JSON.stringify(reportResult.data.slice(0, 5), null, 2)}</pre>
                {reportResult.data.length > 5 && (
                  <div className="mt-3 pt-3 border-t border-slate-700 text-slate-400 text-[11px] italic">
                    ... and {reportResult.data.length - 5} more records in full export.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Export History & Audit Trail */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-upvia-navy flex items-center gap-2">
                <History className="w-4 h-4 text-upvia-blue" />
                <span>Recent Export Log</span>
              </h3>
              <button
                onClick={fetchHistory}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                title="Refresh log"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {isLoadingHistory ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading export audit logs...</div>
            ) : history.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No exports have been generated in this session yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {history.map((item, idx) => (
                  <div key={item._id || idx} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{item.title}</span>
                      <StatusBadge status={item.status || 'COMPLETED'} />
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                      <span>{item.format}</span>
                      <span>•</span>
                      <span>{new Date(item.createdAt || item.generatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-upvia-navy to-upvia-navy-light rounded-2xl p-6 text-white shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-upvia-cyan mb-2">Compliance Note</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              All data exports comply with national university data governance standards. Field-level data is anonymized
              where required, and full audit logs are recorded for institutional accreditation reviews.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
