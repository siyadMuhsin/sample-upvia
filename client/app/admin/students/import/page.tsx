'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AppShell } from '../../../../components/layout/AppShell';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { RequireRole } from '../../../../components/layout/RequireRole';
import { apiClient } from '../../../../lib/api';
import { useAuth } from '../../../../lib/auth-context';
import { useToast } from '../../../../components/ui/Toast';
import { useConfirm } from '../../../../components/ui/ConfirmDialog';
import { UserRole } from '@/shared';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Users,
  Landmark,
} from 'lucide-react';

const CSV_COLUMNS = [
  'email',
  'fullName',
  'studentIdNumber',
  'programId',
  'gpa',
  'creditsCompleted',
  'expectedGraduationDate',
  'passedCourses',
];

const TEMPLATE_CSV = [
  CSV_COLUMNS.join(','),
  'jane.student@university.edu.sa,Jane Student,STU-2024-0001,<programId>,3.6,88,2027-06-01,"CS101,CS102"',
].join('\n');

interface BulkImportResult {
  totalProcessed: number;
  successCount: number;
  createdCount: number;
  updatedCount: number;
  created: Array<{ row: number; email: string; studentId: string; status: 'created' | 'updated'; activationLink?: string }>;
  errors: Array<{ row: number; email?: string; reason: string }>;
}

interface CsvPreview {
  headers: string[];
  rowCount: number;
  missingColumns: string[];
}

export default function AdminStudentImportPage() {
  return (
    <AppShell>
      <RequireRole allowed={[UserRole.SUPER_ADMIN, UserRole.UNIVERSITY_ADMIN]}>
        <StudentImportPageContent />
      </RequireRole>
    </AppShell>
  );
}

function StudentImportPageContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [universities, setUniversities] = useState<any[]>([]);
  const [selectedUniversityId, setSelectedUniversityId] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvContent, setCsvContent] = useState<string | null>(null);
  const [preview, setPreview] = useState<CsvPreview | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [copiedRow, setCopiedRow] = useState<number | null>(null);

  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

  useEffect(() => {
    if (isSuperAdmin) fetchUniversities();
  }, [isSuperAdmin]);

  const fetchUniversities = async () => {
    try {
      const res = await apiClient('/admin/universities');
      if (res.success && res.data) setUniversities(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'upvia-student-import-template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Lightweight client-side preflight: just enough to catch an obviously
  // wrong file (missing columns) before spending a round trip on it. The
  // authoritative row-by-row validation still happens server-side.
  const buildPreview = (content: string): CsvPreview => {
    const lines = content.split(/\r\n|\r|\n/).filter((l) => l.trim().length > 0);
    const headers = (lines[0] || '').split(',').map((h) => h.trim());
    const missingColumns = CSV_COLUMNS.filter((c) => !headers.includes(c));
    return { headers, rowCount: Math.max(0, lines.length - 1), missingColumns };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || '');
      setCsvContent(content);
      setPreview(buildPreview(content));
    };
    reader.onerror = () => {
      showToast('Could not read the selected file.', 'error');
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!csvContent) return;
    if (isSuperAdmin && !selectedUniversityId) {
      showToast('Select a university to import students into.', 'error');
      return;
    }

    const ok = await confirm({
      title: 'Run bulk student import?',
      description: `This will create or update ${preview?.rowCount ?? 'multiple'} student profile(s) directly in the database. Rows matched by email will overwrite the existing academic profile. This cannot be undone.`,
      confirmLabel: 'Import Students',
      variant: 'warning',
    });
    if (!ok) return;

    setIsUploading(true);
    setResult(null);
    try {
      const body: Record<string, string> = { csv: csvContent };
      if (isSuperAdmin) body.universityId = selectedUniversityId;

      const res = await apiClient('/admin/students/bulk-import', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (res.success && res.data) {
        setResult(res.data);
        showToast(
          `Import complete: ${res.data.successCount} succeeded, ${res.data.errors.length} failed.`,
          res.data.errors.length > 0 ? 'info' : 'success'
        );
      }
    } catch (err: any) {
      showToast(err.message || 'Bulk import failed.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const copyLink = async (row: number, link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedRow(row);
      setTimeout(() => setCopiedRow(null), 2000);
    } catch {
      showToast('Could not copy link — please copy it manually.', 'error');
    }
  };

  return (
    <>
      <PageHeader
        title="Bulk Student Import"
        subtitle="Upload a CSV to provision student accounts and academic profiles in one batch."
        actions={
          <button
            onClick={downloadTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-upvia-navy hover:bg-slate-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download CSV Template</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            {isSuperAdmin && (
              <label className="block">
                <span className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Target University <span className="text-rose-500">*</span>
                </span>
                <div className="relative">
                  <Landmark className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={selectedUniversityId}
                    onChange={(e) => setSelectedUniversityId(e.target.value)}
                    className="input-field pl-9 rtl:pl-3 rtl:pr-9"
                  >
                    <option value="">Select a university...</option>
                    {universities.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.nameEn} ({u.code})
                      </option>
                    ))}
                  </select>
                </div>
              </label>
            )}

            <label className="flex flex-col items-center justify-center gap-2 p-8 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:border-upvia-blue/50 hover:bg-blue-50/20 transition-colors cursor-pointer text-center">
              <UploadCloud className="w-8 h-8 text-upvia-blue" />
              <span className="text-xs font-semibold text-upvia-navy">
                {fileName || 'Click to select a .csv file, or drag it here'}
              </span>
              <span className="text-[11px] text-slate-400">
                Required columns: {CSV_COLUMNS.join(', ')}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>

            {preview && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                  preview.missingColumns.length > 0
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                {preview.missingColumns.length > 0 ? (
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  {preview.missingColumns.length > 0 ? (
                    <p>
                      <span className="font-bold">Missing required column(s):</span>{' '}
                      {preview.missingColumns.join(', ')}. Fix the header row before uploading.
                    </p>
                  ) : (
                    <p>
                      <span className="font-bold">{preview.rowCount} row(s)</span> detected with all required
                      columns present. Ready to upload.
                    </p>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!csvContent || isUploading || (preview?.missingColumns.length ?? 0) > 0}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-upvia-blue text-white hover:bg-upvia-blue-dark transition-colors shadow-xs disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing Batch...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Upload & Process</span>
                </>
              )}
            </button>
          </div>

          {result && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatBlock label="Processed" value={result.totalProcessed} />
                <StatBlock label="Created" value={result.createdCount} tone="emerald" />
                <StatBlock label="Updated" value={result.updatedCount} tone="blue" />
                <StatBlock label="Failed" value={result.errors.length} tone={result.errors.length > 0 ? 'rose' : undefined} />
              </div>

              {result.created.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2.5">
                    Successful Rows ({result.created.length})
                  </h4>
                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-xs text-left rtl:text-right">
                      <thead className="bg-slate-50 text-slate-500 font-semibold uppercase">
                        <tr>
                          <th className="py-2 px-3">Row</th>
                          <th className="py-2 px-3">Email</th>
                          <th className="py-2 px-3">Student ID</th>
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3">Activation Link</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {result.created.map((row) => (
                          <tr key={row.row}>
                            <td className="py-2 px-3 text-slate-500">{row.row}</td>
                            <td className="py-2 px-3 text-slate-800">{row.email}</td>
                            <td className="py-2 px-3 font-mono text-slate-600">{row.studentId}</td>
                            <td className="py-2 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  row.status === 'created'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}
                              >
                                {row.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              {row.activationLink ? (
                                <button
                                  onClick={() => copyLink(row.row, row.activationLink!)}
                                  className="inline-flex items-center gap-1 text-upvia-blue font-semibold hover:underline"
                                >
                                  {copiedRow === row.row ? (
                                    <Check className="w-3 h-3" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                  <span>{copiedRow === row.row ? 'Copied' : 'Copy Link'}</span>
                                </button>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {result.errors.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 mb-2.5">
                    Row-Level Errors ({result.errors.length})
                  </h4>
                  <div className="space-y-1.5">
                    {result.errors.map((err, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg border border-rose-200/70 bg-rose-50/40 flex items-center justify-between text-xs gap-3"
                      >
                        <span className="font-semibold text-rose-900">
                          Row {err.row}{err.email ? ` (${err.email})` : ''}
                        </span>
                        <span className="text-rose-700 text-right rtl:text-left">{err.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-sm font-semibold text-upvia-navy mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-upvia-blue" />
              <span>CSV Format</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              One row per student. <code className="text-[11px] bg-slate-100 px-1 py-0.5 rounded">programId</code> must
              be an existing program's identifier (see <code className="text-[11px] bg-slate-100 px-1 py-0.5 rounded">/academic/programs</code>).
              Wrap <code className="text-[11px] bg-slate-100 px-1 py-0.5 rounded">passedCourses</code> in quotes if it
              contains multiple comma-separated course codes.
            </p>
            <div className="bg-slate-900 text-slate-100 p-3 rounded-xl text-[11px] font-mono overflow-x-auto">
              {CSV_COLUMNS.join(',')}
            </div>
          </div>

          <div className="bg-gradient-to-br from-upvia-navy to-upvia-navy-light rounded-2xl p-6 text-white shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-upvia-cyan mb-2">Good to Know</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              A row matching an existing student's email updates their academic profile instead of creating a
              duplicate. New students are created with an inactive account and a one-time activation link — hand it
              to them directly to let them set their own password.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function StatBlock({ label, value, tone }: { label: string; value: number; tone?: 'emerald' | 'blue' | 'rose' }) {
  const toneClass = tone
    ? { emerald: 'text-emerald-600', blue: 'text-upvia-blue', rose: 'text-rose-600' }[tone]
    : 'text-upvia-navy';
  return (
    <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 text-center">
      <p className={`text-xl font-bold ${toneClass}`}>{value}</p>
      <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  );
}
