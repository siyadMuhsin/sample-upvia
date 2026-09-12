'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';
import { useI18n } from '../../lib/i18n';
import { UpviaLogo } from '../../components/brand/UpviaLogo';
import { UserRole } from '@upvia/shared';
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
  const { login, loginAsDemo, isLoading } = useAuth();
  const { t, locale, setLocale, isRtl } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleDemoClick = async (role: UserRole) => {
    setError(null);
    try {
      await loginAsDemo(role);
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
                  placeholder="e.g. student@upvia.com"
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
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-upvia-blue/20 focus:border-upvia-blue transition-all"
                />
              </div>
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
