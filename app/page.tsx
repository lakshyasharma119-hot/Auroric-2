'use client';

import React, { useState, useMemo } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import PinCard from '@/components/pin-card';
import { TypedMasonryGrid } from '@/components/masonry-grid';
import type { MasonryItem } from '@/components/masonry-grid';
import AntiGravityGallery from '@/components/anti-gravity-gallery';
import OrganicBlobs from '@/components/organic-blobs';
import { ArrowRight, Flame, Compass, Zap } from 'lucide-react';
import Link from 'next/link';
import { useApp } from '@/lib/app-context';
import type { Pin } from '@/lib/types';
import { motion } from 'framer-motion';

const AnimatedLetter = ({ char }: { char: string }) => {
  return (
    <motion.span
      className="inline-block relative origin-center"
      whileHover={{ 
        scale: 1.3, 
        color: 'hsl(var(--accent))',
        textShadow: '0px 0px 20px hsl(var(--accent) / 0.6)',
        zIndex: 10,
      } as any}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 10 }}
    >
      {char}
    </motion.span>
  );
};

const AnimatedText = ({ text, className = '' }: { text: string; className?: string }) => {
  return (
    <span className={className}>
      {text.split('').map((char, index) => {
        if (char === ' ') return <span key={index}>&nbsp;</span>;
        return <AnimatedLetter key={index} char={char} />;
      })}
    </span>
  );
};

export default function Home() {
  const { pins, isLoggedIn, currentUser, openAuthModal } = useApp();
  const [visibleCount, setVisibleCount] = useState(12);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(pins.map(p => p.category).filter(Boolean));
    return Array.from(cats).slice(0, 8);
  }, [pins]);

  // Sort by engagement score (pre-computed at write time) with fallback
  // to the old likes+saves+comments heuristic for legacy data.
  const feedPins = useMemo(() => {
    let filtered = pins.filter(p => !p.isPrivate);
    if (activeCategory) filtered = filtered.filter(p => p.category === activeCategory);
    return filtered
      .sort((a, b) => (b.engagementScore ?? 0) - (a.engagementScore ?? 0))
      .slice(0, Math.min(visibleCount, 50)); // HARD CAP of 50 per spec
  }, [pins, visibleCount, activeCategory]);

  const topTrendingPins = useMemo(() => {
    return [...pins]
      .filter(p => !p.isPrivate)
      .sort((a, b) => (b.engagementScore ?? 0) - (a.engagementScore ?? 0))
      .slice(0, 10);
  }, [pins]);

  const loadMore = () => setVisibleCount(prev => prev + 12);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <OrganicBlobs />

      {/* Hero — editorial, atmospheric */}
      <section className="w-full relative overflow-hidden bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-6 pb-12 lg:pt-8 lg:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 rounded-full bg-accent" />
                <span className="text-sm font-medium text-accent tracking-wide uppercase mono">Curate · Create · Discover</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight cursor-default flex flex-col items-start gap-1">
                <div><AnimatedText text="Your visual" /></div>
                <div>
                  <AnimatedText text="universe" className="gradient-brand" />
                  <AnimatedText text="," />
                </div>
                <div><AnimatedText text="organized." /></div>
              </h1>

              <p className="text-base sm:text-lg text-foreground/55 max-w-lg leading-relaxed">
                Collect ideas that inspire you. Build boards that tell stories.
                Share what moves you with a community that gets it.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                {isLoggedIn ? (
                  <>
                    <Link href="/create" className="luxury-button flex items-center justify-center gap-2.5">
                      <Zap className="w-4 h-4" />
                      Create a Pin
                    </Link>
                    <Link href="/explore" className="luxury-button-outline flex items-center justify-center gap-2.5">
                      <Compass className="w-4 h-4" />
                      Explore
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/explore" className="luxury-button flex items-center justify-center gap-2.5">
                      <Compass className="w-4 h-4" />
                      Start Exploring
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Right side — Anti-Gravity Gallery */}
            <div className="hidden lg:block relative w-full h-[600px] lg:h-[700px]">
              <AntiGravityGallery pins={topTrendingPins} />
            </div>
          </div>
        </div>
      </section>

      {/* Category Pills */}
      <div className="w-full border-b border-border/30 bg-background/80 backdrop-blur-sm sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-2.5 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap smooth-transition ${!activeCategory
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-card/60 text-foreground/60 hover:text-foreground hover:bg-card'
                }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap smooth-transition ${activeCategory === cat
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-card/60 text-foreground/60 hover:text-foreground hover:bg-card'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feed */}
      <main className="flex-1 w-full py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div className="flex items-center gap-3">
              <Flame className="w-5 h-5 text-accent" />
              <h2 className="text-xl sm:text-2xl font-bold">
                {isLoggedIn && currentUser
                  ? `Welcome back, ${currentUser.displayName.split(' ')[0]}`
                  : 'Staff Picks'}
              </h2>
            </div>
            <Link href="/explore" className="flex items-center gap-1.5 text-sm text-foreground/50 hover:text-accent smooth-transition group">
              See all <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 smooth-transition" />
            </Link>
          </div>

          {feedPins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Compass className="w-12 h-12 text-foreground/20 mb-4" />
              <h3 className="text-xl font-semibold text-foreground/60 mb-2">Nothing here yet</h3>
              <p className="text-foreground/40 max-w-md">
                {activeCategory
                  ? `No pins in "${activeCategory}" yet. Try another category or be the first to create one!`
                  : isLoggedIn
                    ? 'Be the first! Upload a pin and start building your visual universe.'
                    : 'Be the first to share some inspiration. Create an account to get started!'}
              </p>
              {isLoggedIn ? (
                <Link href="/create" className="luxury-button mt-6">Upload Your First Pin</Link>
              ) : (
                <button onClick={() => openAuthModal('signup')} className="luxury-button mt-6">Sign Up to Upload</button>
              )}
            </div>
          ) : (
            <TypedMasonryGrid
              items={feedPins}
              columns={{ base: 1, sm: 2, md: 3, lg: 4, xl: 4 }}
              renderCard={(photo, columnWidth) => (
                <PinCard
                  key={photo.id}
                  id={photo.id}
                  title={photo.title}
                  description={photo.description}
                  imageUrl={photo.imageUrl}
                  authorId={photo.authorId}
                  likes={photo.likes}
                  saves={photo.saves}
                  comments={photo.comments}
                  board={photo.boardId}
                  views={photo.views}
                  createdAt={photo.createdAt}
                  aspectRatioId={photo.aspectRatioId}
                  columnWidth={columnWidth}
                />
              )}
            />
          )}

          {visibleCount < pins.filter(p => !p.isPrivate && (!activeCategory || p.category === activeCategory)).length && (
            <div className="flex justify-center mt-12">
              <button onClick={loadMore} className="luxury-button-outline flex items-center gap-2">
                Load More <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
