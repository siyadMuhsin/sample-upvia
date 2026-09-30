'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { useI18n } from '../../lib/i18n';
import { UpviaLogo } from '../../components/brand/UpviaLogo';
import { UserRole } from '@/shared';
import {
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  AlertCircle,
  GraduationCap,
  Building2,
  ShieldCheck,
  Languages,
} from 'lucide-react';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const { login, loginAsDemo, isLoading } = useAuth();
  const { t, locale, setLocale, isRtl } = useI18n();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const [email, setEmail] = useState('admin@gmail.com');
  const [password, setPassword] = useState('admin@123');
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password, returnUrl, selectedRole || undefined);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleDemoClick = async (role: UserRole) => {
    setError(null);
    try {
      await loginAsDemo(role, returnUrl);
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-6">
      {/* 2px Navy Brand Rule */}
      <div className="h-[2px] bg-upvia-navy w-full fixed top-0 left-0 z-50" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-6">
          <UpviaLogo size="lg" showTagline isArabic={isRtl} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-upvia-navy">
          {t('nav.login')}
        </h2>
        <p className="mt-1.5 text-xs text-upvia-secondary">
          Enter your credentials or choose a pre-configured demo portal below.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/90 rounded-2xl sm:px-10">
          {/* Universal Sample Credentials Banner */}
          <div className="mb-5 p-3.5 rounded-xl bg-blue-50/80 border border-blue-200/80 text-xs text-blue-900">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold flex items-center gap-1.5 text-upvia-blue">
                <Sparkles className="w-3.5 h-3.5" /> Sample Credentials (All Roles)
              </span>
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@gmail.com');
                  setPassword('admin@123');
                }}
                className="text-[11px] font-semibold text-upvia-blue hover:underline cursor-pointer"
              >
                Auto-Fill
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 font-mono">
              <div>
                Email: <span className="font-bold text-slate-800">admin@gmail.com</span>
              </div>
              <div>
                Pass: <span className="font-bold text-slate-800">admin@123</span>
              </div>
            </div>
            <p className="mt-1.5 text-[10px] text-blue-700/80">
              This master login can access all 15 roles. Pick a role below or use 1-click portals.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Standard Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Email Address</label>
              <div className="mt-1 relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@gmail.com"
                  className="w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-upvia-blue/20 focus:border-upvia-blue transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Password</label>
              <div className="mt-1 relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="admin@123"
                  className="w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-upvia-blue/20 focus:border-upvia-blue transition-all"
                />
              </div>
            </div>

            {/* Target Role Dropdown (for admin@gmail.com all-roles access) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Target Role (Optional for admin@gmail.com)
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="mt-1 w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-upvia-blue/20 focus:border-upvia-blue transition-all text-slate-700"
              >
                <option value="">Default (Super Admin / Auto-detect)</option>
                <option value={UserRole.STUDENT}>Student (Ziyad - Software Eng)</option>
                <option value={UserRole.COMPANY_ADMIN}>Company Admin (STC Employer)</option>
                <option value={UserRole.UNIVERSITY_LEADERSHIP}>University Leadership (Executive)</option>
                <option value={UserRole.PROGRAM_COORDINATOR}>Program Coordinator (Approvals)</option>
                <option value={UserRole.COLLEGE_DEAN}>College Dean (Dean of Computing)</option>
                <option value={UserRole.COOPERATIVE_TRAINING_UNIT}>Co-op Training Unit Head</option>
                <option value={UserRole.TRAINING_ENTITY_SUPERVISOR}>Company Field Supervisor</option>
                <option value={UserRole.SUPER_ADMIN}>Super Admin (System Governance)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-upvia-blue text-white hover:bg-upvia-blue-hover transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Role Selector */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-1.5 mb-3 text-xs font-bold uppercase tracking-wider text-upvia-secondary">
              <Sparkles className="w-3.5 h-3.5 text-upvia-cyan" />
              <span>Instant 1-Click Role Switcher</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoClick(UserRole.STUDENT)}
                disabled={isLoading}
                className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/50 text-blue-900 font-medium text-left rtl:text-right transition-colors flex items-center gap-2"
              >
                <GraduationCap className="w-4 h-4 text-upvia-blue flex-shrink-0" />
                <div className="truncate">
                  <p className="font-bold truncate">Student</p>
                  <p className="text-[10px] text-blue-700/80 truncate">Ziyad (Software Eng)</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoClick(UserRole.UNIVERSITY_LEADERSHIP)}
                disabled={isLoading}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-upvia-navy font-medium text-left rtl:text-right transition-colors flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-slate-700 flex-shrink-0" />
                <div className="truncate">
                  <p className="font-bold truncate">Leadership</p>
                  <p className="text-[10px] text-slate-500 truncate">University Executive</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoClick(UserRole.COMPANY_ADMIN)}
                disabled={isLoading}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-upvia-navy font-medium text-left rtl:text-right transition-colors flex items-center gap-2"
              >
                <Building2 className="w-4 h-4 text-upvia-blue flex-shrink-0" />
                <div className="truncate">
                  <p className="font-bold truncate">Company Admin</p>
                  <p className="text-[10px] text-slate-500 truncate">STC Employer</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoClick(UserRole.PROGRAM_COORDINATOR)}
                disabled={isLoading}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-upvia-navy font-medium text-left rtl:text-right transition-colors flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div className="truncate">
                  <p className="font-bold truncate">Coordinator</p>
                  <p className="text-[10px] text-slate-500 truncate">Academic Approvals</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoClick(UserRole.COLLEGE_DEAN)}
                disabled={isLoading}
                className="p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/50 text-purple-900 font-medium text-left rtl:text-right transition-colors flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <div className="truncate">
                  <p className="font-bold truncate">College Dean</p>
                  <p className="text-[10px] text-purple-700/80 truncate">Computing Dean</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoClick(UserRole.SUPER_ADMIN)}
                disabled={isLoading}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-upvia-navy font-medium text-left rtl:text-right transition-colors flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-slate-900 flex-shrink-0" />
                <div className="truncate">
                  <p className="font-bold truncate">Super Admin</p>
                  <p className="text-[10px] text-slate-500 truncate">admin@gmail.com</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-4">
          <Link href="/" className="hover:text-upvia-navy underline">
            Return to Homepage
          </Link>
          <span>•</span>
          <button
            onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
            className="inline-flex items-center gap-1 hover:text-upvia-navy"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{locale === 'en' ? 'العربية' : 'English'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
