'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { useI18n } from '../../lib/i18n';
import { UpviaLogo } from '../brand/UpviaLogo';
import {
  LayoutDashboard,
  User,
  Briefcase,
  FileCheck,
  GraduationCap,
  Calendar,
  Building2,
  BookOpen,
  PieChart,
  FileText,
  AlertTriangle,
  History,
  LogOut,
  Menu,
  X,
  Languages,
  Bell,
  CheckCircle2,
  Landmark,
  UserPlus,
} from 'lucide-react';
import { UserRole } from '@/shared';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { user, logout, switchRole } = useAuth();
  const { locale, setLocale, t, isRtl } = useI18n();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleLanguage = () => {
    setLocale(locale === 'en' ? 'ar' : 'en');
  };

  // Base admin nav item set — every administrative/academic role sees the
  // same pages (backend RBAC further scopes what data each role can act on),
  // but the ORDER is adapted per role below so each unit's priority work
  // surfaces first instead of a one-size-fits-all list.
  type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };

  const getAdminNavItems = (role: UserRole): NavItem[] => {
    const base: NavItem[] = [
      { href: '/admin/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
      // University/user provisioning is a platform-administration concern,
      // not an academic one — restricted to Super Admin / University Admin.
      ...(role === UserRole.SUPER_ADMIN
        ? [{ href: '/admin/universities', label: t('nav.universities'), icon: Landmark }]
        : []),
      ...(role === UserRole.SUPER_ADMIN || role === UserRole.UNIVERSITY_ADMIN
        ? [{ href: '/admin/students/import', label: t('nav.studentImport'), icon: UserPlus }]
        : []),
      { href: '/admin/opportunities', label: t('nav.opportunities'), icon: Briefcase },
      { href: '/admin/training', label: t('nav.training'), icon: GraduationCap },
      { href: '/admin/companies', label: t('nav.companies'), icon: Building2 },
      { href: '/admin/graduates', label: t('nav.graduates'), icon: User },
      { href: '/admin/employment', label: t('nav.employment'), icon: PieChart },
      { href: '/admin/skill-gaps', label: t('nav.skillGaps'), icon: BookOpen },
      { href: '/admin/alerts', label: t('nav.earlyWarnings'), icon: AlertTriangle },
      { href: '/admin/reports', label: t('nav.reports'), icon: FileText },
      { href: '/admin/audit-logs', label: t('nav.auditLogs'), icon: History },
    ];

    // Dashboard always stays pinned first; everything else is reordered so
    // this role's priority pages come right after it.
    const priorityByRole: Partial<Record<UserRole, string[]>> = {
      [UserRole.STUDY_PLAN_DIRECTOR]: ['/admin/skill-gaps', '/admin/training', '/admin/opportunities'],
      [UserRole.COOPERATIVE_TRAINING_UNIT]: ['/admin/opportunities', '/admin/training', '/admin/companies'],
      [UserRole.ALUMNI_EMPLOYMENT_UNIT]: ['/admin/graduates', '/admin/employment', '/admin/reports'],
      [UserRole.UNIVERSITY_LEADERSHIP]: ['/admin/reports', '/admin/employment', '/admin/skill-gaps'],
      [UserRole.COLLEGE_DEAN]: ['/admin/reports', '/admin/employment', '/admin/skill-gaps'],
      [UserRole.COLLEGE_VICE_DEAN]: ['/admin/reports', '/admin/employment', '/admin/skill-gaps'],
    };

    const priority = priorityByRole[role];
    if (!priority) return base;

    const dashboard = base.find((i) => i.href === '/admin/dashboard')!;
    const rest = base.filter((i) => i.href !== '/admin/dashboard');
    const prioritized = priority
      .map((href) => rest.find((i) => i.href === href))
      .filter((i): i is NavItem => !!i);
    const remaining = rest.filter((i) => !priority.includes(i.href));

    return [dashboard, ...prioritized, ...remaining];
  };

  // Build role-specific sidebar navigation
  const getNavItems = (): NavItem[] => {
    const role = user?.role || UserRole.STUDENT;

    if (role === UserRole.STUDENT) {
      return [
        { href: '/student/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
        { href: '/student/profile', label: t('nav.profile'), icon: User },
        { href: '/student/opportunities', label: t('nav.opportunities'), icon: Briefcase },
        { href: '/student/applications', label: t('nav.applications'), icon: FileCheck },
        { href: '/student/training', label: t('nav.training'), icon: GraduationCap },
        { href: '/student/jobs', label: t('nav.jobOffers'), icon: CheckCircle2 },
      ];
    }

    if (role.startsWith('COMPANY') || role === UserRole.TRAINING_ENTITY_SUPERVISOR) {
      return [
        { href: '/company/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
        { href: '/company/opportunities', label: t('nav.opportunities'), icon: Briefcase },
        { href: '/company/applications', label: t('nav.applications'), icon: FileCheck },
        { href: '/company/trainees', label: t('nav.trainees'), icon: GraduationCap },
      ];
    }

    // University Admin, Leadership, Deans, Coordinators, Training Unit, Alumni Unit, etc.
    return getAdminNavItems(role);
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 2px Navy Brand Rule at Top of Viewport per Brand Guidelines */}
      <div className="h-[2px] bg-upvia-navy w-full fixed top-0 left-0 z-50" />

      <div className="flex flex-1 pt-[2px]">
        {/* Desktop Navy Sidebar - Fixed, non-scrollable outer container */}
        <aside className="hidden lg:flex flex-col w-64 bg-upvia-navy text-white flex-shrink-0 border-r rtl:border-r-0 rtl:border-l border-upvia-navy-dark select-none fixed top-[2px] bottom-0 left-0 rtl:left-auto rtl:right-0 z-40 h-[calc(100vh-2px)] overflow-hidden">
          <div className="p-6 border-b border-white/10 flex items-center justify-between flex-shrink-0">
            <UpviaLogo variant="light" size="md" showTagline isArabic={isRtl} />
          </div>

          {/* Navigation Links - Scrollable inner list if items exceed height */}
          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto sidebar-scroll min-h-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-upvia-blue text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-upvia-cyan' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Logout Bottom Bar - Pinned at bottom */}
          <div className="p-4 border-t border-white/10 bg-black/10 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-upvia-blue/40 border border-upvia-cyan/30 flex items-center justify-center font-bold text-xs text-upvia-cyan">
                  {user?.firstNameEn?.[0] || 'U'}
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-white truncate">
                    {user?.firstNameEn} {user?.lastNameEn}
                  </p>
                  <p className="text-[10px] text-sky-200/70 uppercase tracking-wider truncate">
                    {user?.role?.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                title={t('nav.logout')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar Drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative w-64 max-w-[80vw] bg-upvia-navy text-white flex flex-col z-50">
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <UpviaLogo variant="light" size="sm" isArabic={isRtl} />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium ${
                        isActive ? 'bg-upvia-blue text-white' : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-upvia-cyan" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content Viewport - offset by sidebar width on desktop */}
        <div className="flex-1 flex flex-col min-w-0 lg:ms-64">
          {/* Topbar */}
          <header className="h-16 bg-white border-b border-slate-200/80 px-4 md:px-8 flex items-center justify-between sticky top-[2px] z-30">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="hidden sm:block text-xs font-semibold text-upvia-secondary">
                {t('brand.descriptor')}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Dynamic Role Switcher for admin@gmail.com / SUPER_ADMIN */}
              {(user?.email === 'admin@gmail.com' || user?.role === UserRole.SUPER_ADMIN) && (
                <div className="hidden sm:flex items-center gap-1.5">
                  <select
                    value={user.role}
                    onChange={(e) => switchRole(e.target.value as UserRole)}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-blue-200 bg-blue-50 text-blue-900 focus:outline-none focus:ring-1 focus:ring-upvia-blue cursor-pointer shadow-2xs"
                    title="Switch active role on the fly"
                  >
                    <option value={UserRole.SUPER_ADMIN}>👑 Super Admin</option>
                    <option value={UserRole.STUDENT}>🎓 Student</option>
                    <option value={UserRole.COMPANY_ADMIN}>🏢 Company Admin</option>
                    <option value={UserRole.UNIVERSITY_LEADERSHIP}>🏛 University Leadership</option>
                    <option value={UserRole.PROGRAM_COORDINATOR}>📋 Program Coordinator</option>
                    <option value={UserRole.COLLEGE_DEAN}>👨‍🏫 College Dean</option>
                    <option value={UserRole.COOPERATIVE_TRAINING_UNIT}>💼 Training Unit Head</option>
                    <option value={UserRole.TRAINING_ENTITY_SUPERVISOR}>👷 Company Supervisor</option>
                  </select>
                </div>
              )}

              {/* Language Switcher */}
              <button
                onClick={toggleLanguage}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-upvia-navy hover:bg-slate-50 transition-colors"
              >
                <Languages className="w-3.5 h-3.5 text-upvia-blue" />
                <span>{locale === 'en' ? 'العربية' : 'English'}</span>
              </button>

              {/* Notification Center Trigger */}
              <div className="relative">
                <button
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors relative"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              {/* Top User Pill */}
              <div className="hidden sm:flex items-center gap-2 pl-2 rtl:pl-0 rtl:pr-2 border-l rtl:border-l-0 rtl:border-r border-slate-200 text-xs">
                <span className="font-semibold text-upvia-navy">
                  {user?.firstNameEn || 'User'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                  {user?.role?.split('_')[0]}
                </span>
              </div>
            </div>
          </header>

          {/* Page Body */}
          <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
