'use client';

import React from 'react';
import { getInitials, generateAvatarColor } from '@/lib/helpers';

interface UserAvatarProps {
  userId?: string;
  displayName: string;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showGlow?: boolean;
}

const sizeMap = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-32 h-32 text-5xl',
};

export default function UserAvatar({ userId = '', displayName, avatarUrl, size = 'md', className = '', showGlow = false }: UserAvatarProps) {
  const avatarColor = generateAvatarColor(userId);
  const initials = getInitials(displayName);

  // If avatar URL is provided, show the image
  if (avatarUrl) {
    return (
      <div
        className={`rounded-full overflow-hidden flex-shrink-0 ${sizeMap[size]} ${className} ${showGlow ? 'ring-2 ring-accent/40 shadow-[0_0_12px_hsl(24_90%_55%/0.3)]' : ''}`}
      >
        <img
          src={avatarUrl}
          alt={displayName}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  // Fallback: solid color with initials
  return (
    <div
      className={`rounded-full ${avatarColor} flex items-center justify-center text-white font-bold flex-shrink-0 ${sizeMap[size]} ${className} ${showGlow ? 'ring-2 ring-accent/40 shadow-[0_0_12px_hsl(24_90%_55%/0.3)]' : ''}`}
    >
      {initials}
    </div>
  );
}
