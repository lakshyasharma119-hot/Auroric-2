'use client';
import { useTheme } from '@/lib/theme-context';
import React from 'react';

/*  ─────────────────────────────────────────────────────────────
    High-fidelity skeuomorphic day/night toggle.
    • Deep 3D inset track
    • Sun with radial gradient + pronounced drop shadow
    • SVG fluffy clouds anchored to the bottom
    • Concentric blue sky bands
    • Moon with inset-shadowed craters
    • 4-pointed SVG sparkle stars
    • Astronaut bear floating in the dark scene
    ───────────────────────────────────────────────────────────── */

function SparkleStarSVG({ size = 6, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" className={className} fill="white">
      <path d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z" />
    </svg>
  );
}

function CloudsSVG() {
  return (
    <svg
      viewBox="0 0 200 60"
      preserveAspectRatio="none"
      className="clouds-svg"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="cloudSoftness">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" />
        </filter>
      </defs>
      {/* Back cloud layer — subtle depth */}
      <ellipse cx="45" cy="42" rx="38" ry="22" fill="rgba(255,255,255,0.6)" />
      <ellipse cx="140" cy="44" rx="42" ry="20" fill="rgba(255,255,255,0.5)" />
      {/* Main cloud body */}
      <ellipse cx="55" cy="38" rx="30" ry="20" fill="white" />
      <ellipse cx="90" cy="35" rx="24" ry="18" fill="white" />
      <ellipse cx="125" cy="37" rx="28" ry="19" fill="white" />
      <ellipse cx="155" cy="40" rx="32" ry="20" fill="white" />
      <ellipse cx="35" cy="44" rx="26" ry="16" fill="white" />
      <ellipse cx="170" cy="45" rx="30" ry="16" fill="white" />
      {/* Bottom fill so no gaps */}
      <rect x="0" y="40" width="200" height="20" fill="white" />
      {/* Fluffy tops */}
      <ellipse cx="70" cy="28" rx="18" ry="14" fill="white" />
      <ellipse cx="110" cy="30" rx="16" ry="12" fill="white" />
      <ellipse cx="145" cy="32" rx="20" ry="14" fill="white" />
    </svg>
  );
}

export function ModeToggle() {
  const { mode, toggleMode } = useTheme();
  const isDark = mode === 'dark';

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        .hifi-toggle {
          --w: 80px;
          --h: calc(var(--w) * 0.425);
          --r: calc(var(--h) / 2);
          --thumb: calc(var(--h) * 0.78);
          --pad: calc((var(--h) - var(--thumb)) / 2);
          --travel: calc(var(--w) - var(--thumb) - var(--pad) * 2);

          width: var(--w);
          height: var(--h);
          border-radius: var(--r);
          border: none;
          position: relative;
          cursor: pointer;
          outline: none;
          flex-shrink: 0;
          -webkit-tap-highlight-color: transparent;
          transition: background-color 0.55s ease;
          overflow: hidden;
          /* 3D outer bevel — raised pill shape */
          box-shadow:
            0 2px 1px -0.5px rgba(255,255,255,0.9),
            0 -1px 1px -0.5px rgba(0,0,0,0.12),
            0 3px 8px 0 rgba(0,0,0,0.10),
            0 1px 3px 0 rgba(0,0,0,0.06);
        }
        .hifi-toggle:focus-visible {
          outline: 2px solid hsl(var(--accent));
          outline-offset: 2px;
        }
        /* Deep inset shadow inside the track — the "stamped cutout" feel */
        .hifi-toggle::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          box-shadow:
            inset 0 3px 6px 0 rgba(0,0,0,0.35),
            inset 0 1px 2px 0 rgba(0,0,0,0.25),
            inset 0 -2px 4px 0 rgba(255,255,255,0.15);
          pointer-events: none;
          z-index: 10;
        }

        /* ─── SKY BANDS (concentric blue arcs) ─── */
        .sky-bands {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          overflow: hidden;
          opacity: calc(1 - var(--dark));
          transition: opacity 0.55s ease;
          pointer-events: none;
        }
        .sky-band {
          position: absolute;
          border-radius: 50%;
        }
        .sky-band-1 {
          width: 120%; height: 200%;
          top: -60%; right: -30%;
          background: rgba(255,255,255,0.12);
        }
        .sky-band-2 {
          width: 90%; height: 160%;
          top: -40%; right: -20%;
          background: rgba(255,255,255,0.10);
        }
        .sky-band-3 {
          width: 60%; height: 120%;
          top: -20%; right: -10%;
          background: rgba(135,190,230,0.25);
        }

        /* ─── CLOUDS (SVG) ─── */
        .clouds-svg {
          position: absolute;
          bottom: -2px;
          left: -5%;
          width: 110%;
          height: 65%;
          opacity: calc(1 - var(--dark));
          transform: translateY(calc(var(--dark) * 110%));
          transition: transform 0.55s ease, opacity 0.45s ease;
          pointer-events: none;
          z-index: 3;
        }

        /* ─── STARS (sparkle container) ─── */
        .sparkle-stars {
          position: absolute;
          inset: 0;
          opacity: var(--dark);
          transform: translateY(calc((1 - var(--dark)) * -100%));
          transition: transform 0.55s ease, opacity 0.45s ease;
          pointer-events: none;
          z-index: 2;
        }
        .sparkle-star {
          position: absolute;
          animation: twinkle 3s ease-in-out infinite alternate;
        }
        .sparkle-star:nth-child(2) { animation-delay: 0.5s; }
        .sparkle-star:nth-child(3) { animation-delay: 1.0s; }
        .sparkle-star:nth-child(4) { animation-delay: 1.5s; }
        .sparkle-star:nth-child(5) { animation-delay: 0.8s; }
        .sparkle-star:nth-child(6) { animation-delay: 1.3s; }
        .sparkle-star:nth-child(7) { animation-delay: 0.3s; }
        @keyframes twinkle {
          0% { opacity: 0.4; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1.2); }
        }

        /* ─── ASTRONAUT BEAR ─── */
        .astro-bear {
          position: absolute;
          width: calc(var(--w) * 0.28);
          height: calc(var(--w) * 0.32);
          top: 8%;
          left: 28%;
          opacity: var(--dark);
          transform:
            translateY(calc((1 - var(--dark)) * -120%))
            rotate(calc(var(--dark) * -8deg));
          transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.45s ease;
          pointer-events: none;
          z-index: 4;
        }
        .astro-bear-inner {
          width: 100%;
          height: 100%;
          animation: float-bear 4s ease-in-out infinite alternate;
        }
        @keyframes float-bear {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-2px) rotate(3deg); }
          100% { transform: translateY(1px) rotate(-2deg); }
        }

        /* ─── THUMB ─── */
        .hifi-thumb {
          position: absolute;
          top: var(--pad);
          left: var(--pad);
          width: var(--thumb);
          height: var(--thumb);
          border-radius: 50%;
          transform: translateX(calc(var(--dark) * var(--travel)));
          transition: transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1);
          z-index: 5;
          /* Pronounced drop shadow for the thumb */
          box-shadow:
            0 2px 8px 0 rgba(0,0,0,0.30),
            0 1px 3px 0 rgba(0,0,0,0.20);
        }

        /* ─── SUN ─── */
        .hifi-sun {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          /* Radial gradient: light center to deeper gold edge */
          background: radial-gradient(circle at 35% 35%, #fde68a 0%, #eab308 45%, #ca8a04 100%);
          opacity: calc(1 - var(--dark));
          transition: opacity 0.5s ease;
          /* Inner highlight + shadow for 3D sphere */
          box-shadow:
            inset -2px -3px 6px 0 rgba(180,120,0,0.45),
            inset 2px 2px 4px 0 rgba(255,255,230,0.7),
            0 0 12px 2px rgba(234,179,8,0.35);
        }

        /* ─── MOON ─── */
        .hifi-moon {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          /* Subtle gradient for 3D sphere effect */
          background: radial-gradient(circle at 40% 35%, #e2e8f0 0%, #cbd5e1 50%, #94a3b8 100%);
          opacity: var(--dark);
          transition: opacity 0.5s ease;
          box-shadow:
            inset -2px -2px 5px 0 rgba(0,0,0,0.2),
            inset 1px 1px 3px 0 rgba(255,255,255,0.6);
          overflow: hidden;
        }

        /* ─── CRATERS (inset holes) ─── */
        .hifi-crater {
          position: absolute;
          border-radius: 50%;
          /* Slightly darker fill than moon surface */
          background: radial-gradient(circle at 45% 40%, #a0aec0 0%, #8896a8 100%);
          /* Deep inset shadow so they look indented */
          box-shadow:
            inset 1px 1px 3px 0 rgba(0,0,0,0.4),
            inset -0.5px -0.5px 1px 0 rgba(255,255,255,0.3),
            0 0.5px 1px 0 rgba(255,255,255,0.15);
        }
        .hifi-crater-1 { top: 18%; left: 22%; width: 22%; height: 22%; }
        .hifi-crater-2 { top: 48%; left: 52%; width: 32%; height: 32%; }
        .hifi-crater-3 { top: 62%; left: 18%; width: 18%; height: 18%; }
      `}} />
      <button
        role="switch"
        aria-checked={isDark}
        aria-label="Toggle dark mode"
        onClick={toggleMode}
        className="hifi-toggle"
        style={{
          '--dark': isDark ? 1 : 0,
          backgroundColor: isDark ? '#1e293b' : '#5b9bd5'
        } as React.CSSProperties}
      >
        {/* Concentric sky bands (light mode) */}
        <div className="sky-bands">
          <div className="sky-band sky-band-1" />
          <div className="sky-band sky-band-2" />
          <div className="sky-band sky-band-3" />
        </div>

        {/* SVG Clouds (light mode) */}
        <CloudsSVG />

        {/* 4-pointed sparkle stars (dark mode) */}
        <div className="sparkle-stars">
          <span className="sparkle-star" style={{ top: '18%', left: '12%' }}><SparkleStarSVG size={5} /></span>
          <span className="sparkle-star" style={{ top: '55%', left: '8%' }}><SparkleStarSVG size={3.5} /></span>
          <span className="sparkle-star" style={{ top: '30%', left: '30%' }}><SparkleStarSVG size={4} /></span>
          <span className="sparkle-star" style={{ top: '65%', left: '25%' }}><SparkleStarSVG size={3} /></span>
          <span className="sparkle-star" style={{ top: '15%', left: '50%' }}><SparkleStarSVG size={4.5} /></span>
          <span className="sparkle-star" style={{ top: '45%', left: '45%' }}><SparkleStarSVG size={3} /></span>
          <span className="sparkle-star" style={{ top: '72%', left: '55%' }}><SparkleStarSVG size={3.5} /></span>
        </div>

        {/* Astronaut bear — placeholder image */}
        <div className="astro-bear">
          <div className="astro-bear-inner">
            {/* 
              Drop your astronaut bear asset into /public/astro-bear.png 
              and it will render here. If the file doesn't exist yet,
              we render the inline SVG placeholder below.
            */}
            <svg viewBox="0 0 40 46" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
              {/* Helmet visor (outer) */}
              <ellipse cx="20" cy="20" rx="16" ry="16" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5"/>
              {/* Helmet glass */}
              <ellipse cx="20" cy="20" rx="12" ry="12" fill="#475569" opacity="0.85"/>
              {/* Bear face */}
              <ellipse cx="20" cy="21" rx="9" ry="8.5" fill="#92633a"/>
              {/* Ears */}
              <circle cx="12" cy="13" r="3.5" fill="#92633a" stroke="#e2e8f0" strokeWidth="1"/>
              <circle cx="28" cy="13" r="3.5" fill="#92633a" stroke="#e2e8f0" strokeWidth="1"/>
              <circle cx="12" cy="13" r="1.8" fill="#c98c5a"/>
              <circle cx="28" cy="13" r="1.8" fill="#c98c5a"/>
              {/* Eyes */}
              <circle cx="16.5" cy="19" r="1.8" fill="#1a1a1a"/>
              <circle cx="23.5" cy="19" r="1.8" fill="#1a1a1a"/>
              <circle cx="17" cy="18.2" r="0.6" fill="white"/>
              <circle cx="24" cy="18.2" r="0.6" fill="white"/>
              {/* Snout */}
              <ellipse cx="20" cy="23.5" rx="4" ry="2.8" fill="#c98c5a"/>
              {/* Nose */}
              <ellipse cx="20" cy="22.5" rx="1.5" ry="1" fill="#4a3520"/>
              {/* Mouth */}
              <path d="M18.5 24.5 Q20 26 21.5 24.5" stroke="#4a3520" strokeWidth="0.8" fill="none" strokeLinecap="round"/>
              {/* Body / suit */}
              <ellipse cx="20" cy="38" rx="9" ry="8" fill="#e2e8f0"/>
              {/* Suit detail */}
              <rect x="17" y="33" width="6" height="4" rx="1" fill="#94a3b8"/>
              {/* Visor reflection */}
              <ellipse cx="15" cy="16" rx="3" ry="5" fill="rgba(255,255,255,0.12)" transform="rotate(-20 15 16)"/>
            </svg>
          </div>
        </div>

        {/* Thumb (sun/moon) */}
        <div className="hifi-thumb">
          <div className="hifi-sun" />
          <div className="hifi-moon">
            <div className="hifi-crater hifi-crater-1" />
            <div className="hifi-crater hifi-crater-2" />
            <div className="hifi-crater hifi-crater-3" />
          </div>
        </div>
      </button>
    </>
  );
}
