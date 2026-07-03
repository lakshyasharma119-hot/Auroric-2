'use client';

import React, { useState } from 'react';
import { Heart, MessageCircle, Bookmark, MoreHorizontal, Eye, Clock, Send } from 'lucide-react';
import Link from 'next/link';
import { useApp } from '@/lib/app-context';
import UserAvatar from '@/components/user-avatar';
import SaveToBoardModal from '@/components/save-to-board-modal';
import { useChat } from '@/context/ChatContext';
import { formatCount, timeAgo } from '@/lib/helpers';
import { ASPECT_RATIOS, DEFAULT_ASPECT_RATIO_ID } from '@/lib/constants/aspectRatios';
import type { AspectRatioId } from '@/lib/constants/aspectRatios';

/**
 * Resolve CSS aspect-ratio string from typed ID or legacy string.
 * Explicit fallback to 1/1 (square) for pins with no ratio data.
 */
function resolveAspectRatio(
  aspectRatioId?: AspectRatioId,
  legacyAspectRatio?: string,
): string {
  if (aspectRatioId && ASPECT_RATIOS[aspectRatioId]) {
    const r = ASPECT_RATIOS[aspectRatioId];
    return `${r.ratioW} / ${r.ratioH}`;
  }
  if (legacyAspectRatio) return legacyAspectRatio;
  // Explicit default: square. Do not leave undefined.
  const fallback = ASPECT_RATIOS[DEFAULT_ASPECT_RATIO_ID];
  return `${fallback.ratioW} / ${fallback.ratioH}`;
}

interface PinCardProps {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  authorId: string;
  likes: string[];
  saves: string[];
  comments: { id: string }[];
  board?: string;
  compact?: boolean;
  views?: number;
  createdAt?: string;
  aspectRatio?: string;
  // NEW — required for masonry integration:
  /** Typed aspect ratio ID from ASPECT_RATIOS. Drives CSS aspect-ratio on the image container. */
  aspectRatioId?: AspectRatioId;
  /** Pixel width assigned by TypedMasonryGrid — informational, card uses CSS for sizing. */
  columnWidth?: number;
}

export default function PinCard({
  id,
  title,
  description,
  imageUrl,
  authorId,
  likes,
  saves,
  comments,
  board,
  compact = false,
  views = 0,
  createdAt,
  aspectRatio,
  aspectRatioId,
  columnWidth,
}: PinCardProps) {
  const { currentUser, isLoggedIn, toggleLike, toggleSave, getUser, getBoard, openAuthModal } = useApp();
  const { openShareModal } = useChat();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const author = getUser(authorId);
  const isLiked = currentUser ? likes.includes(currentUser.id) : false;
  const isSaved = currentUser ? saves.includes(currentUser.id) : false;

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) { openAuthModal('login'); return; }
    toggleLike(id);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) { openAuthModal('login'); return; }
    setShowSaveModal(true);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) { openAuthModal('login'); return; }
    openShareModal({ pinId: id, imageUrl, title, authorId });
  };

  const handleQuickSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) { openAuthModal('login'); return; }
    toggleSave(id);
  };

  const boardData = board ? getBoard(board) : undefined;

  return (
    <>
      <Link href={`/pin/${id}`} className="block group">
        <div className="pin-card h-full flex flex-col overflow-hidden cursor-pointer">
          {/* Image Container */}
          <div className="relative w-full bg-card/50 overflow-hidden" style={{ aspectRatio: resolveAspectRatio(aspectRatioId, aspectRatio) }}>
            {/* Skeleton shimmer while loading */}
            {!imgLoaded && (
              <div className="absolute inset-0 animate-shimmer" />
            )}
            <img
              src={imageUrl}
              alt={title}
              className={`w-full h-auto object-cover smooth-transition group-hover:scale-[1.03] ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; setImgLoaded(true); }}
            />

            {/* Hover Overlay */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 smooth-transition flex flex-col justify-between pointer-events-none z-10">
              {/* Gradient Scrim (Bottom) */}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/20 to-transparent -z-10" />

              {/* Top row */}
              <div className="flex justify-end p-3 pointer-events-auto">
                <button
                  onClick={handleQuickSave}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold smooth-transition font-syne ${isSaved
                      ? 'bg-foreground/90 text-background'
                      : 'bg-accent text-accent-foreground hover:brightness-110'
                    }`}
                >
                  {isSaved ? 'Saved' : 'Save'}
                </button>
              </div>

              {/* Bottom Info & Buttons */}
              <div className="flex flex-col gap-2 p-3 pointer-events-auto mt-auto">
                {/* Text Info */}
                <div className="flex flex-col gap-0.5">
                  <h3 className="font-semibold text-white text-sm line-clamp-2 font-syne drop-shadow-md">
                    {title}
                  </h3>
                  
                  {author && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <UserAvatar userId={author.id} displayName={author.displayName} size="sm" />
                      <span className="text-[11px] font-medium text-white/90 truncate max-w-[120px] drop-shadow-sm">{author.displayName}</span>
                    </div>
                  )}
                </div>

                {/* Bottom row Action Buttons */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex gap-2">
                    <button
                      onClick={handleShare}
                      aria-label="Share"
                      className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 smooth-transition backdrop-blur-md"
                    >
                      <Send className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={handleLike}
                      aria-label="Like"
                      className={`p-2.5 rounded-full smooth-transition backdrop-blur-md ${isLiked ? 'bg-red-500/20' : 'bg-white/10 hover:bg-white/20'
                        }`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                    </button>
                  </div>
                  <button
                    onClick={handleSave}
                    aria-label="Save to board"
                    className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 smooth-transition backdrop-blur-md"
                  >
                    <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-accent text-accent' : 'text-white'}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>

      <SaveToBoardModal isOpen={showSaveModal} onClose={() => setShowSaveModal(false)} pinId={id} />
    </>
  );
}
