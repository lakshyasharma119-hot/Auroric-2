'use client';

import React from 'react';

export interface SubscriptionBadgeProps {
  tier: 'free' | 'monthly' | 'yearly';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const PIXEL_SIZES = { sm: 14, md: 18, lg: 24 } as const;

/**
 * Subscription-tier badge component.
 *
 * - `free`    → renders nothing
 * - `monthly` → blue filled-circle checkmark (Twitter/X style)
 * - `yearly`  → golden filled-circle checkmark with a CSS glow
 *
 * The `tier` prop MUST come from the server-verified user object —
 * do NOT read from localStorage or any client-side store to prevent spoofing.
 */
export default function SubscriptionBadge({ tier, size = 'md', className = '' }: SubscriptionBadgeProps) {
  if (tier === 'free' || !tier) return null;

  const px = PIXEL_SIZES[size];

  const isYearly = tier === 'yearly';

  // Colors
  const circleFill = isYearly ? '#D4A843' : '#1D9BF0'; // gold vs Twitter blue
  const glowColor  = isYearly ? 'rgba(212, 168, 67, 0.6)' : 'none';

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      title={isYearly ? 'Auroric Prime' : 'Auroric Plus'}
      style={{
        width: px,
        height: px,
        filter: isYearly ? `drop-shadow(0 0 4px ${glowColor})` : undefined,
      }}
    >
      <svg
        width={px}
        height={px}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Gradient for yearly glow */}
        {isYearly && (
          <defs>
            <linearGradient id="gold-badge-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F5D76E" />
              <stop offset="50%" stopColor="#D4A843" />
              <stop offset="100%" stopColor="#B8860B" />
            </linearGradient>
            {/* Shimmer animation */}
            <linearGradient id="gold-shimmer" x1="-100%" y1="0%" x2="200%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.35)" />
              <stop offset="100%" stopColor="transparent" />
              <animateTransform
                attributeName="gradientTransform"
                type="translate"
                values="-1 0; 2 0"
                dur="3s"
                repeatCount="indefinite"
              />
            </linearGradient>
          </defs>
        )}
        {/* Filled circle */}
        <circle
          cx="12"
          cy="12"
          r="11"
          fill={isYearly ? 'url(#gold-badge-gradient)' : circleFill}
        />
        {/* Shimmer overlay for yearly */}
        {isYearly && (
          <circle cx="12" cy="12" r="11" fill="url(#gold-shimmer)" />
        )}
        {/* Checkmark */}
        <path
          d="M7.5 12.5L10.5 15.5L16.5 9"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </span>
  );
}
