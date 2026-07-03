'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Header from '@/components/header';
import UserAvatar from '@/components/user-avatar';
import MessageBubble from '@/components/message-bubble';
import SubscriptionBadge from '@/components/ui/SubscriptionBadge';
import Link from 'next/link';
import { Send, ArrowLeft, MessageCircle, Search, ShieldCheck, AlertTriangle, RefreshCw, Smile, Image as ImageIcon, X, Info, BellOff } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/lib/app-context';
import { timeAgo } from '@/lib/helpers';
import { type LocalMessage } from '@/hooks/useE2EERelay';
import { useChat } from '@/context/ChatContext';
import client from '@/lib/appwrite-client';
import { Databases, Query } from 'appwrite';

function formatMessageDate(timestamp: string) {
    const date = new Date(timestamp);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Today';

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    if (today.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
        return date.toLocaleDateString('en-US', { weekday: 'long' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface LocalConversation {
    userId: string;
    lastMessage: string;
    lastTimestamp: string;
    unreadCount: number;
}

const EMOJIS = ['😀', '😂', '🥺', '😭', '😍', '🥰', '😊', '😎', '🤔', '👍', '❤️', '🔥', '✨', '🎉', '🙌', '😡', '🤯', '🤫', '💅', '👀'];

export default function MessagesPage() {
    const searchParams = useSearchParams();
    const toUserId = searchParams.get('to');
    const { currentUser, isLoggedIn, getUser, openAuthModal, setUnreadMessagesCount } = useApp();

    const {
        isReady: e2eeReady,
        e2eeLoading,
        e2eeError,
        retryInit: e2eeRetry,
        sendMessage: relaySend,
        sendPinShare,
        messages: relayMessages,
        isLoading: relayLoading,
        error: relayError,
        unreadCount: globalUnreadCount,
        markAsRead,
        unsendMessage
    } = useChat();

    useEffect(() => {
        setUnreadMessagesCount(globalUnreadCount);
    }, [globalUnreadCount, setUnreadMessagesCount]);

    const [activeConversation, setActiveConversation] = useState<string | null>(null);
    const [replyingTo, setReplyingTo] = useState<LocalMessage | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [reportMsgId, setReportMsgId] = useState<string | null>(null);
    const [mutedUsers, setMutedUsers] = useState<Record<string, boolean>>({});
    const [blockedUsers, setBlockedUsers] = useState<Record<string, boolean>>({});
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const m = localStorage.getItem('auroric_muted_users');
        if (m) setMutedUsers(JSON.parse(m));
        const b = localStorage.getItem('auroric_blocked_users');
        if (b) setBlockedUsers(JSON.parse(b));
    }, []);

    const toggleMute = () => {
        if (!activeConversation) return;
        const newMuted = { ...mutedUsers, [activeConversation]: !mutedUsers[activeConversation] };
        setMutedUsers(newMuted);
        localStorage.setItem('auroric_muted_users', JSON.stringify(newMuted));
    };

    const toggleBlock = () => {
        if (!activeConversation) return;
        const newBlocked = { ...blockedUsers, [activeConversation]: !blockedUsers[activeConversation] };
        setBlockedUsers(newBlocked);
        localStorage.setItem('auroric_blocked_users', JSON.stringify(newBlocked));
    };
    const emojiRef = useRef<HTMLDivElement>(null);

    const [profileCache, setProfileCache] = useState<Record<string, any>>({});
    const [fetchingProfile, setFetchingProfile] = useState(false);
    const [fetchedUserError, setFetchedUserError] = useState<string | null>(null);
    const [fetchedUserHasNoKey, setFetchedUserHasNoKey] = useState(false);

    const databases = useMemo(() => new Databases(client), []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        }
        if (showEmojiPicker) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showEmojiPicker]);

    // Derive local conversations from IndexedDB messages
    const derivedConversations = useMemo(() => {
        if (!currentUser || relayMessages.length === 0) return [];
        const group = new Map<string, LocalConversation>();

        for (const m of relayMessages) {
            const partnerId = m.senderId === currentUser.id ? m.recipientId : m.senderId;
            const existing = group.get(partnerId);

            const msgTime = new Date(m.timestamp).getTime();
            const existingTime = existing ? new Date(existing.lastTimestamp).getTime() : 0;
            const isNewer = msgTime > existingTime;

            // Read lastViewed inside useMemo safely
            let lastViewed = 0;
            if (typeof window !== 'undefined') {
                lastViewed = parseInt(window.localStorage.getItem('lastViewed_' + partnerId) || '0', 10);
            }
            const isUnread = m.recipientId === currentUser.id && !m.isRequest && msgTime > lastViewed;

            if (!existing) {
                group.set(partnerId, {
                    userId: partnerId,
                    lastMessage: m.plaintext,
                    lastTimestamp: m.timestamp,
                    unreadCount: isUnread ? 1 : 0
                });
            } else {
                if (isNewer) {
                    existing.lastMessage = m.plaintext;
                    existing.lastTimestamp = m.timestamp;
                }
                if (isUnread) {
                    existing.unreadCount += 1;
                }
            }
        }

        return Array.from(group.values()).sort((a, b) =>
            new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()
        );
    }, [relayMessages, currentUser]);

    // Enrich profiles
    useEffect(() => {
        const missingIds = derivedConversations
            .map(c => c.userId)
            .filter(id => !profileCache[id] && !getUser(id));

        if (missingIds.length > 0) {
            const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'auroric-db';
            databases.listDocuments(dbId, 'users', [
                Query.equal('$id', missingIds),
                Query.select(['username', 'avatar', 'displayName', 'publicKey'])
            ]).then(res => {
                const newCache = { ...profileCache };
                res.documents.forEach(doc => {
                    newCache[doc.$id] = doc;
                });
                setProfileCache(newCache);
            }).catch(console.error);
        }
    }, [derivedConversations, databases, getUser, profileCache]);

    // Handle ?to= param
    useEffect(() => {
        if (!toUserId || !currentUser || toUserId === currentUser.id) return;

        setActiveConversation(toUserId);

        const existingUser = profileCache[toUserId] || getUser(toUserId);
        const needsKey = !existingUser || !existingUser.publicKey;

        if (needsKey) {
            setFetchingProfile(true);
            setFetchedUserError(null);
            setFetchedUserHasNoKey(false);

            const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'auroric-db';

            const profilePromise = databases.getDocument(dbId, 'users', toUserId, [
                Query.select(['username', 'avatar', 'displayName'])
            ]).catch(() => existingUser); // fallback to existing user info if getDocument fails

            const pubKeyPromise = fetch(`/api/users/${toUserId}/public-key`).then(res => {
                console.log(`[Frontend] /api/users/${toUserId}/public-key status:`, res.status);
                return res.json();
            });

            Promise.all([profilePromise, pubKeyPromise]).then(([doc, pubKeyData]) => {
                console.log('[Frontend] /api/users public key response data:', pubKeyData);
                const enrichedDoc = { ...doc, publicKey: pubKeyData.publicKey };
                setProfileCache(prev => ({ ...prev, [toUserId]: enrichedDoc }));

                if (!enrichedDoc.publicKey) {
                    console.log(`[Frontend] No publicKey found for ${toUserId}`);
                    setFetchedUserHasNoKey(true);
                } else {
                    setFetchedUserHasNoKey(false);
                }
            }).catch((err) => {
                console.error('Failed to fetch user or public key:', err);
                setFetchedUserError('User not found or unavailable.');
            }).finally(() => {
                setFetchingProfile(false);
            });
        } else {
            setFetchedUserHasNoKey(false);
        }
    }, [toUserId, currentUser, databases, getUser, profileCache]);

    // Update lastViewed when active conversation changes or new messages arrive
    useEffect(() => {
        if (activeConversation && typeof window !== 'undefined') {
            markAsRead(activeConversation);
        }
    }, [activeConversation, relayMessages, markAsRead]);

    const filteredConversations = useMemo(() => {
        if (!searchQuery.trim()) return derivedConversations;
        return derivedConversations.filter(c => {
            const otherUser = profileCache[c.userId] || getUser(c.userId);
            return otherUser?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                otherUser?.username?.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [derivedConversations, searchQuery, getUser, profileCache]);

    const activeOtherUser = activeConversation
        ? (getUser(activeConversation) || profileCache[activeConversation])
        : null;

    // Derive messages for the active conversation from relay (IndexedDB)
    const activeMessages: LocalMessage[] = useMemo(() => {
        if (!activeConversation || !currentUser) return [];
        return relayMessages.filter(
            (m) =>
                (m.senderId === currentUser.id && m.recipientId === activeConversation) ||
                (m.senderId === activeConversation && m.recipientId === currentUser.id)
        );
    }, [relayMessages, activeConversation, currentUser]);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (messagesEndRef.current) {
            const container = messagesEndRef.current.parentElement;
            if (container) {
                container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
            }
        }
    }, [activeMessages]);

    const handleSend = async () => {
        if (!newMessage.trim() || sending) return;
        const recipientId = activeConversation;

        if (!recipientId) return;

        setSending(true);
        try {
            let payload = newMessage.trim();
            
            if (replyingTo) {
                const replyToUser = profileCache[replyingTo.senderId]?.displayName || getUser(replyingTo.senderId)?.displayName || 'User';
                
                let replyToText = replyingTo.plaintext;
                try {
                    const p = JSON.parse(replyingTo.plaintext);
                    if (p.type === 'reply') replyToText = p.text;
                    if (p.type === 'pin_share') replyToText = '[Shared Pin]';
                } catch(e) {}
                
                payload = JSON.stringify({
                    type: 'reply',
                    text: payload,
                    replyToUser,
                    replyToText
                });
            }

            const success = await relaySend(recipientId, payload);
            if (success) {
                setNewMessage('');
                setReplyingTo(null);
            }
        } catch (error) {
            console.error('Send error:', error);
        } finally {
            setSending(false);
        }
    };

    const handleReply = (msg: LocalMessage) => {
        setReplyingTo(msg);
    };

    const handleUnsend = async (msgId: string) => {
        if (!activeConversation) return;
        try {
            await unsendMessage(msgId, activeConversation);
        } catch (e) {
            console.error('Failed to unsend:', e);
        }
    };

    const handleReport = (msgId: string) => {
        setReportMsgId(msgId);
    };

    const submitReport = () => {
        alert('Report submitted successfully. We will review this message.');
        setReportMsgId(null);
    };

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <MessageCircle className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
                        <h1 className="text-3xl font-bold mb-3">Messages</h1>
                        <p className="text-foreground/60 mb-6">Sign in to send and receive messages.</p>
                        <div className="flex gap-3 justify-center">
                            <button onClick={() => openAuthModal('login')} className="luxury-button-outline px-6 py-2.5">Log In</button>
                            <button onClick={() => openAuthModal('signup')} className="luxury-button px-6 py-2.5">Sign Up</button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // E2EE initialization states
    if (e2eeLoading) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <ShieldCheck className="w-14 h-14 text-accent/60 mx-auto mb-4 animate-pulse" />
                        <h2 className="text-xl font-semibold mb-2">Setting up encryption...</h2>
                        <p className="text-foreground/50 text-sm max-w-xs mx-auto">
                            Generating your encryption keys. This only happens once.
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    if (e2eeError) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <AlertTriangle className="w-14 h-14 text-orange-400/70 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Encryption Setup Failed</h2>
                        <p className="text-foreground/50 text-sm max-w-sm mx-auto mb-5">
                            {e2eeError}
                        </p>
                        <button
                            onClick={e2eeRetry}
                            className="luxury-button-outline px-5 py-2 inline-flex items-center gap-2 text-sm"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Try Again
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black flex flex-col">
            <Header />
            <main className="flex-1 w-full flex justify-center pb-[80px]">
                <div className="w-full max-w-6xl h-[calc(100vh-140px)] border-x border-gray-200 dark:border-zinc-800 flex flex-row overflow-hidden bg-white dark:bg-black">
                    {/* Conversations sidebar */}
                    <div className={`w-full md:w-[350px] border-r border-gray-200 dark:border-zinc-800 flex flex-col shrink-0 ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
                        <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
                            <h2 className="text-xl font-bold mb-3 text-black dark:text-white">
                                Messages
                                {globalUnreadCount > 0 && (
                                    <span className="ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-[11px] font-bold text-white align-middle">
                                        {globalUnreadCount}
                                    </span>
                                )}
                            </h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-zinc-500" />
                                <input
                                    type="text"
                                    placeholder="Search conversations..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full bg-gray-100 dark:bg-[#262626] border-none rounded-lg pl-10 pr-4 py-2 text-sm text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-zinc-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {relayLoading ? (
                                <div className="p-4 text-center text-gray-500 dark:text-zinc-500">Loading...</div>
                            ) : filteredConversations.length === 0 ? (
                                <div className="p-8 text-center">
                                    <MessageCircle className="w-10 h-10 text-gray-300 dark:text-zinc-700 mx-auto mb-3" />
                                    <p className="text-gray-500 dark:text-zinc-500 text-sm">No conversations yet</p>
                                    <p className="text-gray-400 dark:text-zinc-600 text-xs mt-1">Visit a user's profile and click "Message" to start chatting!</p>
                                </div>
                            ) : (
                                filteredConversations.map(convo => {
                                    const otherId = convo.userId;
                                    const other = profileCache[otherId] || getUser(otherId);
                                    return (
                                        <button
                                            key={convo.userId}
                                            onClick={() => setActiveConversation(convo.userId)}
                                            className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-[#262626]/50 smooth-transition ${activeConversation === convo.userId ? 'bg-gray-100 dark:bg-[#262626]' : ''}`}
                                        >
                                            <UserAvatar userId={otherId} displayName={other?.displayName || 'User'} size="md" />
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm truncate flex items-center gap-2 ${convo.unreadCount > 0 && activeConversation !== convo.userId ? 'font-bold text-black dark:text-white' : 'font-semibold text-gray-700 dark:text-zinc-300'}`}>
                                                    <span className="truncate">{other?.displayName || 'Unknown User'}</span>
                                                    {convo.unreadCount > 0 && activeConversation !== convo.userId && (
                                                        <span className="w-2 h-2 rounded-full bg-[#3797f0] flex-shrink-0"></span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-zinc-500 truncate">
                                                    {(() => {
                                                        try {
                                                            const p = JSON.parse(convo.lastMessage || '');
                                                            if (p.type === 'reply') return p.text;
                                                            if (p.type === 'pin_share') return 'Shared a pin';
                                                        } catch(e) {}
                                                        return convo.lastMessage || 'No messages yet';
                                                    })()}
                                                </p>
                                            </div>
                                            {convo.lastTimestamp && (
                                                <span className="text-[10px] text-gray-400 dark:text-zinc-600 shrink-0">{timeAgo(convo.lastTimestamp)}</span>
                                            )}
                                        </button>
                                    );
                                })
                            )}

                            {toUserId && activeConversation === toUserId && !derivedConversations.some(c => c.userId === toUserId) && (
                                <div className="px-4 py-3 flex items-center gap-3 bg-gray-100 dark:bg-[#262626]">
                                    <UserAvatar userId={toUserId} displayName={activeOtherUser?.displayName || 'User'} size="md" />
                                    <div>
                                        <p className="font-semibold text-sm text-black dark:text-white">{activeOtherUser?.displayName || 'New Conversation'}</p>
                                        <p className="text-xs text-gray-500 dark:text-zinc-500">New message</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={`flex-1 flex flex-col ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
                        {activeConversation ? (
                            <>
                                {/* Chat header */}
                                <div className="border-b border-gray-200 dark:border-zinc-800 pb-4 pt-2 px-4 flex items-center justify-between shrink-0 mt-4 md:mt-2">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setActiveConversation(null)}
                                            className="md:hidden text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                                        >
                                            <ArrowLeft className="w-6 h-6" />
                                        </button>
                                        {activeOtherUser ? (
                                            <Link href={`/user/${activeOtherUser.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                                <UserAvatar userId={activeConversation} displayName={activeOtherUser.displayName} size="md" />
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1.5">
                                                        <p className="font-semibold text-black dark:text-white text-sm">{activeOtherUser.displayName}</p>
                                                        <SubscriptionBadge tier={activeOtherUser.subscriptionTier || 'free'} size="sm" />
                                                    </div>
                                                    <p className="text-xs text-gray-500 dark:text-zinc-500">Active</p>
                                                </div>
                                            </Link>
                                        ) : fetchingProfile ? (
                                            <div className="flex items-center gap-3 animate-pulse w-full">
                                                <div className="w-10 h-10 bg-gray-200 dark:bg-zinc-800 rounded-full" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-1/3" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="font-semibold text-black dark:text-white text-sm">Unknown User</div>
                                        )}
                                    </div>
                                    <button onClick={() => setShowDetails(!showDetails)} className={`text-gray-500 hover:text-black dark:hover:text-white transition-colors ${showDetails ? 'text-black dark:text-white' : ''}`}>
                                        <Info className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Messages — from E2EE relay (decrypted, from IndexedDB) */}
                                {fetchingProfile ? (
                                    <div className="flex-1 flex items-center justify-center">
                                        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : fetchedUserError ? (
                                    <div className="flex-1 flex items-center justify-center p-4 text-center">
                                        <div>
                                            <AlertTriangle className="w-12 h-12 text-red-500/70 mx-auto mb-3" />
                                            <p className="text-foreground/80 font-medium">Failed to load conversation</p>
                                            <p className="text-foreground/50 text-sm mt-1">{fetchedUserError}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 overflow-y-auto flex flex-col gap-1 p-4">
                                        {fetchedUserHasNoKey && activeMessages.length === 0 ? (
                                            <div className="text-center py-12">
                                                <ShieldCheck className="w-10 h-10 text-gray-300 dark:text-zinc-700 mx-auto mb-3" />
                                                <p className="text-gray-500 dark:text-zinc-500 text-sm max-w-sm mx-auto">This user hasn't set up messaging yet. They'll need to open their messages page first.</p>
                                            </div>
                                        ) : activeMessages.length === 0 ? (
                                            <div className="text-center py-12 flex flex-col items-center">
                                                <UserAvatar userId={activeConversation} displayName={activeOtherUser?.displayName || 'User'} size="lg" />
                                                <p className="text-black dark:text-white font-semibold mt-4">{activeOtherUser?.displayName}</p>
                                                <p className="text-gray-500 dark:text-zinc-500 text-sm">Auroric</p>
                                            </div>
                                        ) : null}

                                        {activeMessages.map((msg, idx) => {
                                            const isMe = msg.senderId === currentUser?.id;
                                            const prevMsg = activeMessages[idx - 1];
                                            const nextMsg = activeMessages[idx + 1];
                                            const isFirstInCluster = !prevMsg || prevMsg.senderId !== msg.senderId;
                                            const isLastInCluster = !nextMsg || nextMsg.senderId !== msg.senderId;

                                            const prevDate = prevMsg ? new Date(prevMsg.timestamp).toDateString() : null;
                                            const currDate = new Date(msg.timestamp).toDateString();
                                            const showDate = prevDate !== currDate;

                                            return (
                                                <MessageBubble
                                                    key={msg.id}
                                                    msg={msg}
                                                    isMe={isMe}
                                                    isFirstInCluster={isFirstInCluster}
                                                    isLastInCluster={isLastInCluster}
                                                    showDate={showDate}
                                                    activeOtherUser={activeOtherUser}
                                                    formatMessageDate={formatMessageDate}
                                                    onUnsend={handleUnsend}
                                                    onReport={handleReport}
                                                    onReply={handleReply}
                                                />
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>
                                )}

                                {/* Input */}
                                {!fetchingProfile && !fetchedUserError && !fetchedUserHasNoKey && (
                                    <div className="p-4 pt-2 shrink-0">
                                        {blockedUsers[activeConversation] ? (
                                            <div className="text-center p-4 bg-gray-50 dark:bg-[#262626] rounded-xl text-sm text-gray-500 dark:text-zinc-400">
                                                You blocked this account. You can't message them.
                                            </div>
                                        ) : (
                                            <>
                                                {replyingTo && (
                                                    <div className="mb-2 bg-gray-100 dark:bg-[#262626] rounded-t-2xl rounded-b-sm px-4 py-3 flex justify-between items-start border-l-4 border-[#3797f0]">
                                                        <div className="flex flex-col flex-1 min-w-0 mr-4">
                                                            <span className="text-xs font-semibold text-[#3797f0] mb-1">
                                                                Replying to {profileCache[replyingTo.senderId]?.displayName || getUser(replyingTo.senderId)?.displayName || 'User'}
                                                            </span>
                                                            <span className="text-sm text-gray-500 dark:text-zinc-400 truncate">
                                                                {(() => {
                                                                    try {
                                                                        const p = JSON.parse(replyingTo.plaintext);
                                                                        if (p.type === 'reply') return p.text;
                                                                        if (p.type === 'pin_share') return '[Shared Pin]';
                                                                    } catch(e) {}
                                                                    return replyingTo.plaintext;
                                                                })()}
                                                            </span>
                                                        </div>
                                                        <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                                                            <X className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                )}
                                                <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="relative flex items-center">
                                                    <div ref={emojiRef} className="absolute left-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                                            className="text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-white cursor-pointer transition-colors p-1"
                                                        >
                                                            <Smile className="w-6 h-6" />
                                                        </button>
                                                        {showEmojiPicker && (
                                                            <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-lg p-2 w-[280px] grid grid-cols-5 gap-1 z-50">
                                                                {EMOJIS.map(emoji => (
                                                                    <button
                                                                        key={emoji}
                                                                        type="button"
                                                                        onClick={() => { setNewMessage(prev => prev + emoji); setShowEmojiPicker(false); }}
                                                                        className="hover:bg-gray-100 dark:hover:bg-zinc-800 p-1.5 rounded text-xl"
                                                                    >
                                                                        {emoji}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={newMessage}
                                                        onChange={e => setNewMessage(e.target.value)}
                                                        placeholder="Message..."
                                                        className="w-full bg-transparent border border-gray-300 dark:border-zinc-700 rounded-full pl-12 pr-12 py-3 text-sm focus:outline-none focus:border-gray-400 dark:focus:border-zinc-500 text-black dark:text-white"
                                                    />
                                                    <div className="absolute right-3 flex items-center gap-1">
                                                        {newMessage.trim() ? (
                                                            <button
                                                                type="submit"
                                                                disabled={sending}
                                                                className="text-[#3797f0] font-semibold text-sm hover:text-blue-600 disabled:opacity-50 p-2"
                                                            >
                                                                Send
                                                            </button>
                                                        ) : (
                                                            <button type="button" className="text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors p-1">
                                                                <ImageIcon className="w-6 h-6" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </form>
                                            </>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                <MessageCircle className="w-16 h-16 text-gray-200 dark:text-zinc-800 mb-4" />
                                <h2 className="text-xl font-bold mb-2">Your Messages</h2>
                                <p className="text-gray-500 dark:text-zinc-500 max-w-sm">
                                    Send private messages and photos to a friend or group.
                                </p>
                            </div>
                        )}
                    </div>
                    
                    {/* Details Sidebar */}
                    {showDetails && activeConversation && (
                        <div className="w-full md:w-[350px] border-l border-gray-200 dark:border-zinc-800 flex flex-col shrink-0 bg-white dark:bg-black absolute md:relative right-0 top-0 h-full z-10 overflow-y-auto smooth-transition">
                            <div className="border-b border-gray-200 dark:border-zinc-800 p-4 pt-6 pb-4 flex items-center justify-between sticky top-0 bg-white dark:bg-black z-20">
                                <h3 className="font-bold text-lg">Details</h3>
                                <button onClick={() => setShowDetails(false)} className="md:hidden text-gray-500 hover:text-black dark:hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            
                            <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-zinc-800">
                                <div className="flex items-center gap-3">
                                    <BellOff className="w-5 h-5 text-gray-500 dark:text-zinc-400" />
                                    <span className="font-medium text-sm">Mute messages</span>
                                </div>
                                <button onClick={toggleMute} className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${mutedUsers[activeConversation] ? 'bg-[#3797f0]' : 'bg-gray-200 dark:bg-zinc-700'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${mutedUsers[activeConversation] ? 'translate-x-4' : ''}`}></div>
                                </button>
                            </div>
                            
                            <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
                                <h4 className="font-semibold text-sm mb-4">Members</h4>
                                <Link href={`/user/${activeOtherUser?.username}`} className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-[#262626] p-2 -mx-2 rounded-xl transition-colors">
                                    <UserAvatar userId={activeConversation} displayName={activeOtherUser?.displayName || 'User'} size="lg" />
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-sm">{activeOtherUser?.displayName}</span>
                                        <span className="text-xs text-gray-500 dark:text-zinc-400">@{activeOtherUser?.username}</span>
                                    </div>
                                </Link>
                            </div>
                            
                            <div className="p-4 flex flex-col gap-5 mt-2">
                                <button onClick={toggleBlock} className="text-left font-medium text-sm hover:underline">
                                    {blockedUsers[activeConversation] ? 'Unblock' : 'Block'}
                                </button>
                                <button onClick={() => setReportMsgId(activeConversation)} className="text-left font-medium text-sm text-red-500 hover:underline">
                                    Report
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Report Modal */}
            {reportMsgId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[#1a1a1a] w-full max-w-md rounded-2xl overflow-hidden border border-gray-200 dark:border-zinc-800 shadow-2xl flex flex-col">
                        <div className="relative flex items-center justify-center p-4 border-b border-gray-100 dark:border-zinc-800">
                            <h3 className="font-semibold">Report</h3>
                            <button onClick={() => setReportMsgId(null)} className="absolute left-4 p-2 text-gray-500 hover:text-black dark:hover:text-white transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="overflow-y-auto max-h-[60vh]">
                            <div className="p-4 font-semibold text-sm">Select a problem to report</div>
                            {[
                                'Nudity or sexual activity',
                                'Hate speech or symbols',
                                'Scam or fraud',
                                'Profile may have been hacked',
                                'Violence or dangerous organizations',
                                'Sale of illegal or regulated goods',
                                'Bullying or harassment',
                                'Intellectual property violation',
                                'Suicide or self-injury',
                                'Spam',
                                'The problem isn\'t listed here'
                            ].map(reason => (
                                <button key={reason} onClick={submitReport} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-zinc-800/50 flex justify-between items-center transition-colors">
                                    {reason}
                                    <span className="text-gray-400">›</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
