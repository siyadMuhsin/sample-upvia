'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { apiClient } from '../../../lib/api';
import { CheckCircle2, XCircle, Building2, MapPin, Calendar, DollarSign, Award } from 'lucide-react';
import { JobOfferStatus } from '@upvia/shared';

export default function StudentJobsPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient('/job-offers/my');
      if (res.success && res.data) {
        setOffers(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespond = async (offerId: string, status: JobOfferStatus) => {
    try {
      const res = await apiClient(`/job-offers/${offerId}/respond`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (res.success) {
        setMessage(`Job offer ${status.toLowerCase()}! Post-training employment record registered in database.`);
        fetchOffers();
      }
    } catch (e: any) {
      alert(e.message || 'Error responding to offer');
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Post-Training Job Offers"
        subtitle="Full-time and graduate employment offers extended by partner companies upon completing cooperative training."
      />

      {message && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-upvia-blue border-t-transparent rounded-full animate-spin" />
          <span>Loading offers...</span>
        </div>
      ) : offers.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
          No job offers extended yet. Offers submitted by employers appear here upon successful co-op completion.
        </div>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => (
            <div
              key={offer._id}
              className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2.5 mb-2">
                  <StatusBadge status={offer.status} />
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Offered on {new Date(offer.offerDate).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-upvia-navy">{offer.jobTitleEn}</h3>

                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-upvia-secondary">
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {offer.companyId?.nameEn}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {offer.city}
                  </span>
                  <span>•</span>
                  <span>{offer.employmentType}</span>
                </div>

                <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-sm">
                  <span>Compensation: SAR {offer.salary?.toLocaleString()} / month</span>
                </div>
              </div>

              {offer.status === JobOfferStatus.PENDING && (
                <div className="flex items-center gap-2.5 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                  <button
                    onClick={() => handleRespond(offer._id, JobOfferStatus.REJECTED)}
                    className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => handleRespond(offer._id, JobOfferStatus.ACCEPTED)}
                    className="px-5 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-2xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Accept Job Offer</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
