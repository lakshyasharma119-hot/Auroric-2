'use client';

import React, { useState, useRef, useEffect } from 'react';
import UserAvatar from '@/components/user-avatar';
import { MoreVertical, CornerUpLeft, Trash2, Flag } from 'lucide-react';
import { type LocalMessage } from '@/hooks/useE2EERelay';

interface MessageBubbleProps {
    msg: LocalMessage;
    isMe: boolean;
    isFirstInCluster: boolean;
    isLastInCluster: boolean;
    showDate: boolean;
    activeOtherUser: any;
    formatMessageDate: (ts: string) => string;
    onUnsend: (id: string) => void;
    onReport: (id: string) => void;
    onReply?: (msg: LocalMessage) => void;
}

export default function MessageBubble({
    msg,
    isMe,
    isFirstInCluster,
    isLastInCluster,
    showDate,
    activeOtherUser,
    formatMessageDate,
    onUnsend,
    onReport,
    onReply
}: MessageBubbleProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        }
        if (menuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [menuOpen]);

    let isPinShare = false;
    let pinData: any = null;
    let isReply = false;
    let replyData: any = null;
    let displayText = msg.plaintext;
    
    try {
        const parsed = JSON.parse(msg.plaintext);
        if (parsed && parsed.type === 'pin_share') {
            isPinShare = true;
            pinData = parsed;
        } else if (parsed && parsed.type === 'reply') {
            isReply = true;
            replyData = parsed;
            displayText = parsed.text;
        }
    } catch (e) { }

    return (
        <React.Fragment>
            {showDate && (
                <div className="w-full text-center text-xs text-gray-500 dark:text-zinc-500 my-6 font-medium">
                    {formatMessageDate(msg.timestamp)}
                </div>
            )}
            <div className={`flex w-full group relative ${isMe ? 'justify-end' : 'justify-start'} ${isFirstInCluster && !showDate ? 'mt-3' : ''}`}>
                {!isMe && (
                    <div className="w-6 h-6 shrink-0 mr-2 self-end mb-1 flex items-center justify-center">
                        {isLastInCluster && (
                            <UserAvatar userId={msg.senderId} displayName={activeOtherUser?.displayName || 'User'} size="sm" />
                        )}
                    </div>
                )}
                <div className={`flex items-center gap-2 max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`px-4 py-2 rounded-3xl text-sm ${isMe ? 'bg-[#3797f0] text-white' : 'bg-gray-200 dark:bg-[#262626] text-black dark:text-white'}`}>
                        {isPinShare && pinData ? (
                            <div className="flex flex-col gap-2 min-w-[200px]">
                                <div className="relative w-full h-32 rounded-xl overflow-hidden border border-black/5 dark:border-white/10">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={pinData.imageUrl} alt={pinData.title} className="object-cover w-full h-full" />
                                </div>
                                <p className="font-semibold text-sm truncate">{pinData.title}</p>
                                <p className="text-[10px] uppercase tracking-wider opacity-70">Shared Pin</p>
                            </div>
                        ) : isReply && replyData ? (
                            <div className="flex flex-col">
                                <div className={`px-3 py-2 mb-1 rounded-xl text-xs opacity-80 border-l-2 ${isMe ? 'bg-white/20 border-white' : 'bg-black/10 dark:bg-white/10 border-black dark:border-white'}`}>
                                    <p className="font-semibold">{replyData.replyToUser}</p>
                                    <p className="truncate opacity-90 max-w-[200px]">{replyData.replyToText}</p>
                                </div>
                                <p className="break-words">{displayText}</p>
                            </div>
                        ) : (
                            <p className="break-words">{displayText}</p>
                        )}
                    </div>

                    {/* Hover Actions */}
                    <div className="relative flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" ref={menuRef}>
                        {onReply && (
                            <button
                                onClick={() => onReply(msg)}
                                className="p-1 rounded-full text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                                title="Reply"
                            >
                                <CornerUpLeft className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className={`p-1 rounded-full transition-colors ${menuOpen ? 'text-black dark:text-white opacity-100' : 'text-gray-400 hover:text-black dark:hover:text-white'}`}
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>

                        {menuOpen && (
                            <div className={`absolute z-10 top-1/2 -translate-y-1/2 mx-1 ${isMe ? 'right-full' : 'left-full'} w-40 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-lg py-1 overflow-hidden`}>
                                <div className="px-4 py-2 text-xs font-medium text-gray-500 border-b border-gray-100 dark:border-zinc-800 mb-1">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                {isMe ? (
                                    <button
                                        onClick={() => {
                                            onUnsend(msg.id);
                                            setMenuOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-[#262626] flex items-center gap-2 text-red-500"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Unsend
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            onReport(msg.id);
                                            setMenuOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-[#262626] flex items-center gap-2 text-red-500"
                                    >
                                        <Flag className="w-4 h-4" />
                                        Report
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}
