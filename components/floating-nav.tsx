'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useMotionValue, useSpring, useTransform, MotionValue, AnimatePresence } from 'framer-motion';
import {
  Globe,
  TrendingUp,
  LayoutGrid,
  Zap,
  Users,
  Settings,
  Plus,
  Bell,
  LogOut,
} from 'lucide-react';
import { useApp } from '@/lib/app-context';
import UserAvatar from '@/components/user-avatar';

interface NavItem {
  id: string;
  href: string;
  icon: React.ReactNode;
  label: string;
  color: string;
  hoverBg: string;
  onClick?: () => void;
  badge?: number;
}

function DockItem({ item, mouseX, isActive }: { item: NavItem; mouseX: MotionValue; isActive: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [40, 64, 40]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <Link href={item.href} onClick={(e) => {
      if (item.onClick) {
        e.preventDefault();
        item.onClick();
      }
    }}>
      <motion.div
        ref={ref}
        style={{ width, height: width }}
        className="relative flex items-center justify-center group"
        aria-label={item.label}
        title={item.label}
      >
        <div className={`flex items-center justify-center w-full h-full rounded-2xl transition-all duration-200 ${
          isActive
            ? `${item.color} bg-slate-100 dark:bg-slate-800 shadow-md ring-1 ring-black/5 dark:ring-white/10`
            : `text-slate-500 ${item.hoverBg} group-hover:${item.color} group-hover:bg-white dark:group-hover:bg-slate-800 group-hover:shadow-lg group-hover:ring-1 group-hover:ring-black/5 dark:group-hover:ring-white/10`
        }`}>
          <div className="flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
            {item.icon}
          </div>
          {item.badge !== undefined && item.badge > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold shadow-sm ring-2 ring-white dark:ring-black">
              {item.badge > 9 ? '9+' : item.badge}
            </span>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

function ProfileItem({ currentUser, isActive, mouseX, onEnter, onLeave }: any) {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [40, 64, 40]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <div onMouseEnter={onEnter} onMouseLeave={onLeave} className="relative flex items-center">
      <Link href="/profile">
        <motion.div
          ref={ref}
          style={{ width, height: width }}
          className="relative flex items-center justify-center group"
          aria-label="Profile"
        >
          <div className={`w-full h-full rounded-full overflow-hidden transition-all duration-200 shadow-sm ${
            isActive ? 'ring-2 ring-accent shadow-md' : 'ring-1 ring-slate-200 dark:ring-white/10 group-hover:ring-accent group-hover:shadow-lg'
          }`}>
            <UserAvatar
              userId={currentUser.id}
              displayName={currentUser.displayName}
              avatarUrl={currentUser.avatar}
              size="sm"
              className="w-full h-full text-base"
            />
          </div>
        </motion.div>
      </Link>
    </div>
  );
}

function LogoItem({ isActive, mouseX }: { isActive: boolean; mouseX: MotionValue }) {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [40, 64, 40]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <Link href="/">
      <motion.div
        ref={ref}
        style={{ width, height: width }}
        className={`relative flex items-center justify-center rounded-full border border-border/40 bg-transparent overflow-hidden shadow-sm hover:shadow-lg transition-shadow ${isActive ? 'ring-2 ring-accent' : ''}`}
      >
        <img src="/logo.png" alt="Auroric" className="w-full h-full object-cover object-center scale-110" />
      </motion.div>
    </Link>
  );
}

function LoginItem({ mouseX, onClick }: { mouseX: MotionValue, onClick: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [40, 64, 40]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <div className="relative flex items-center">
      <button onClick={onClick} className="focus:outline-none">
        <motion.div
          ref={ref}
          style={{ width, height: width }}
          className="relative flex items-center justify-center group"
          aria-label="Sign In"
        >
          <div className="flex items-center justify-center w-full h-full rounded-full transition-all duration-200 text-sky-500 bg-sky-50/50 dark:bg-sky-500/10 group-hover:bg-sky-100 dark:group-hover:bg-sky-500/20 group-hover:shadow-lg ring-1 ring-slate-200 dark:ring-white/10 group-hover:ring-sky-200">
            <div className="flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </motion.div>
      </button>
    </div>
  );
}

export default function FloatingNav() {
  const pathname = usePathname();
  const { currentUser, isLoggedIn, logout, unreadCount, openAuthModal } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const expandTimeout = useRef<NodeJS.Timeout | null>(null);

  const mouseX = useMotionValue(Infinity);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsExpanded(false);
  }, [pathname]);

  const handleProfileEnter = () => {
    if (expandTimeout.current) clearTimeout(expandTimeout.current);
    setIsExpanded(true);
  };

  const handleProfileLeave = () => {
    expandTimeout.current = setTimeout(() => setIsExpanded(false), 300);
  };

  const handleExpandedEnter = () => {
    if (expandTimeout.current) clearTimeout(expandTimeout.current);
  };

  const handleExpandedLeave = () => {
    expandTimeout.current = setTimeout(() => setIsExpanded(false), 300);
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const navItems: NavItem[] = [
    { id: 'explore', href: '/explore', icon: <Globe className="w-5 h-5" />, label: 'Explore', color: 'text-sky-600 dark:text-sky-400', hoverBg: 'hover:bg-sky-50 dark:hover:bg-sky-500/10' },
    { id: 'trending', href: '/trending', icon: <TrendingUp className="w-5 h-5" />, label: 'Trending', color: 'text-emerald-600 dark:text-emerald-400', hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10' },
    { id: 'boards', href: '/boards', icon: <LayoutGrid className="w-5 h-5" />, label: 'Boards', color: 'text-violet-600 dark:text-violet-400', hoverBg: 'hover:bg-violet-50 dark:hover:bg-violet-500/10' },
    { id: 'popular', href: '/popular', icon: <Zap className="w-5 h-5" />, label: 'Stats', color: 'text-amber-600 dark:text-amber-400', hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-500/10' },
    { id: 'messages', href: '/messages', icon: <Users className="w-5 h-5" />, label: 'Friends', color: 'text-rose-600 dark:text-rose-400', hoverBg: 'hover:bg-rose-50 dark:hover:bg-rose-500/10' },
  ];

  const expandedItems: NavItem[] = [
    { id: 'create', href: '/create', icon: <Plus className="w-5 h-5" />, label: 'Create', color: 'text-emerald-600 dark:text-emerald-400', hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10' },
    { id: 'notifications', href: '/notifications', icon: <Bell className="w-5 h-5" />, label: 'Alerts', color: 'text-amber-600 dark:text-amber-400', hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-500/10', badge: unreadCount },
    { id: 'settings', href: '/settings', icon: <Settings className="w-5 h-5" />, label: 'Settings', color: 'text-slate-600 dark:text-slate-400', hoverBg: 'hover:bg-slate-50 dark:hover:bg-slate-500/10' },
    { id: 'logout', href: '#', icon: <LogOut className="w-5 h-5" />, label: 'Sign Out', color: 'text-red-500 dark:text-red-400', hoverBg: 'hover:bg-red-50 dark:hover:bg-red-500/10', onClick: logout },
  ];

  return (
    <nav
      ref={navRef}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex"
      aria-label="Main navigation"
    >
      <motion.div
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => {
          mouseX.set(Infinity);
          if (isExpanded) handleExpandedLeave();
        }}
        onMouseEnter={() => {
          if (isExpanded) handleExpandedEnter();
        }}
        className="flex items-end px-2 py-2 gap-2 h-[56px] rounded-full bg-white/70 dark:bg-[#111]/70 backdrop-blur-2xl border border-black/5 dark:border-white/10 shadow-lg ring-1 ring-black/5 dark:ring-white/10"
      >
        {/* Left: Logo */}
        <LogoItem isActive={isActive('/')} mouseX={mouseX} />

        {/* Separator */}
        <div className="w-px h-8 bg-black/10 dark:bg-white/10 mx-1 flex-shrink-0 self-center rounded-full" />

        {/* Middle: Nav items */}
        {navItems.map((item) => (
          <DockItem key={item.id} item={item} mouseX={mouseX} isActive={isActive(item.href)} />
        ))}

        {/* Separator */}
        <div className="w-px h-8 bg-black/10 dark:bg-white/10 mx-1 flex-shrink-0 self-center rounded-full" />

        {/* Right: Profile Avatar / Auth */}
        {isLoggedIn && currentUser ? (
          <ProfileItem 
            currentUser={currentUser} 
            isActive={isActive('/profile')} 
            mouseX={mouseX} 
            onEnter={handleProfileEnter}
            onLeave={handleProfileLeave}
          />
        ) : (
          <LoginItem mouseX={mouseX} onClick={() => openAuthModal('login')} />
        )}

        {/* Expanded items */}
        <AnimatePresence>
          {isExpanded && isLoggedIn && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex items-end gap-2 h-full overflow-visible origin-left"
              onMouseEnter={handleExpandedEnter}
              onMouseLeave={handleExpandedLeave}
            >
              <div className="w-px h-8 bg-black/10 dark:bg-white/10 ml-1 mr-1 flex-shrink-0 self-center rounded-full" />
              {expandedItems.map((item) => (
                <DockItem key={item.id} item={item} mouseX={mouseX} isActive={isActive(item.href)} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </nav>
  );
}
