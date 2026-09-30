import React, { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon?: ReactNode;
  variant?: 'default' | 'highlight';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  variant = 'default',
}) => {
  return (
    <div
      className={`rounded-xl p-5 border transition-all duration-200 bg-white shadow-sm ${
        variant === 'highlight'
          ? 'border-upvia-cyan/40 bg-gradient-to-br from-white via-sky-50/20 to-cyan-50/30'
          : 'border-slate-200/80 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-upvia-secondary uppercase tracking-wider">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-upvia-navy">
              {value}
            </span>
            {trend && (
              <span
                className={`text-xs font-medium inline-flex items-center px-1.5 py-0.5 rounded ${
                  trend.isPositive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-rose-50 text-rose-700'
                }`}
              >
                {trend.isPositive ? '+' : ''}
                {trend.value}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 line-clamp-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="p-2.5 rounded-lg bg-slate-50 text-upvia-blue border border-slate-100 flex-shrink-0">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
