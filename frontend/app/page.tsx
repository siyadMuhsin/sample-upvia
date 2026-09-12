'use client';

import React from 'react';
import Link from 'next/link';
import { useI18n } from '../lib/i18n';
import { UpviaLogo } from '../components/brand/UpviaLogo';
import {
  ArrowRight,
  GraduationCap,
  Briefcase,
  Building2,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Languages,
  BookOpen,
  PieChart,
  Users,
  Compass,
} from 'lucide-react';

export default function LandingPage() {
  const { t, locale, setLocale, isRtl } = useI18n();

  const toggleLanguage = () => {
    setLocale(locale === 'en' ? 'ar' : 'en');
  };

  return (
    <div className="min-h-screen bg-white text-upvia-navy flex flex-col selection:bg-upvia-cyan selection:text-upvia-navy">
      {/* 2px Navy Brand Rule at Top of Viewport per Brand Guidelines */}
      <div className="h-[2px] bg-upvia-navy w-full fixed top-0 left-0 z-50" />

      {/* Global Navigation Bar */}
      <header className="border-b border-slate-100 bg-white/90 backdrop-blur-md sticky top-[2px] z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <UpviaLogo size="md" showTagline isArabic={isRtl} />

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-upvia-secondary">
            <a href="#overview" className="hover:text-upvia-navy transition-colors">
              {t('nav.overview')}
            </a>
            <a href="#universities" className="hover:text-upvia-navy transition-colors">
              {t('nav.forUniversities')}
            </a>
            <a href="#students" className="hover:text-upvia-navy transition-colors">
              {t('nav.forStudents')}
            </a>
            <a href="#companies" className="hover:text-upvia-navy transition-colors">
              {t('nav.forCompanies')}
            </a>
            <a href="#workflow" className="hover:text-upvia-navy transition-colors">
              Workflow
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-upvia-navy hover:bg-slate-50 transition-colors"
            >
              <Languages className="w-3.5 h-3.5 text-upvia-blue" />
              <span>{locale === 'en' ? 'العربية' : 'English'}</span>
            </button>

            <Link
              href="/opportunities"
              className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold text-upvia-navy hover:bg-slate-50 border border-slate-200 transition-colors"
            >
              {t('nav.opportunities')}
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-upvia-blue text-white hover:bg-upvia-blue-hover transition-colors shadow-xs"
            >
              <span>{t('nav.login')}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 overflow-hidden bg-gradient-to-b from-slate-50/50 via-white to-white">
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="max-w-3xl mx-auto text-center">
            {/* National Employability Infrastructure Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-upvia-cyan/50 bg-cyan-50/50 text-upvia-navy text-xs font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-upvia-cyan animate-pulse" />
              <span>{t('landing.badge')}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-upvia-navy leading-[1.15]">
              {t('landing.heroTitle')}
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-base sm:text-lg text-upvia-secondary font-normal leading-relaxed">
              {t('landing.heroSubtitle')}
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-upvia-navy text-white hover:bg-upvia-navy-light transition-all shadow-sm active:scale-95"
              >
                <span>{t('landing.ctaDemo')}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Link>
              <Link
                href="/opportunities"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border border-slate-300 text-upvia-navy hover:bg-slate-50 transition-all active:scale-95"
              >
                <Compass className="w-4 h-4 text-upvia-blue" />
                <span>{t('landing.ctaStudent')}</span>
              </Link>
            </div>
          </div>

          {/* Key Metric Highlight Cards */}
          <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            <div className="p-5 rounded-xl border border-slate-200/80 bg-white shadow-xs">
              <p className="text-3xl font-bold text-upvia-navy tracking-tight">{t('landing.stats.employmentRate')}</p>
              <p className="text-xs text-upvia-secondary mt-1 font-medium">{t('landing.stats.employmentRateLabel')}</p>
            </div>
            <div className="p-5 rounded-xl border border-slate-200/80 bg-white shadow-xs">
              <p className="text-3xl font-bold text-upvia-blue tracking-tight">{t('landing.stats.internConversion')}</p>
              <p className="text-xs text-upvia-secondary mt-1 font-medium">{t('landing.stats.internConversionLabel')}</p>
            </div>
            <div className="p-5 rounded-xl border border-slate-200/80 bg-white shadow-xs">
              <p className="text-3xl font-bold text-upvia-navy tracking-tight">{t('landing.stats.partnerCompanies')}</p>
              <p className="text-xs text-upvia-secondary mt-1 font-medium">{t('landing.stats.partnerCompaniesLabel')}</p>
            </div>
            <div className="p-5 rounded-xl border border-slate-200/80 bg-white shadow-xs">
              <p className="text-3xl font-bold text-upvia-navy tracking-tight">{t('landing.stats.matchedHours')}</p>
              <p className="text-xs text-upvia-secondary mt-1 font-medium">{t('landing.stats.matchedHoursLabel')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Training -> Employment Workflow Section */}
      <section id="workflow" className="py-20 bg-slate-50 border-y border-slate-200/70">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-upvia-navy">
              {t('landing.workflowTitle')}
            </h2>
            <p className="mt-3 text-sm text-upvia-secondary">
              {t('landing.workflowSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-upvia-blue font-bold text-sm flex items-center justify-center mb-3">
                1
              </div>
              <h3 className="font-bold text-sm text-upvia-navy">{t('landing.steps.step1Title')}</h3>
              <p className="mt-2 text-xs text-upvia-secondary leading-relaxed flex-1">{t('landing.steps.step1Desc')}</p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-upvia-blue font-bold text-sm flex items-center justify-center mb-3">
                2
              </div>
              <h3 className="font-bold text-sm text-upvia-navy">{t('landing.steps.step2Title')}</h3>
              <p className="mt-2 text-xs text-upvia-secondary leading-relaxed flex-1">{t('landing.steps.step2Desc')}</p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col">
              <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 font-bold text-sm flex items-center justify-center mb-3">
                3
              </div>
              <h3 className="font-bold text-sm text-upvia-navy">{t('landing.steps.step3Title')}</h3>
              <p className="mt-2 text-xs text-upvia-secondary leading-relaxed flex-1">{t('landing.steps.step3Desc')}</p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-upvia-blue font-bold text-sm flex items-center justify-center mb-3">
                4
              </div>
              <h3 className="font-bold text-sm text-upvia-navy">{t('landing.steps.step4Title')}</h3>
              <p className="mt-2 text-xs text-upvia-secondary leading-relaxed flex-1">{t('landing.steps.step4Desc')}</p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-emerald-200 bg-emerald-50/20 shadow-xs flex flex-col">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-sm flex items-center justify-center mb-3">
                5
              </div>
              <h3 className="font-bold text-sm text-emerald-950">{t('landing.steps.step5Title')}</h3>
              <p className="mt-2 text-xs text-emerald-800/80 leading-relaxed flex-1">{t('landing.steps.step5Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Triple Stakeholder Value Pillars */}
      <section id="overview" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* For Universities */}
            <div id="universities" className="p-8 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-upvia-blue flex items-center justify-center mb-6">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-upvia-navy">For Universities & Leadership</h3>
              <p className="mt-3 text-xs text-upvia-secondary leading-relaxed flex-1">
                Strategic visibility into college performance, curriculum skill gaps, accredited industry partnerships, and automated early warning signals before graduation.
              </p>
              <ul className="mt-6 space-y-2.5 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-upvia-blue flex-shrink-0" />
                  <span>Real-time employment rate aggregations</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-upvia-blue flex-shrink-0" />
                  <span>Study plan to market demand mapping</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-upvia-blue flex-shrink-0" />
                  <span>24-month longitudinal graduate tracking</span>
                </li>
              </ul>
            </div>

            {/* For Students */}
            <div id="students" className="p-8 rounded-2xl border border-upvia-cyan/40 bg-gradient-to-br from-white via-sky-50/20 to-cyan-50/30 transition-all flex flex-col shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-upvia-navy">For Students & Graduates</h3>
              <p className="mt-3 text-xs text-upvia-secondary leading-relaxed flex-1">
                Unified professional profile linked to university academic achievements, explainable matching scores, real-time interview pipelines, and post-coop job offers.
              </p>
              <ul className="mt-6 space-y-2.5 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                  <span>Verified academic transcript synchronization</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                  <span>Explainable skill gap & course advice</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                  <span>Direct co-op training accreditation</span>
                </li>
              </ul>
            </div>

            {/* For Companies */}
            <div id="companies" className="p-8 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-upvia-blue flex items-center justify-center mb-6">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-upvia-navy">For Employers & Industry</h3>
              <p className="mt-3 text-xs text-upvia-secondary leading-relaxed flex-1">
                Streamlined co-op hiring pipelines, direct access to pre-qualified talent, multi-dimensional trainee evaluations, and high-conversion post-training employment.
              </p>
              <ul className="mt-6 space-y-2.5 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-upvia-blue flex-shrink-0" />
                  <span>Accredited university opportunity postings</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-upvia-blue flex-shrink-0" />
                  <span>10-dimension intern performance rubric</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-upvia-blue flex-shrink-0" />
                  <span>1-click post-training job offer issuance</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Call to Action */}
      <section className="py-20 bg-upvia-navy text-white text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto px-6 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Explore the Platform?
          </h2>
          <p className="mt-4 text-sm text-slate-300 leading-relaxed">
            Experience Upvia live across all 15 university leadership, student, and industrial partner roles with complete pre-seeded authentic institutional data.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="px-8 py-3.5 rounded-xl text-sm font-bold bg-white text-upvia-navy hover:bg-slate-100 transition-all shadow-md active:scale-95"
            >
              Launch Interactive Demo Portals
            </Link>
          </div>
        </div>
      </section>

      {/* Enterprise Footer */}
      <footer className="border-t border-slate-200 py-12 bg-white text-xs text-upvia-secondary">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <UpviaLogo size="sm" showTagline isArabic={isRtl} />
          <div className="flex items-center gap-6">
            <span>© {new Date().getFullYear()} Upvia Enterprise Platform. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
