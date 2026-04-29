'use client';

import React from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Bell, Heart, MessageCircle, UserPlus, Zap } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import Link from 'next/link';
import { timeAgo } from '@/lib/helpers';

export default function NotificationsPage() {
  const { isLoggedIn, currentUser, openAuthModal, notifications, markAllRead, markNotificationRead } = useApp();

  const getIconAndColor = (type: string) => {
    switch (type) {
      case 'like':
        return { icon: <Heart className="w-5 h-5 fill-current" />, color: 'bg-red-500/20 text-red-500' };
      case 'comment':
        return { icon: <MessageCircle className="w-5 h-5 fill-current" />, color: 'bg-blue-500/20 text-blue-500' };
      case 'follow':
        return { icon: <UserPlus className="w-5 h-5" />, color: 'bg-emerald-500/20 text-emerald-500' };
      default:
        return { icon: <Zap className="w-5 h-5" />, color: 'bg-accent/20 text-accent' };
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20 px-4">
          <div className="text-center max-w-md w-full bg-card/50 border border-border/30 rounded-2xl p-8 backdrop-blur-sm animate-slideUp">
            <div className="w-16 h-16 bg-accent/20 text-accent rounded-full flex items-center justify-center mx-auto mb-6">
              <Bell className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Stay Updated</h1>
            <p className="text-foreground/60 mb-8">Log in to see your notifications, likes, and follows.</p>
            <button onClick={() => openAuthModal('login')} className="luxury-button w-full">
              Log In to View
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8 animate-slideUp">
          <h1 className="text-3xl font-bold font-syne text-foreground">Notifications</h1>
          {notifications.length > 0 && notifications.some(n => !n.read) && (
            <button onClick={markAllRead} className="text-sm font-medium text-accent hover:text-accent/80 transition-colors">
              Mark all as read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-20 animate-slideUp">
            <Bell className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground/60 mb-2">No notifications yet</h3>
            <p className="text-foreground/40">When people interact with you or your pins, you'll see it here.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 animate-slideUp" style={{ animationDelay: '100ms' }}>
              {notifications.map((notification) => {
                const { icon, color } = getIconAndColor(notification.type);
                return (
                  <div
                    key={notification.id}
                    onClick={() => !notification.read && markNotificationRead(notification.id)}
                    className={`p-5 rounded-xl border transition-all duration-300 flex gap-4 ${
                      notification.read
                        ? 'bg-card/30 border-border/20 opacity-80'
                        : 'bg-card/80 border-accent/30 shadow-sm cursor-pointer hover:border-accent/50'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <p className="text-foreground font-medium text-base mb-1">{notification.message}</p>
                      <p className="text-sm text-foreground/50">{timeAgo(notification.createdAt)}</p>
                    </div>
                    {!notification.read && (
                      <div className="flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-accent" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-12 text-center animate-slideUp" style={{ animationDelay: '200ms' }}>
              <p className="text-foreground/40 text-sm">You've reached the end.</p>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
