'use client';

import React from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';

interface Pin {
  id: string;
  imageUrl: string;
  likes: string[];
}

export default function AntiGravityGallery({ pins }: { pins: Pin[] }) {
  // We only want to animate the top 10
  const displayPins = pins.slice(0, 10);

  return (
    <div className="relative w-full h-[500px] lg:h-[700px] overflow-hidden rounded-3xl" style={{ perspective: '1000px' }}>
      {displayPins.map((pin, i) => {
        // Base size ranges from 150px to 330px roughly (increased ~20%)
        const baseSize = 150 + (i * 20);
        
        // Duration ranges from 45s (slow, background) to 20s (fast, foreground)
        const duration = 45 - (i * 2.5);
        
        // Strict 5-lane distribution, but scrambled so they don't form a diagonal line
        const lanes = [48, 5, 85, 25, 70]; 
        const left = lanes[i % 5];
        
        // Scattered vertical offset delays to break linear patterns
        const staggerOffset = [0, -7, -2, -9, -4][i % 5]; 
        const verticalSpacingOffset = Math.floor(i / 5) * -24; // massive gap between items in same lane
        const delay = staggerOffset + verticalSpacingOffset;
        
        // Rotation variations for drifting
        const startRot = (i % 2 === 0 ? -1 : 1) * (5 + (i % 5));
        const endRot = (i % 2 === 0 ? 1 : -1) * (15 + (i % 10));

        // Z-index: smaller index (less popular) -> deeper background
        const zIndex = i;

        // Blur/brightness for depth (parallax visual effect)
        const depthBlur = i < 3 ? 'blur-[3px] brightness-[0.6]' : i < 6 ? 'blur-[1.5px] brightness-[0.8]' : 'brightness-110 shadow-[0_0_30px_hsl(var(--accent)/0.25)]';

        return (
          <div
            key={pin.id}
            className="absolute animate-anti-gravity group will-change-transform cursor-pointer hover:!z-[100]"
            style={{
              width: `${baseSize}px`,
              height: `${baseSize * 1.3}px`,
              left: `${left}%`,
              zIndex,
              '--float-duration': `${duration}s`,
              '--float-delay': `${delay}s`,
              '--start-rot': `${startRot}deg`,
              '--end-rot': `${endRot}deg`,
            } as React.CSSProperties}
          >
            <Link href={`/pin/${pin.id}`} className="block w-full h-full relative">
              <div className={`w-full h-full rounded-2xl overflow-hidden border border-border/20 transition-all duration-300 ease-out group-hover:scale-[1.5] group-hover:!blur-none group-hover:!brightness-110 group-hover:!filter-none group-hover:shadow-[0_0_40px_hsl(var(--accent)/0.5)] group-hover:border-accent/40 origin-center ${depthBlur}`}>
                <img 
                  src={pin.imageUrl} 
                  alt="Trending Pin" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  loading="eager" 
                />
                
                {/* Hover frosted glass overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                  <div className="flex items-center gap-2 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <Heart className="w-5 h-5 fill-accent text-accent drop-shadow-[0_0_12px_rgba(255,100,0,0.8)]" />
                    <span className="font-bold font-syne text-lg drop-shadow-md">{pin.likes.length}</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
