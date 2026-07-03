'use client';

import React, { useState } from 'react';
import { Download, Lock, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { estimateDownloadSize } from '@/lib/helpers';
import type { Pin } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface DownloadMenuProps {
  pin: Pin;
  userTier?: string; // 'free', 'monthly', 'yearly'
  isLoggedIn: boolean;
  openAuthModal: (type: 'login' | 'signup') => void;
}

export default function DownloadMenu({ pin, userTier = 'free', isLoggedIn, openAuthModal }: DownloadMenuProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const router = useRouter();

  const isPremium = userTier === 'monthly' || userTier === 'yearly';
  const size = pin.fileSize || (4 * 1024 * 1024);

  const handleDownload = async (quality: 'standard' | 'hd' | 'fullhd') => {
    if (!isLoggedIn) {
      openAuthModal('login');
      return;
    }

    if ((quality === 'hd' || quality === 'fullhd') && !isPremium) {
      toast('Premium quality is reserved for Plus & Prime members.', {
        icon: <Lock className="w-4 h-4 text-accent" />,
        action: {
          label: 'Upgrade',
          onClick: () => router.push('/pricing'),
        },
        duration: 5000,
      });
      return;
    }

    try {
      setIsDownloading(true);
      const res = await fetch(`/api/pins/${pin.id}/download?quality=${quality}`);
      if (!res.ok) throw new Error('Download failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const contentDisposition = res.headers.get('content-disposition') || '';
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      a.download = filenameMatch ? filenameMatch[1] : `${pin.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${quality}.png`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Downloaded ${quality === 'fullhd' ? 'Original' : quality.toUpperCase()} quality!`);
    } catch (err) {
      toast.error('Failed to download image.');
      console.error(err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          disabled={isDownloading} 
          aria-label="Download Menu" 
          className="p-3 rounded-full bg-black/40 hover:bg-black/60 smooth-transition backdrop-blur-sm disabled:opacity-50 text-white"
        >
          <Download className="w-5 h-5" />
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64 bg-card/90 backdrop-blur-xl border-white/10 p-2 shadow-2xl rounded-xl">
        <DropdownMenuLabel className="text-xs text-foreground/50 font-medium px-2 py-1">Choose Quality</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/5" />
        
        {/* Standard */}
        <DropdownMenuItem 
          onClick={() => handleDownload('standard')}
          className="flex flex-col items-start p-3 cursor-pointer rounded-lg smooth-transition"
        >
          <div className="font-semibold">Standard Quality</div>
          <div className="text-xs opacity-70">~{estimateDownloadSize(size, 'standard')} • Compressed</div>
        </DropdownMenuItem>

        {/* HD */}
        <DropdownMenuItem 
          onClick={() => handleDownload('hd')}
          className="group flex flex-col items-start p-3 cursor-pointer rounded-lg smooth-transition relative overflow-hidden"
        >
          <div className="flex items-center justify-between w-full">
            <span className={`font-semibold ${!isPremium ? 'opacity-70' : ''}`}>HD Quality</span>
            {!isPremium && <Lock className="w-4 h-4 text-accent/80 group-focus:text-accent-foreground/80 group-hover:text-accent-foreground/80" />}
          </div>
          <div className="text-xs opacity-70">~{estimateDownloadSize(size, 'hd')} • High Res</div>
        </DropdownMenuItem>

        {/* Full HD */}
        <DropdownMenuItem 
          onClick={() => handleDownload('fullhd')}
          className="group flex flex-col items-start p-3 cursor-pointer rounded-lg smooth-transition relative overflow-hidden"
        >
          <div className="flex items-center justify-between w-full">
            <span className={`font-semibold ${!isPremium ? 'opacity-70' : 'text-accent group-focus:text-accent-foreground group-hover:text-accent-foreground'}`}>Full HD (Original)</span>
            {!isPremium && <Lock className="w-4 h-4 text-accent/80 group-focus:text-accent-foreground/80 group-hover:text-accent-foreground/80" />}
          </div>
          <div className="text-xs opacity-70">{estimateDownloadSize(size, 'fullhd')} • Uncompressed PNG</div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
