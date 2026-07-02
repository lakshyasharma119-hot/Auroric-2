'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  encryptMessage,
  decryptMessage,
  importPublicKeyFromJWK,
} from '@/lib/cryptoUtils';
import client from '@/lib/appwrite-client';

// ============================================================================
// TYPES
// ============================================================================

export interface LocalMessage {
  id: string;
  senderId: string;
  recipientId: string;
  plaintext: string;
  timestamp: string;
  isRequest: boolean;
}

interface RelayMessage {
  id: string;
  senderId: string;
  recipientId: string;
  ciphertext: string;
  createdAt: string;
  isRequest: boolean;
}

interface UseE2EERelayInput {
  privateKey: CryptoKey | null;
  currentUserId: string;
}

interface UseE2EERelayResult {
  sendMessage: (recipientId: string, plaintext: string, isRequest?: boolean) => Promise<boolean>;
  messages: LocalMessage[];
  isLoading: boolean;
  error: string | null;
  unreadCount: number;
  markAsRead: (userId: string) => void;
  unsendMessage: (messageId: string, recipientId: string) => Promise<boolean>;
}

// ============================================================================
// INDEXEDDB HELPERS — "auroric_messages" database
// ============================================================================

const IDB_MSG_DB = 'auroric_messages';
const IDB_MSG_STORE = 'messages';
const IDB_MSG_VERSION = 1;

/**
 * Build a consistent conversation key by sorting the two user IDs alphabetically.
 */
function convKey(userId1: string, userId2: string): string {
  const sorted = [userId1, userId2].sort();
  return `conv_${sorted[0]}_${sorted[1]}`;
}

function openMessagesDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_MSG_DB, IDB_MSG_VERSION);

    request.onerror = () => reject(new Error('Failed to open auroric_messages DB'));

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDB_MSG_STORE)) {
        db.createObjectStore(IDB_MSG_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
  });
}

async function getConversationMessages(
  currentUserId: string,
  otherUserId: string
): Promise<LocalMessage[]> {
  try {
    const db = await openMessagesDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_MSG_STORE, 'readonly');
      const store = tx.objectStore(IDB_MSG_STORE);
      const key = convKey(currentUserId, otherUserId);
      const req = store.get(key);

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(new Error('Failed to read messages from IndexedDB'));
    });
  } catch (err) {
    console.error('[E2EE Relay] IndexedDB read error:', err);
    return [];
  }
}

async function storeMessage(
  currentUserId: string,
  otherUserId: string,
  message: LocalMessage
): Promise<void> {
  try {
    const db = await openMessagesDB();
    const key = convKey(currentUserId, otherUserId);

    // Read existing messages
    const existing: LocalMessage[] = await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_MSG_STORE, 'readonly');
      const store = tx.objectStore(IDB_MSG_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(new Error('Read failed'));
    });

    // Check for duplicates (by id)
    if (existing.some((m) => m.id === message.id)) {
      return;
    }

    // Append and write back
    const updated = [...existing, message];

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_MSG_STORE, 'readwrite');
      const store = tx.objectStore(IDB_MSG_STORE);
      store.put(updated, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error('Write failed'));
    });
  } catch (err) {
    console.error('[E2EE Relay] IndexedDB write error:', err);
  }
}

async function removeMessage(
  currentUserId: string,
  otherUserId: string,
  messageId: string
): Promise<void> {
  try {
    const db = await openMessagesDB();
    const key = convKey(currentUserId, otherUserId);

    const existing: LocalMessage[] = await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_MSG_STORE, 'readonly');
      const store = tx.objectStore(IDB_MSG_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(new Error('Read failed'));
    });

    const updated = existing.filter((m) => m.id !== messageId);
    if (updated.length === existing.length) return; // Not found

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_MSG_STORE, 'readwrite');
      const store = tx.objectStore(IDB_MSG_STORE);
      store.put(updated, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error('Write failed'));
    });
  } catch (err) {
    console.error('[E2EE Relay] IndexedDB remove error:', err);
  }
}

async function getAllConversationKeys(): Promise<string[]> {
  try {
    const db = await openMessagesDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_MSG_STORE, 'readonly');
      const store = tx.objectStore(IDB_MSG_STORE);
      const req = store.getAllKeys();
      req.onsuccess = () => resolve((req.result as string[]) || []);
      req.onerror = () => reject(new Error('Failed to get keys'));
    });
  } catch {
    return [];
  }
}

async function getAllMessages(currentUserId: string): Promise<LocalMessage[]> {
  try {
    const keys = await getAllConversationKeys();
    const myKeys = keys.filter((k) => k.includes(currentUserId));
    const all: LocalMessage[] = [];

    for (const key of myKeys) {
      const db = await openMessagesDB();
      const msgs: LocalMessage[] = await new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_MSG_STORE, 'readonly');
        const store = tx.objectStore(IDB_MSG_STORE);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(new Error('Read failed'));
      });
      all.push(...msgs);
    }

    return all.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  } catch {
    return [];
  }
}

export async function getGlobalUnreadCount(currentUserId: string): Promise<number> {
  const all = await getAllMessages(currentUserId);
  let count = 0;
  for (const m of all) {
     if (m.recipientId === currentUserId && !m.isRequest) {
        const partnerId = m.senderId;
        let lastViewed = 0;
        if (typeof window !== 'undefined') {
            lastViewed = parseInt(window.localStorage.getItem('lastViewed_' + partnerId) || '0', 10);
        }
        if (new Date(m.timestamp).getTime() > lastViewed) {
            count++;
        }
     }
  }
  return count;
}

// ============================================================================
// PUBLIC KEY CACHE
// ============================================================================

const publicKeyCache = new Map<string, CryptoKey>();

async function getRecipientPublicKey(recipientId: string): Promise<CryptoKey> {
  // Return from cache if available
  if (publicKeyCache.has(recipientId)) {
    return publicKeyCache.get(recipientId)!;
  }

  const res = await fetch(`/api/users/${recipientId}/public-key`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch recipient public key');
  }

  const { publicKey: publicKeyJWK } = await res.json();
  if (!publicKeyJWK) {
    throw new Error('Recipient has not set up encryption yet');
  }

  const cryptoKey = await importPublicKeyFromJWK(publicKeyJWK);
  publicKeyCache.set(recipientId, cryptoKey);
  return cryptoKey;
}

// ============================================================================
// HOOK: useE2EERelay
// ============================================================================

export function useE2EERelay({
  privateKey,
  currentUserId,
}: UseE2EERelayInput): UseE2EERelayResult {
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const mountedRef = useRef(true);

  const calculateUnreadCount = useCallback((userId: string, allMsgs: LocalMessage[]) => {
      let count = 0;
      for (const m of allMsgs) {
         if (m.recipientId === userId && !m.isRequest) {
            const partnerId = m.senderId;
            let lastViewed = 0;
            if (typeof window !== 'undefined') {
                lastViewed = parseInt(window.localStorage.getItem('lastViewed_' + partnerId) || '0', 10);
            }
            if (new Date(m.timestamp).getTime() > lastViewed) {
                count++;
            }
         }
      }
      return count;
  }, []);

  const markAsRead = useCallback((partnerId: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('lastViewed_' + partnerId, Date.now().toString());
    }
    setUnreadCount(calculateUnreadCount(currentUserId, messages));
  }, [currentUserId, messages, calculateUnreadCount]);

  // ── Load messages from IndexedDB on mount ──
  useEffect(() => {
    if (!currentUserId) return;

    async function loadFromIDB() {
      try {
        const all = await getAllMessages(currentUserId);
        if (mountedRef.current) {
          setMessages(all);
          setUnreadCount(calculateUnreadCount(currentUserId, all));
          setIsLoading(false);
        }
      } catch {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    }

    loadFromIDB();
  }, [currentUserId, calculateUnreadCount]);

  // ── Realtime Subscription & Initial Sync ──
  useEffect(() => {
    mountedRef.current = true;

    if (!privateKey || !currentUserId) return;

    const syncKey = `lastSyncTimestamp_${currentUserId}`;

    // 1. Initial Delta Sync (run once on mount)
    const initialSync = async () => {
      try {
        let sinceParam = '';
        if (typeof window !== 'undefined') {
          const lastSync = window.localStorage.getItem(syncKey);
          if (lastSync) {
            sinceParam = `?since=${encodeURIComponent(lastSync)}`;
          }
        }

        const res = await fetch(`/api/messages/relay${sinceParam}`);
        if (!res.ok) {
          if (res.status === 401) return;
          throw new Error('Failed to fetch relay messages');
        }

        const { messages: relayMessages }: { messages: RelayMessage[] } = await res.json();
        if (!relayMessages || relayMessages.length === 0) return;

        let newCount = 0;
        for (const relayMsg of relayMessages) {
          try {
            const decrypted = await decryptMessage(
              { ciphertext: relayMsg.ciphertext, iv: '', algorithm: 'RSA-OAEP' },
              privateKey
            );
            const localMsg: LocalMessage = {
              id: relayMsg.id,
              senderId: relayMsg.senderId,
              recipientId: relayMsg.recipientId,
              plaintext: decrypted.text,
              timestamp: relayMsg.createdAt,
              isRequest: relayMsg.isRequest,
            };
            await storeMessage(currentUserId, relayMsg.senderId, localMsg);
            newCount++;
          } catch (err) {
            console.error(`[E2EE Relay] Failed to decrypt message ${relayMsg.id}:`, err);
          }
        }

        if (relayMessages.length > 0 && typeof window !== 'undefined') {
          const newest = relayMessages[relayMessages.length - 1];
          window.localStorage.setItem(syncKey, newest.createdAt);
        }

        if (newCount > 0 && mountedRef.current) {
          const all = await getAllMessages(currentUserId);
          setMessages(all);
          setUnreadCount(calculateUnreadCount(currentUserId, all));
        }
      } catch (err) {
        if (mountedRef.current) {
          console.error('[E2EE Relay] Initial sync error:', err);
        }
      }
    };

    initialSync();

    // 2. Setup Appwrite Realtime Subscription
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'auroric-db';
    const colId = process.env.NEXT_PUBLIC_APPWRITE_MESSAGE_RELAY_COL_ID || 'message_relay';
    const channel = `databases.${dbId}.collections.${colId}.documents`;

    console.log('[E2EE Realtime] Subscribing to secure channel:', channel);

    const unsubscribe = client.subscribe(channel, async (response) => {
      if (response.events.some((e) => e.includes('.create'))) {
        const payload = response.payload as any;

        if (payload.recipientId === currentUserId) {
          try {
            const decrypted = await decryptMessage(
              { ciphertext: payload.ciphertext, iv: '', algorithm: 'RSA-OAEP' },
              privateKey
            );
            
            const localMsg: LocalMessage = {
              id: payload.$id,
              senderId: payload.senderId,
              recipientId: payload.recipientId,
              plaintext: decrypted.text,
              timestamp: payload.$createdAt,
              isRequest: payload.isRequest || false,
            };

            await storeMessage(currentUserId, payload.senderId, localMsg);

            if (typeof window !== 'undefined') {
              window.localStorage.setItem(syncKey, localMsg.timestamp);
            }

            if (mountedRef.current) {
              const all = await getAllMessages(currentUserId);
              setMessages(all);
              setUnreadCount(calculateUnreadCount(currentUserId, all));
            }
          } catch (err) {
            console.error(`[E2EE Relay] Realtime decrypt error for message ${payload.$id}:`, err);
          }
        }
      }
    });

    return () => {
      mountedRef.current = false;
      unsubscribe();
    };
  }, [privateKey, currentUserId]);

  // ── SEND ──
  const sendMessage = useCallback(
    async (recipientId: string, plaintext: string, isRequest = false): Promise<boolean> => {
      if (!currentUserId) {
        setError('Not logged in');
        return false;
      }

      const tempId = crypto.randomUUID();

      try {
        setError(null);

        // 1. Fetch recipient's public key
        const recipientPubKey = await getRecipientPublicKey(recipientId);

        // 2. Encrypt the plaintext
        const encrypted = await encryptMessage(plaintext, recipientPubKey);

        // 3. Optimistic State Update
        const optimisticMsg: LocalMessage = {
          id: tempId,
          senderId: currentUserId,
          recipientId,
          plaintext,
          timestamp: new Date().toISOString(),
          isRequest,
        };

        // Store optimistically in IndexedDB
        await storeMessage(currentUserId, recipientId, optimisticMsg);

        // Update React state instantly
        const all = await getAllMessages(currentUserId);
        if (mountedRef.current) {
          setMessages(all);
        }

        // 4. Background Network Request
        fetch('/api/messages/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientId,
            ciphertext: encrypted.ciphertext,
            isRequest,
          }),
        }).then(async (res) => {
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || 'Failed to send message');
          }
          // Optional: if the server returns a different messageId, you could update the IDB record
        }).catch(async (err) => {
          const message = err instanceof Error ? err.message : 'Failed to send message';
          console.error('[E2EE Relay] Background send error:', message);
          
          // Rollback: Remove the temp message
          await removeMessage(currentUserId, recipientId, tempId);
          const allMessages = await getAllMessages(currentUserId);
          if (mountedRef.current) {
            setMessages(allMessages);
            setError(message);
          }
        });

        return true;
      } catch (err) {
        // This catches encryption or public key fetching errors
        const message = err instanceof Error ? err.message : 'Failed to prepare message';
        console.error('[E2EE Relay] Prepare send error:', message);
        if (mountedRef.current) {
          setError(message);
        }
        return false;
      }
    },
    [currentUserId]
  );

  // ── UNSEND ──
  const unsendMessage = useCallback(
    async (messageId: string, recipientId: string): Promise<boolean> => {
      if (!currentUserId) return false;
      try {
        // Optimistic UI Update: Remove locally first
        await removeMessage(currentUserId, recipientId, messageId);
        const all = await getAllMessages(currentUserId);
        if (mountedRef.current) {
          setMessages(all);
        }
        
        // Background network request to delete from Appwrite
        fetch('/api/messages/unsend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageId }),
        }).catch(err => {
          console.error('[E2EE Relay] Background unsend error:', err);
        });
        
        return true;
      } catch (err) {
        console.error('[E2EE Relay] Prepare unsend error:', err);
        return false;
      }
    },
    [currentUserId]
  );

  return {
    sendMessage,
    unsendMessage,
    messages,
    isLoading,
    error,
    unreadCount,
    markAsRead,
  };
}
