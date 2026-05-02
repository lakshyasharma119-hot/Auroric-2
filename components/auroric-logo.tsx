'use client';

import React from 'react';

interface AuroricLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { img: 24 },
  md: { img: 32 },
  lg: { img: 48 },
  xl: { img: 72 },
};

const textSizeMap = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-2xl',
  xl: 'text-4xl',
};

export default function AuroricLogo({ size = 'md', showText = true, className = '' }: AuroricLogoProps) {
  const { img } = sizeMap[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="flex-shrink-0 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-syne font-bold"
        style={{ width: img, height: img, fontSize: img * 0.55 }}
      >
        A
      </div>
      {showText && (
        <span className={`font-bold text-accent font-syne tracking-tight ${textSizeMap[size]}`}>
          Auroric
        </span>
      )}
    </div>
  );
}
