'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { UpviaLogo } from '../../components/brand/UpviaLogo';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { apiClient } from '../../lib/api';
import { useI18n } from '../../lib/i18n';
import {
  Search,
  MapPin,
  Building2,
  Calendar,
  Briefcase,
  ArrowRight,
  Filter,
  GraduationCap,
} from 'lucide-react';

export default function OpportunitiesPage() {
  const { t, isRtl } = useI18n();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    fetchOpportunities();
  }, [search, typeFilter]);

  const fetchOpportunities = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient('/opportunities', {
        params: {
          search: search || undefined,
          type: typeFilter || undefined,
          limit: 20,
        },
      });
      if (res.success && res.data) {
        setOpportunities(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="h-[2px] bg-upvia-navy w-full fixed top-0 left-0 z-50" />

      {/* Header */}
      <header className="h-20 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-[2px] z-40">
        <UpviaLogo size="md" showTagline isArabic={isRtl} />
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-upvia-blue text-white hover:bg-upvia-blue-hover transition-colors shadow-xs"
          >
            {t('nav.login')}
          </Link>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-upvia-navy">
            Accredited Cooperative Training & Career Opportunities
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-upvia-secondary">
            Verified opportunities published by industry partners and approved by university academic units.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="mb-8 flex flex-col sm:flex-row items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by title, required skill, or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 rtl:pl-4 rtl:pr-9 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-upvia-blue/20"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-56 py-2 px-3 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-upvia-blue/20"
          >
            <option value="">All Opportunity Types</option>
            <option value="COOP_TRAINING">Co-op Training</option>
            <option value="SUMMER_TRAINING">Summer Training</option>
            <option value="INTERNSHIP">Internship</option>
            <option value="FULL_TIME">Full-Time Job</option>
          </select>
        </div>

        {/* Opportunities Grid */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 text-xs">
            <div className="w-8 h-8 border-2 border-upvia-blue border-t-transparent rounded-full animate-spin" />
            <span>Loading active opportunities from database...</span>
          </div>
        ) : opportunities.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 p-8 text-xs text-slate-500">
            <p>No opportunities match your current search filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {opportunities.map((opp) => (
              <div
                key={opp._id}
                className="p-6 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <StatusBadge status={opp.type} />
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                      {opp.seatsRemaining} Seats Open
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-upvia-navy leading-snug">
                    {opp.titleEn}
                  </h3>

                  <div className="mt-2 flex items-center gap-1.5 text-xs text-upvia-secondary font-medium">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{opp.companyId?.nameEn || 'Accredited Industry Partner'}</span>
                  </div>

                  <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {opp.descriptionEn}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                    {opp.requiredSkills?.slice(0, 3).map((s: any, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 font-medium"
                      >
                        {s.skillNameEn}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-slate-500">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{opp.city}</span>
                  </div>

                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1 font-bold text-upvia-blue hover:text-upvia-blue-hover"
                  >
                    <span>Apply via Portal</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
