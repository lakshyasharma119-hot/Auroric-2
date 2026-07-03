'use client';

import React, { useState } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import SubscriptionBadge from '@/components/ui/SubscriptionBadge';
import Toast from '@/components/toast';
import { Check, X, Crown, Sparkles, Tag, ArrowRight } from 'lucide-react';
import Link from 'next/link';

/* ─────────────────── Plan Data ─────────────────── */

interface PlanBenefit {
  text: string;
  included: boolean;
}

interface PlanTier {
  id: 'free' | 'monthly' | 'yearly';
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  originalMonthly: number | null;
  originalYearly: number | null;
  badge: 'free' | 'monthly' | 'yearly';
  accentColor: string;
  benefits: PlanBenefit[];
  isBestValue?: boolean;
  ctaLabel: string;
  ctaDisabled?: boolean;
}

const PLANS: PlanTier[] = [
  {
    id: 'free',
    name: 'Basic',
    tagline: 'For creators taking their first steps',
    monthlyPrice: 0,
    yearlyPrice: 0,
    originalMonthly: null,
    originalYearly: null,
    badge: 'free',
    accentColor: 'text-foreground/60',
    ctaLabel: 'Current Plan',
    ctaDisabled: true,
    benefits: [
      { text: 'E2EE messaging (24-hour auto-delete)', included: true },
      { text: '4 standard themes', included: true },
      { text: 'Basic search visibility', included: true },
      { text: 'No verified badge', included: false },
      { text: 'No premium themes', included: false },
    ],
  },
  {
    id: 'monthly',
    name: 'Auroric Plus',
    tagline: 'Elevated connection and personalization',
    monthlyPrice: 9.99,
    yearlyPrice: 119.88,
    originalMonthly: 29.99,
    originalYearly: 359.88,
    badge: 'monthly',
    accentColor: 'text-[#1D9BF0]',
    ctaLabel: 'Subscribe — Coming Soon',
    benefits: [
      { text: 'Blue Verified Badge on your profile', included: true },
      { text: '15-day E2EE chat history', included: true },
      { text: '100 MB secure chat storage', included: true },
      { text: 'Premium themes: Obsidian & Crimson + Quiet Luxury', included: true },
      { text: 'Priority search ranking', included: true },
      { text: 'Everything in Basic', included: true },
    ],
  },
  {
    id: 'yearly',
    name: 'Auroric Prime',
    tagline: 'The ultimate luxury experience',
    monthlyPrice: 8.33,
    yearlyPrice: 99.99,
    originalMonthly: 27.50,
    originalYearly: 329.99,
    badge: 'yearly',
    accentColor: 'text-[#D4A843]',
    isBestValue: true,
    ctaLabel: 'Subscribe — Coming Soon',
    benefits: [
      { text: 'Golden Verified Badge (glows/shines)', included: true },
      { text: '30-day E2EE chat history', included: true },
      { text: '500 MB secure chat storage', included: true },
      { text: 'All themes unlocked', included: true },
      { text: 'Top search ranking (appears before Plus users)', included: true },
      { text: 'Everything in Plus', included: true },
    ],
  },
];

const DEMO_PROMO_CODE = 'AURORIC20';

/* ─────────────────── Component ─────────────────── */

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [promoCode, setPromoCode] = useState('');
  const [promoState, setPromoState] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  const handleSubscribeClick = () => {
    setToast({ message: '🚀 Payment coming soon! Join the waitlist.', type: 'info' });
  };

  const handleApplyPromo = () => {
    if (promoCode.trim().toUpperCase() === DEMO_PROMO_CODE) {
      setPromoState('valid');
    } else {
      setPromoState('invalid');
    }
  };

  const formatPrice = (price: number) => {
    if (price === 0) return '$0';
    return `$${price.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 w-full py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── Header ── */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Choose Your Plan
            </h1>
            <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
              Unlock premium features, exclusive themes, and priority visibility.
              Elevate your Auroric experience.
            </p>
          </div>

          {/* ── Billing Toggle ── */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm font-medium transition-colors duration-300 ${billingCycle === 'monthly' ? 'text-foreground' : 'text-foreground/40'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
              className="relative w-16 h-8 rounded-full bg-card border border-border/30 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-colors duration-300"
              aria-label="Toggle billing cycle"
            >
              <div
                className={`absolute top-1 w-6 h-6 rounded-full transition-all duration-300 ease-out ${
                  billingCycle === 'yearly'
                    ? 'left-[calc(100%-28px)] bg-[#D4A843] shadow-[0_0_10px_rgba(212,168,67,0.5)]'
                    : 'left-1 bg-accent'
                }`}
              />
            </button>
            <span className={`text-sm font-medium transition-colors duration-300 ${billingCycle === 'yearly' ? 'text-foreground' : 'text-foreground/40'}`}>
              Yearly
            </span>
            {billingCycle === 'yearly' && (
              <span className="text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30 rounded-full px-3 py-1 animate-slideUp">
                Save 16% vs monthly
              </span>
            )}
          </div>

          {/* ── Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {PLANS.map((plan) => {
              let displayPrice = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
              let originalPrice = billingCycle === 'monthly' ? plan.originalMonthly : plan.originalYearly;
              let periodLabel = billingCycle === 'monthly' ? '/mo' : '/yr';
              let subtext = '';

              if (plan.id === 'monthly') {
                displayPrice = plan.monthlyPrice;
                originalPrice = plan.originalMonthly;
                periodLabel = '/mo';
                subtext = 'Billed monthly';
              } else if (plan.id === 'yearly') {
                displayPrice = plan.yearlyPrice;
                originalPrice = plan.originalYearly;
                periodLabel = '/yr';
                if (billingCycle === 'monthly') {
                  subtext = '(Billed annually — equivalent to $8.33/mo)';
                } else {
                  subtext = 'Billed annually';
                }
              }

              // Apply promo discount
              let finalPrice = displayPrice;
              let showPromoDiscount = false;
              if (promoState === 'valid' && plan.id !== 'free') {
                finalPrice = Math.round(displayPrice * 0.8 * 100) / 100;
                showPromoDiscount = true;
              }

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-2xl border backdrop-blur-md transition-all duration-500 ease-out ${
                    plan.isBestValue
                      ? 'bg-white/[0.07] border-[#D4A843]/40 shadow-[0_0_30px_rgba(212,168,67,0.12)] scale-[1.02]'
                      : 'bg-white/[0.04] border-white/10 hover:border-white/20'
                  } p-6 md:p-8`}
                >
                  {/* Best Value ribbon */}
                  {plan.isBestValue && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#D4A843] to-[#F5D76E] text-black text-xs font-bold px-4 py-1 rounded-full shadow-lg flex items-center gap-1">
                      <Crown className="w-3 h-3" /> Best Value
                    </div>
                  )}

                  {/* Plan Name + Badge */}
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`text-xl font-bold ${plan.accentColor}`}>{plan.name}</h3>
                    <SubscriptionBadge tier={plan.badge} size="md" />
                  </div>
                  <p className="text-sm text-foreground/50 mb-6">{plan.tagline}</p>

                  {/* Price */}
                  <div className="mb-6 min-h-[96px] flex flex-col justify-end">
                    {originalPrice !== null && (
                      <p className="text-sm text-foreground/40 line-through mb-1">
                        {formatPrice(originalPrice)}{periodLabel}
                      </p>
                    )}
                    {showPromoDiscount && (
                      <p className="text-sm text-foreground/40 line-through mb-1">
                        {formatPrice(displayPrice)}{periodLabel}
                      </p>
                    )}
                    <div className="flex items-baseline gap-1">
                      <span className={`text-4xl font-bold ${plan.id === 'yearly' ? 'text-[#D4A843]' : plan.id === 'monthly' ? 'text-[#1D9BF0]' : 'text-foreground'}`}>
                        {formatPrice(finalPrice)}
                      </span>
                      {plan.id !== 'free' && (
                        <span className="text-foreground/40 text-sm">{periodLabel}</span>
                      )}
                    </div>
                    {subtext && (
                      <p className="text-xs text-foreground/50 mt-1">{subtext}</p>
                    )}
                    {showPromoDiscount && (
                      <p className="text-xs text-green-400 font-semibold mt-1 flex items-center gap-1">
                        <Tag className="w-3 h-3" /> 20% off applied!
                      </p>
                    )}
                  </div>

                  {/* CTA */}
                  <button
                    onClick={plan.ctaDisabled ? undefined : handleSubscribeClick}
                    disabled={plan.ctaDisabled}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300 mb-8 ${
                      plan.ctaDisabled
                        ? 'bg-foreground/10 text-foreground/30 cursor-not-allowed'
                        : plan.id === 'yearly'
                          ? 'bg-gradient-to-r from-[#D4A843] to-[#F5D76E] text-black hover:opacity-90 shadow-[0_0_20px_rgba(212,168,67,0.2)]'
                          : 'bg-[#1D9BF0] text-white hover:bg-[#1A8CD8] shadow-[0_0_20px_rgba(29,155,240,0.15)]'
                    }`}
                  >
                    {plan.ctaLabel}
                  </button>

                  {/* Benefits */}
                  <ul className="space-y-3 flex-1">
                    {plan.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        {benefit.included ? (
                          <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-foreground/20 mt-0.5 shrink-0" />
                        )}
                        <span className={benefit.included ? 'text-foreground/80' : 'text-foreground/30'}>
                          {benefit.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* ── Promo Code ── */}
          <div className="max-w-md mx-auto">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-6">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4 text-accent" /> Have a promo code?
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={e => { setPromoCode(e.target.value); setPromoState('idle'); }}
                  placeholder="Enter code"
                  className="flex-1 bg-background/50 border border-border/30 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all uppercase tracking-wider"
                />
                <button
                  onClick={handleApplyPromo}
                  className="luxury-button px-5 py-2.5 text-sm flex items-center gap-1.5"
                >
                  Apply <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              {promoState === 'valid' && (
                <p className="text-sm text-green-400 mt-3 flex items-center gap-1.5 animate-slideUp">
                  <Sparkles className="w-4 h-4" /> 20% off applied! Discount reflected above.
                </p>
              )}
              {promoState === 'invalid' && (
                <p className="text-sm text-red-400 mt-3 animate-slideUp">
                  Invalid code. Please check and try again.
                </p>
              )}
            </div>
          </div>

          {/* ── Footer CTA ── */}
          <div className="text-center mt-16">
            <p className="text-foreground/40 text-sm">
              Questions? <a href="mailto:support@auroric.com" className="text-accent hover:underline">Contact our team</a>
            </p>
          </div>

        </div>
      </main>

      <Footer />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={4000}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
