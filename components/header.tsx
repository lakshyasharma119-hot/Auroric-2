'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Plus, X, Menu, Bell, Settings, LogOut, ChevronDown, Sun, Moon } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { useTheme } from '@/lib/theme-context';
import UserAvatar from '@/components/user-avatar';
import AuthModal from '@/components/auth-modal';

export default function Header() {
  const router = useRouter();
  const { currentUser, isLoggedIn, openAuthModal, showAuthModal, authModalMode, closeAuthModal, logout, unreadCount } = useApp();
  const { theme, setTheme, themes } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMenuOpen(false);
    }
  };

  // Determine if current theme is "dark" (for icon display)
  const isDarkTheme = theme === 'crimson' || theme === 'fiery-sunset' || theme === 'modern-editorial';

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0 bg-transparent">
              <div className="w-10 h-10 rounded-full border border-border/40 bg-accent flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105 overflow-hidden text-accent-foreground font-syne font-bold text-xl">
                A
              </div>
              <span className="bg-transparent text-lg font-bold text-accent tracking-tight font-syne">Auroric</span>
            </Link>

            {/* Center: Search bar (desktop only) */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search pins, boards, users..."
                  className="w-full bg-card/50 border border-border/30 rounded-full pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 smooth-transition"
                />
              </div>
            </form>

            {/* Right: Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
              {/* Theme Switcher */}
              <div className="relative">
                <button
                  onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                  className="p-2 hover:bg-card/50 rounded-full transition-colors duration-200"
                  title="Switch Theme"
                >
                  {isDarkTheme ? (
                    <Moon className="w-5 h-5 text-foreground/60" />
                  ) : (
                    <Sun className="w-5 h-5 text-foreground/60" />
                  )}
                </button>

                {isThemeDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsThemeDropdownOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border/50 rounded-xl shadow-lg z-50 overflow-hidden animate-slideDown">
                      <div className="p-3 border-b border-border/30">
                        <h3 className="font-semibold text-sm text-foreground">Choose Theme</h3>
                      </div>
                      <div className="py-1">
                        {themes.map(t => (
                          <button
                            key={t.id}
                            onClick={() => { setTheme(t.id); setIsThemeDropdownOpen(false); }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                              theme === t.id
                                ? 'bg-accent/10 text-accent'
                                : 'text-foreground/80 hover:bg-background/50 hover:text-foreground'
                            }`}
                          >
                            <div className="flex gap-1">
                              {t.swatches.slice(0, 3).map((color, i) => (
                                <div
                                  key={i}
                                  className="w-4 h-4 rounded-full border border-border/30"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                            <span className="font-medium">{t.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {isLoggedIn && currentUser ? (
                <>
                  {/* Create */}
                  <Link
                    href="/create"
                    className="flex items-center gap-1.5 px-4 py-2 bg-accent text-white rounded-full text-sm font-medium hover:bg-accent/90 transition-colors duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    Create
                  </Link>

                  {/* Notifications dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                      className="relative p-2 hover:bg-card/50 rounded-full transition-colors duration-200"
                      title="Notifications"
                    >
                      <Bell className="w-5 h-5 text-foreground/60" />
                      {unreadCount > 0 && (
                        <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>

                    {isNotificationsOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                        <div className="absolute right-0 top-full mt-2 w-72 bg-card border border-border/50 rounded-xl shadow-lg z-50 overflow-hidden animate-slideDown">
                          <div className="p-3 border-b border-border/30 flex items-center justify-between">
                            <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
                            {unreadCount > 0 && (
                              <span className="text-xs text-accent cursor-pointer hover:underline">Mark all as read</span>
                            )}
                          </div>
                          <div className="max-h-[300px] overflow-y-auto">
                            {/* Dummy notifications */}
                            <div className="p-3 border-b border-border/10 hover:bg-background/50 transition-colors flex gap-3 items-start cursor-pointer">
                              <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center flex-shrink-0">
                                <Bell className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-sm text-foreground/90"><span className="font-semibold">System</span> welcome to Auroric!</p>
                                <p className="text-xs text-foreground/50 mt-0.5">2 hours ago</p>
                              </div>
                            </div>
                            <div className="p-3 border-b border-border/10 hover:bg-background/50 transition-colors flex gap-3 items-start cursor-pointer">
                              <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center flex-shrink-0">
                                <Bell className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-sm text-foreground/90">Check out the new trending pins</p>
                                <p className="text-xs text-foreground/50 mt-0.5">1 day ago</p>
                              </div>
                            </div>
                          </div>
                          <div className="border-t border-border/30 p-2">
                            <Link
                              href="/notifications"
                              onClick={() => setIsNotificationsOpen(false)}
                              className="block text-center text-sm text-accent hover:text-accent/80 transition-colors py-1 font-medium"
                            >
                              View all notifications
                            </Link>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Profile dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="flex items-center gap-2 p-1.5 hover:bg-card/50 rounded-full transition-colors duration-200"
                    >
                      <UserAvatar
                        userId={currentUser.id}
                        displayName={currentUser.displayName}
                        avatarUrl={currentUser.avatar}
                        size="sm"
                      />
                      <ChevronDown className={`w-3.5 h-3.5 text-foreground/50 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isProfileOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                        <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border/50 rounded-xl shadow-lg z-50 overflow-hidden animate-slideDown">
                          <div className="p-3 border-b border-border/30">
                            <p className="font-semibold text-sm text-foreground truncate">{currentUser.displayName}</p>
                            <p className="text-xs text-foreground/50 truncate">@{currentUser.username}</p>
                          </div>
                          <div className="py-1">
                            <Link href="/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground/80 hover:bg-background/50 hover:text-foreground transition-colors">
                              <UserAvatar userId={currentUser.id} displayName={currentUser.displayName} avatarUrl={currentUser.avatar} size="sm" />
                              My Profile
                            </Link>
                            <Link href="/settings" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground/80 hover:bg-background/50 hover:text-foreground transition-colors">
                              <Settings className="w-4 h-4 ml-1" />
                              Settings
                            </Link>
                          </div>
                          <div className="border-t border-border/30 py-1">
                            <button
                              onClick={() => { setIsProfileOpen(false); logout(); }}
                              className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/5 hover:text-red-300 transition-colors w-full text-left"
                            >
                              <LogOut className="w-4 h-4 ml-1" />
                              Sign Out
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => openAuthModal('login')} className="px-5 py-2 text-sm font-medium text-foreground/80 hover:text-foreground border border-border/40 rounded-full hover:border-foreground/30 transition-all duration-200">
                    Log In
                  </button>
                  <button onClick={() => openAuthModal('signup')} className="px-5 py-2 text-sm font-medium text-accent bg-transparent rounded-full hover:text-accent/80 transition-colors duration-200">
                    Sign Up
                  </button>
                </div>
              )}
            </div>

            {/* Mobile: Right side controls */}
            <div className="flex md:hidden items-center gap-1">
              {/* Theme toggle (mobile) */}
              <button
                onClick={() => {
                  // Quick toggle: warm ↔ crimson
                  setTheme(isDarkTheme ? 'quiet-luxury' : 'crimson');
                }}
                className="p-2 hover:bg-card/50 rounded-full transition-colors"
                title="Toggle Theme"
              >
                {isDarkTheme ? (
                  <Moon className="w-5 h-5 text-foreground/60" />
                ) : (
                  <Sun className="w-5 h-5 text-foreground/60" />
                )}
              </button>

              {/* Notification bell (mobile, logged in) */}
              {isLoggedIn && currentUser && (
                <Link href="/notifications" className="relative p-2 hover:bg-card/50 rounded-full transition-colors">
                  <Bell className="w-5 h-5 text-foreground/60" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Hamburger menu toggle */}
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu" className="p-2 hover:bg-card/50 rounded-lg transition-colors">
                {isMenuOpen ? <X className="w-6 h-6 text-foreground" /> : <Menu className="w-6 h-6 text-foreground" />}
              </button>
            </div>
          </div>

          {/* Mobile dropdown */}
          {isMenuOpen && (
            <div className="md:hidden absolute top-16 left-0 right-0 bg-background border-b border-border/50 animate-slideDown z-40">
              <div className="flex flex-col gap-3 p-4">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/40" />
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search pins..." className="w-full bg-card/50 border border-border/30 rounded-full pl-10 pr-4 py-2 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-accent/50" />
                </form>
                {isLoggedIn ? (
                  <div className="flex flex-col gap-1">
                    <Link href="/create" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-card/50 rounded-lg">
                      <Plus className="w-4 h-4 text-accent" /> Create Pin
                    </Link>
                    <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-card/50 rounded-lg">
                      <UserAvatar userId={currentUser?.id} displayName={currentUser?.displayName || 'U'} avatarUrl={currentUser?.avatar} size="sm" /> Profile
                    </Link>
                    <Link href="/settings" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-card/50 rounded-lg">
                      <Settings className="w-4 h-4" /> Settings
                    </Link>
                    <button onClick={() => { setIsMenuOpen(false); logout(); }} className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/5 rounded-lg text-left">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => { openAuthModal('login'); setIsMenuOpen(false); }} className="flex-1 px-4 py-2 text-sm border border-border/40 rounded-full hover:border-foreground/30 transition-all">Log In</button>
                    <button onClick={() => { openAuthModal('signup'); setIsMenuOpen(false); }} className="flex-1 px-4 py-2 text-sm text-accent bg-transparent rounded-full hover:text-accent/80 transition-colors">Sign Up</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>
      <AuthModal isOpen={showAuthModal} onClose={closeAuthModal} initialMode={authModalMode} />
    </>
  );
}
