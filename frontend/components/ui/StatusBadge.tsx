import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const getStyle = (val: string) => {
    switch (val?.toUpperCase()) {
      case 'PUBLISHED':
      case 'ACCEPTED':
      case 'COMPLETED':
      case 'PRESENT':
      case 'GREEN':
      case 'OPTIMAL':
      case 'SUCCESS':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';

      case 'IN_TRAINING':
      case 'SHORTLISTED':
      case 'INTERVIEW':
      case 'IN_PROGRESS':
      case 'UNDER_REVIEW':
      case 'PROGRAM_REVIEW':
      case 'TRAINING_UNIT_REVIEW':
      case 'SUBMITTED':
      case 'PENDING':
        return 'bg-blue-50 text-blue-700 border-blue-200';

      case 'ORANGE':
      case 'LATE':
      case 'EXCUSED':
      case 'MODERATE_GAP':
        return 'bg-amber-50 text-amber-700 border-amber-200';

      case 'REJECTED':
      case 'WITHDRAWN':
      case 'ABSENT':
      case 'RED':
      case 'CRITICAL_GAP':
      case 'OVERDUE':
      case 'FAILED':
        return 'bg-rose-50 text-rose-700 border-rose-200';

      case 'DRAFT':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatText = (text: string) => {
    return text?.replace(/_/g, ' ');
  };

  return (
    <span
      className={`inline-flex items-center font-medium border rounded-full uppercase tracking-wider ${
        size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
      } ${getStyle(status)}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 rtl:mr-0 rtl:ml-1.5 bg-current opacity-70" />
      {formatText(status || 'UNKNOWN')}
    </span>
  );
};
