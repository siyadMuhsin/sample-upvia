'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/ui/PageHeader';
import { RequireRole } from '../../../components/layout/RequireRole';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { apiClient } from '../../../lib/api';
import { useToast } from '../../../components/ui/Toast';
import { UserRole } from '@/shared';
import { Landmark, Plus, X, Copy, Check, ShieldCheck } from 'lucide-react';

interface UniversityFormState {
  nameEn: string;
  nameAr: string;
  code: string;
  city: string;
  country: string;
  domain: string;
  contactEmail: string;
  website: string;
}

interface AdminFormState {
  email: string;
  firstNameEn: string;
  lastNameEn: string;
  role: UserRole.UNIVERSITY_ADMIN | UserRole.UNIVERSITY_LEADERSHIP;
}

const EMPTY_UNIVERSITY: UniversityFormState = {
  nameEn: '',
  nameAr: '',
  code: '',
  city: '',
  country: 'Saudi Arabia',
  domain: '',
  contactEmail: '',
  website: '',
};

const EMPTY_ADMIN: AdminFormState = {
  email: '',
  firstNameEn: '',
  lastNameEn: '',
  role: UserRole.UNIVERSITY_ADMIN,
};

export default function AdminUniversitiesPage() {
  return (
    <AppShell>
      <RequireRole allowed={[UserRole.SUPER_ADMIN]}>
        <UniversitiesPageContent />
      </RequireRole>
    </AppShell>
  );
}

function UniversitiesPageContent() {
  const { showToast } = useToast();
  const [universities, setUniversities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [university, setUniversity] = useState<UniversityFormState>(EMPTY_UNIVERSITY);
  const [admin, setAdmin] = useState<AdminFormState>(EMPTY_ADMIN);
  const [activationResult, setActivationResult] = useState<{ link: string; expiresAt: string } | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    fetchUniversities();
  }, []);

  const fetchUniversities = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient('/admin/universities');
      if (res.success && res.data) setUniversities(res.data);
    } catch (e) {
      console.error(e);
      showToast('Failed to load universities.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setUniversity(EMPTY_UNIVERSITY);
    setAdmin(EMPTY_ADMIN);
    setActivationResult(null);
    setLinkCopied(false);
  };

  const openModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await apiClient('/admin/universities', {
        method: 'POST',
        body: JSON.stringify({ university, admin }),
      });

      if (res.success && res.data) {
        setActivationResult({ link: res.data.activationLink, expiresAt: res.data.activationExpiresAt });
        showToast('University provisioned successfully.', 'success');
        fetchUniversities();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to provision university.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyLink = async () => {
    if (!activationResult) return;
    try {
      await navigator.clipboard.writeText(activationResult.link);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      showToast('Could not copy link — please copy it manually.', 'error');
    }
  };

  return (
    <>
      <PageHeader
        title="University Onboarding"
        subtitle="Register new institutions and provision their primary University Admin account."
        actions={
          <button
            onClick={openModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-upvia-blue text-white hover:bg-upvia-blue-dark transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New University</span>
          </button>
        }
      />

      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-upvia-blue border-t-transparent rounded-full animate-spin" />
          <span>Loading universities...</span>
        </div>
      ) : universities.length === 0 ? (
        <div className="py-20 text-center text-xs text-slate-400">No universities registered yet.</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-xs text-left rtl:text-right border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">University</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Domain</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {universities.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                        <Landmark className="w-4 h-4 text-upvia-blue" />
                      </div>
                      <span className="font-bold text-upvia-navy">{u.nameEn}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-mono">{u.code}</td>
                  <td className="py-3.5 px-4 text-slate-600">{u.city}</td>
                  <td className="py-3.5 px-4 text-slate-500">{u.domain || '—'}</td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={u.isActive ? 'ACTIVE' : 'REVIEW'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-left rtl:text-right max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-upvia-navy">Provision New University</h3>
                <p className="text-xs text-upvia-secondary">Creates the institution and its first admin account.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-sm">
              {activationResult ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-emerald-800">
                      <p className="font-bold">University provisioned successfully.</p>
                      <p className="mt-1">
                        There's no email service configured yet — copy the activation link below and deliver it to the
                        new admin directly. It expires{' '}
                        {new Date(activationResult.expiresAt).toLocaleString()}.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={activationResult.link}
                      className="flex-1 px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 font-mono truncate"
                    />
                    <button
                      onClick={copyLink}
                      className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-upvia-navy text-white hover:bg-upvia-navy-light transition-colors flex-shrink-0"
                    >
                      {linkCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{linkCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                      Institution Details
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Name (English)" required>
                        <input
                          required
                          value={university.nameEn}
                          onChange={(e) => setUniversity({ ...university, nameEn: e.target.value })}
                          className="input-field"
                        />
                      </FormField>
                      <FormField label="Name (Arabic)" required>
                        <input
                          required
                          dir="rtl"
                          value={university.nameAr}
                          onChange={(e) => setUniversity({ ...university, nameAr: e.target.value })}
                          className="input-field"
                        />
                      </FormField>
                      <FormField label="Code (e.g. KSU)" required>
                        <input
                          required
                          value={university.code}
                          onChange={(e) => setUniversity({ ...university, code: e.target.value.toUpperCase() })}
                          className="input-field"
                        />
                      </FormField>
                      <FormField label="City" required>
                        <input
                          required
                          value={university.city}
                          onChange={(e) => setUniversity({ ...university, city: e.target.value })}
                          className="input-field"
                        />
                      </FormField>
                      <FormField label="Institutional Domain">
                        <input
                          placeholder="ksu.edu.sa"
                          value={university.domain}
                          onChange={(e) => setUniversity({ ...university, domain: e.target.value })}
                          className="input-field"
                        />
                      </FormField>
                      <FormField label="Contact Email">
                        <input
                          type="email"
                          value={university.contactEmail}
                          onChange={(e) => setUniversity({ ...university, contactEmail: e.target.value })}
                          className="input-field"
                        />
                      </FormField>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                      Primary Admin Account
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Email" required>
                        <input
                          type="email"
                          required
                          value={admin.email}
                          onChange={(e) => setAdmin({ ...admin, email: e.target.value })}
                          className="input-field"
                        />
                      </FormField>
                      <FormField label="Portal Access Level">
                        <select
                          value={admin.role}
                          onChange={(e) => setAdmin({ ...admin, role: e.target.value as AdminFormState['role'] })}
                          className="input-field"
                        >
                          <option value={UserRole.UNIVERSITY_ADMIN}>University Admin</option>
                          <option value={UserRole.UNIVERSITY_LEADERSHIP}>University Leadership</option>
                        </select>
                      </FormField>
                      <FormField label="First Name" required>
                        <input
                          required
                          value={admin.firstNameEn}
                          onChange={(e) => setAdmin({ ...admin, firstNameEn: e.target.value })}
                          className="input-field"
                        />
                      </FormField>
                      <FormField label="Last Name" required>
                        <input
                          required
                          value={admin.lastNameEn}
                          onChange={(e) => setAdmin({ ...admin, lastNameEn: e.target.value })}
                          className="input-field"
                        />
                      </FormField>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold bg-upvia-blue text-white hover:bg-upvia-blue-dark transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>Provision University</span>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold text-slate-600 mb-1">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </span>
      {children}
    </label>
  );
}
