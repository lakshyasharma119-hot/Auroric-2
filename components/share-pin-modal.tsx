'use client';

import React, { useState } from 'react';
import { X, Send, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { useChat } from '@/context/ChatContext';
import UserAvatar from '@/components/user-avatar';

import { Search as SearchIcon } from 'lucide-react';

export default function SharePinModal() {
  const { currentUser, users } = useApp();
  const { sendPinShare, activeSharePin, closeShareModal, messages } = useChat();
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  if (!activeSharePin || !currentUser) return null;

  // Filter out the current user
  const shareableUsers = users.filter((u) => u.id !== currentUser.id);

  // Determine recent users
  const recentUserIds = new Set<string>();
  messages.forEach(msg => {
    if (msg.senderId === currentUser.id) recentUserIds.add(msg.recipientId);
    if (msg.recipientId === currentUser.id) recentUserIds.add(msg.senderId);
  });

  const searchedUsers = shareableUsers.filter(u => 
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const recentUsers = searchedUsers.filter(u => recentUserIds.has(u.id));
  const otherUsers = searchedUsers.filter(u => !recentUserIds.has(u.id));

  const handleSend = async (userId: string) => {
    if (sendingTo) return;
    setSendingTo(userId);
    try {
      const success = await sendPinShare(userId, activeSharePin);
      if (success) {
        setSentTo((prev) => ({ ...prev, [userId]: true }));
        setTimeout(() => {
           // closeShareModal();
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to share pin:', err);
    } finally {
      setSendingTo(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={closeShareModal}
      />
      <div className="relative w-full max-w-sm bg-card border border-border/50 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border/20">
          <h3 className="font-semibold text-lg">Send to...</h3>
          <button
            onClick={closeShareModal}
            className="p-2 text-foreground/50 hover:text-foreground hover:bg-foreground/5 rounded-full smooth-transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 border-b border-border/10">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-background/50 border border-border/30 rounded-lg pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-accent/50"
            />
          </div>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-2">
          {searchedUsers.length === 0 ? (
            <div className="p-8 text-center text-foreground/50">
              No users found.
            </div>
          ) : (
            <>
              {recentUsers.length > 0 && (
                <div className="mb-2">
                  {!searchQuery && <h3 className="text-xs text-foreground/40 uppercase tracking-wider mb-1 mt-2 px-2">Recent</h3>}
                  {recentUsers.map(renderUser)}
                </div>
              )}
              {otherUsers.length > 0 && (
                <div>
                  {!searchQuery && recentUsers.length > 0 && <h3 className="text-xs text-foreground/40 uppercase tracking-wider mb-1 mt-4 px-2">All</h3>}
                  {otherUsers.map(renderUser)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  function renderUser(user: any) {
    return (
      <div
        key={user.id}
        className="flex items-center justify-between p-2 hover:bg-foreground/5 rounded-xl smooth-transition group"
      >
        <div className="flex items-center gap-3">
          <UserAvatar
            userId={user.id}
            displayName={user.displayName}
            avatarUrl={user.avatar}
            size="md"
          />
          <div>
            <p className="font-semibold text-sm">{user.displayName}</p>
            <p className="text-xs text-foreground/50">@{user.username}</p>
          </div>
        </div>

        {sentTo[user.id] ? (
          <div className="flex items-center gap-1.5 text-emerald-500 font-medium text-sm px-3 py-1.5 bg-emerald-500/10 rounded-full">
            <CheckCircle2 className="w-4 h-4" />
            <span>Sent</span>
          </div>
        ) : (
          <button
            onClick={() => handleSend(user.id)}
            disabled={sendingTo === user.id}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-accent text-accent-foreground rounded-full text-sm font-semibold hover:brightness-110 disabled:opacity-50 smooth-transition"
          >
            {sendingTo === user.id ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </>
            )}
          </button>
        )}
      </div>
    );
  }
}
