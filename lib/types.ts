import type { AspectRatioId } from './constants/aspectRatios';

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  bio: string;
  avatar: string;
  website: string;
  followers: string[];
  following: string[];
  createdAt: string;
  settings: UserSettings;
  /** Whether the user's email address has been verified */
  emailVerified: boolean;
  // ── Verification System ──
  isVerified: boolean;
  verificationType: 'none' | 'manual' | 'organic' | 'paid';
  isPromoted: boolean;
  // ── Expanded Profile ──
  gender?: string;
  dob?: string;
  country?: string;
  // ── Account Security ──
  passwordChangeCount: number;
  passwordChangeLockUntil?: string;
  accountStatus: 'active' | 'pending_deletion' | 'suspended';
}

export interface UserSettings {
  privateProfile: boolean;
  showActivity: boolean;
  allowMessages: boolean;
  allowNotifications: boolean;
  emailOnNewFollower: boolean;
  emailOnPinInteraction: boolean;
  theme: 'dark' | 'light';
}

export interface Pin {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  sourceUrl?: string;
  authorId: string;
  boardId?: string;
  tags: string[];
  category: string;
  aspectRatio?: string;
  /** Typed aspect ratio ID from ASPECT_RATIOS. Falls back to 'square_1_1' for legacy pins. */
  aspectRatioId?: AspectRatioId;
  likes: string[];
  saves: string[];
  comments: Comment[];
  views: number;
  /** Pre-computed engagement score for server-side trending sort.
   *  Formula: likes*3 + comments*5 + views*0.1
   *  Recomputed at write time whenever likes/comments/views change. */
  engagementScore?: number;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  text: string;
  authorId: string;
  pinId: string;
  likes: string[];
  createdAt: string;
}

export interface Board {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  ownerId: string;
  pins: string[];
  followers: string[];
  collaborators: string[];
  isPrivate: boolean;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'save' | 'board_invite';
  fromUserId: string;
  toUserId: string;
  pinId?: string;
  boardId?: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// ── Direct Messaging ──



// ── Account Management ──

export interface DeletionRequest {
  id: string;
  userId: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

// ── Constants ──

/** Storage limits in bytes */
export const CHAT_STORAGE_LIMIT_STANDARD = 3 * 1024 * 1024; // 3 MB
export const CHAT_STORAGE_LIMIT_VERIFIED = 10 * 1024 * 1024; // 10 MB

/** Password rate-limiting */
export const PASSWORD_CHANGE_MAX_ATTEMPTS = 3;
export const PASSWORD_CHANGE_LOCKOUT_DAYS = 3;

export const CATEGORIES = [
  'All',
  'Fashion',
  'Interior Design',
  'Architecture',
  'Art',
  'Food & Beverage',
  'Photography',
  'Travel',
  'DIY & Crafts',
  'Technology',
  'Nature',
  'Fitness',
  'Beauty',
  'Automotive',
  'Music',
  'Books',
] as const;

export type Category = typeof CATEGORIES[number];

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
