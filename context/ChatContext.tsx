'use client';

import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useApp } from '@/lib/app-context';
import { useE2EEInitialization } from '@/hooks/useE2EEInitialization';
import { useE2EERelay, type LocalMessage } from '@/hooks/useE2EERelay';

export interface SharedPinData {
  pinId: string;
  imageUrl: string;
  title: string;
}

interface ChatContextType {
  sendMessage: (recipientId: string, plaintext: string, isRequest?: boolean) => Promise<boolean>;
  sendPinShare: (recipientId: string, pinData: SharedPinData) => Promise<boolean>;
  messages: LocalMessage[];
  isLoading: boolean;
  error: string | null;
  unreadCount: number;
  markAsRead: (userId: string) => void;
  unsendMessage: (messageId: string, recipientId: string) => Promise<boolean>;
  isReady: boolean;
  e2eeLoading: boolean;
  e2eeError: string | null;
  retryInit: () => void;
  activeSharePin: SharedPinData | null;
  openShareModal: (pinData: SharedPinData) => void;
  closeShareModal: () => void;
}

const defaultContext: ChatContextType = {
  sendMessage: async () => false,
  sendPinShare: async () => false,
  messages: [],
  isLoading: false,
  error: null,
  unreadCount: 0,
  markAsRead: () => {},
  unsendMessage: async () => false,
  isReady: false,
  e2eeLoading: false,
  e2eeError: null,
  retryInit: () => {},
  activeSharePin: null,
  openShareModal: () => {},
  closeShareModal: () => {},
};

const ChatContext = createContext<ChatContextType>(defaultContext);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { currentUser, setUnreadMessagesCount } = useApp();
  const { isInitialized, isLoading: e2eeLoading, error: e2eeError, privateKey, retry } = useE2EEInitialization();

  const {
    sendMessage,
    messages,
    isLoading: relayLoading,
    error: relayError,
    unreadCount,
    markAsRead,
    unsendMessage,
  } = useE2EERelay({
    privateKey,
    currentUserId: currentUser?.id || '',
  });

  const [activeSharePin, setActiveSharePin] = React.useState<SharedPinData | null>(null);

  const openShareModal = (pinData: SharedPinData) => setActiveSharePin(pinData);
  const closeShareModal = () => setActiveSharePin(null);

  const sendPinShare = async (recipientId: string, pinData: SharedPinData) => {
    const payload = JSON.stringify({ type: 'pin_share', ...pinData });
    return sendMessage(recipientId, payload);
  };

  // Optional: Keep global context synced with real-time unreadCount if needed
  useEffect(() => {
    if (currentUser && setUnreadMessagesCount) {
      setUnreadMessagesCount(unreadCount);
    }
  }, [unreadCount, currentUser, setUnreadMessagesCount]);

  const value: ChatContextType = {
    sendMessage,
    sendPinShare,
    messages,
    isLoading: relayLoading,
    error: relayError,
    unreadCount,
    markAsRead,
    unsendMessage,
    isReady: isInitialized,
    e2eeLoading,
    e2eeError,
    retryInit: retry,
    activeSharePin,
    openShareModal,
    closeShareModal,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  return useContext(ChatContext);
}
