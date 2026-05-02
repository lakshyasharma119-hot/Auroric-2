'use client';

import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

// Keyframe sets for organic blob morphing
const BLOB_KEYFRAMES_1 = [
  '40% 60% 70% 30% / 40% 50% 60% 50%',
  '70% 30% 50% 50% / 30% 30% 70% 70%',
  '50% 50% 30% 70% / 60% 40% 60% 40%',
  '30% 70% 70% 30% / 50% 60% 30% 60%',
  '60% 40% 30% 70% / 40% 70% 50% 50%',
  '40% 60% 70% 30% / 40% 50% 60% 50%',
];

const BLOB_KEYFRAMES_2 = [
  '60% 40% 30% 70% / 50% 60% 40% 50%',
  '30% 70% 60% 40% / 60% 30% 70% 40%',
  '50% 50% 40% 60% / 40% 70% 30% 60%',
  '70% 30% 50% 50% / 50% 40% 60% 50%',
  '40% 60% 70% 30% / 60% 50% 40% 60%',
  '60% 40% 30% 70% / 50% 60% 40% 50%',
];

// Topography contour pattern as inline repeating-radial-gradient
const topoPattern = (color: string) =>
  `repeating-radial-gradient(circle at 50% 50%, transparent 0px, transparent 8px, ${color} 8px, ${color} 9px, transparent 9px, transparent 18px)`;

export default function OrganicBlobs() {
  const { scrollYProgress } = useScroll();
  const rotate1 = useTransform(scrollYProgress, [0, 1], [0, 25]);
  const rotate2 = useTransform(scrollYProgress, [0, 1], [0, -20]);
  const scale1 = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.08, 1.02]);
  const scale2 = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.05, 0.97]);

  // Read blob colors from CSS variables (theme-aware)
  const [blob1Color, setBlob1Color] = useState('rgba(239,68,68,0.12)');
  const [blob2Color, setBlob2Color] = useState('rgba(87,0,0,0.15)');
  const [botanicalColor, setBotanicalColor] = useState('rgba(255,255,255,0.06)');

  useEffect(() => {
    const update = () => {
      const style = getComputedStyle(document.documentElement);
      setBlob1Color(style.getPropertyValue('--blob-1').trim() || 'rgba(239,68,68,0.12)');
      setBlob2Color(style.getPropertyValue('--blob-2').trim() || 'rgba(87,0,0,0.15)');
      setBotanicalColor(style.getPropertyValue('--botanical-color').trim() || 'rgba(255,255,255,0.06)');
    };
    update();
    // Re-read when theme changes
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* ── Blob 1 — Top Right ── */}
      <motion.div
        className="absolute"
        style={{
          top: '-5%',
          right: '-10%',
          width: '55vw',
          height: '55vw',
          maxWidth: '700px',
          maxHeight: '700px',
          background: blob1Color,
          backgroundImage: topoPattern(`${blob1Color.replace(/[\d.]+\)$/, '0.3)') }`),
          rotate: rotate1,
          scale: scale1,
        }}
        animate={{
          borderRadius: BLOB_KEYFRAMES_1,
        }}
        transition={{
          borderRadius: {
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }}
      />

      {/* ── Blob 2 — Bottom Left ── */}
      <motion.div
        className="absolute"
        style={{
          bottom: '-10%',
          left: '-12%',
          width: '50vw',
          height: '50vw',
          maxWidth: '650px',
          maxHeight: '650px',
          background: blob2Color,
          backgroundImage: topoPattern(`${blob2Color.replace(/[\d.]+\)$/, '0.25)') }`),
          rotate: rotate2,
          scale: scale2,
        }}
        animate={{
          borderRadius: BLOB_KEYFRAMES_2,
        }}
        transition={{
          borderRadius: {
            duration: 22,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }}
      />

      {/* ── Botanical Line Art — Right Edge ── */}
      <svg
        className="absolute right-0 top-1/4 h-[60vh] w-auto opacity-100"
        viewBox="0 0 120 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ color: botanicalColor }}
      >
        {/* Main stem */}
        <path
          d="M60 580 C60 500, 55 420, 58 350 C61 280, 50 200, 55 120 C58 60, 62 30, 60 10"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Left leaves */}
        <path
          d="M58 350 C30 340, 15 310, 10 280 C15 290, 35 310, 58 320"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
        />
        <path
          d="M55 250 C25 235, 8 205, 5 175 C12 185, 32 210, 55 225"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
        />
        <path
          d="M56 450 C28 445, 12 420, 8 390 C15 400, 33 425, 56 435"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
        />
        {/* Right leaves */}
        <path
          d="M60 300 C85 285, 100 260, 105 235 C98 248, 82 270, 60 280"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
        />
        <path
          d="M58 180 C80 168, 98 145, 102 120 C95 132, 78 155, 58 165"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
        />
        <path
          d="M59 400 C88 392, 105 370, 110 345 C102 355, 85 375, 59 385"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
        />
        {/* Small decorative buds */}
        <circle cx="10" cy="278" r="3" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <circle cx="105" cy="233" r="3" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <circle cx="5" cy="173" r="2.5" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <circle cx="102" cy="118" r="2.5" stroke="currentColor" strokeWidth="0.8" fill="none" />
      </svg>
    </div>
  );
}
