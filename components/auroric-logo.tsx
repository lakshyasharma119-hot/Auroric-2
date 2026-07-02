'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTheme } from '@/lib/theme-context';

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
  const { mode } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Dark-mode themes (standard_dark, obsidian_crimson, fiery_sunset, modern_editorial) → light logo
  // Light-mode themes (standard_light, quiet_luxury) → dark logo
  const logoSrc = mounted
    ? mode === 'dark'
      ? '/logo-light-bgremoved.png'
      : '/logo-dark-bgremoved.png'
    : '/logo-dark-bgremoved.png'; // SSR fallback

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="relative flex-shrink-0"
        style={{ width: img, height: img }}
      >
        <Image
          src={logoSrc}
          alt="Auroric Logo"
          width={img}
          height={img}
          className="object-contain w-full h-full"
        />
      </div>
      {showText && (
        <span className={`font-bold text-accent font-syne tracking-tight ${textSizeMap[size]}`}>
          Auroric
        </span>
      )}
    </div>
  );
}
