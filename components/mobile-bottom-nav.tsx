'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Bell, Search, Plus } from 'lucide-react';

interface MobileNavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
}

export default function MobileBottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const navItems: MobileNavItem[] = [
    { href: '/', icon: <Home className="w-5 h-5" />, label: 'Home' },
    { href: '/explore', icon: <Compass className="w-5 h-5" />, label: 'Explore' },
    { href: '/notifications', icon: <Bell className="w-5 h-5" />, label: 'Notifications' },
    { href: '/search', icon: <Search className="w-5 h-5" />, label: 'Search' },
    { href: '/create', icon: <Plus className="w-5 h-5" />, label: 'Create' },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-xl border-t border-border/30"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-[60px] px-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[56px] ${
                active
                  ? 'text-accent'
                  : 'text-foreground/45 hover:text-foreground/70'
              }`}
            >
              <div className={`relative transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
                {item.icon}
                {active && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
                )}
              </div>
              <span className={`text-[10px] font-medium leading-none mt-0.5 ${active ? 'text-accent' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Safe area for devices with home bar */}
      <div className="h-[env(safe-area-inset-bottom,0px)] bg-card/95" />
    </nav>
  );
}
