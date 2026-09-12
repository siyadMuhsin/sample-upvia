import React from 'react';
import Link from 'next/link';

interface UpviaLogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  href?: string;
  isArabic?: boolean;
}

export const UpviaLogo: React.FC<UpviaLogoProps> = ({
  variant = 'dark',
  size = 'md',
  showTagline = false,
  href = '/',
  isArabic = false,
}) => {
  const isLight = variant === 'light';

  const markSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  const markPixelSizes = {
    sm: 24,
    md: 32,
    lg: 40,
  };

  const Content = (
    <div className="inline-flex items-center gap-2.5 select-none">
      {/* Upvia Logotype Mark: U with rising right stroke & 45deg blue-to-cyan gradient */}
      <div
        className={`relative ${markSizes[size]} flex-shrink-0`}
        style={{ width: markPixelSizes[size], height: markPixelSizes[size] }}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          width={markPixelSizes[size]}
          height={markPixelSizes[size]}
          style={{ width: markPixelSizes[size], height: markPixelSizes[size], display: 'block' }}
        >
          <defs>
            <linearGradient id="upviaBrandGradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1A56DB" />
              <stop offset="100%" stopColor="#22D3EE" />
            </linearGradient>
          </defs>
          {/* U base and rising stroke */}
          <path
            d="M22 28 V62 C22 76 34 86 50 86 C66 86 78 76 78 62 V14 H62 V62 C62 68 57 72 50 72 C43 72 38 68 38 62 V28 H22 Z"
            fill="url(#upviaBrandGradient)"
          />
          {/* Subtle cyan pixel accent dots per brand guidelines */}
          <rect x="22" y="14" width="8" height="8" rx="1.5" fill="#22D3EE" />
        </svg>
      </div>

      {/* Wordmark and optional descriptor */}
      <div className="flex flex-col">
        <span
          className={`font-bold tracking-tight leading-none ${textSizes[size]} ${
            isLight ? 'text-white' : 'text-upvia-navy'
          }`}
        >
          {isArabic ? 'أبفيا' : 'upvia'}
        </span>
        {showTagline && (
          <span
            className={`text-[9px] tracking-wider uppercase font-medium mt-0.5 ${
              isLight ? 'text-sky-200' : 'text-upvia-secondary'
            }`}
          >
            {isArabic ? 'ارتقِ • احمِ • تقدّم' : 'Upgrade • Protect • Move Forward'}
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{Content}</Link>;
  }

  return Content;
};
