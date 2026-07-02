'use client';

import { useState, useEffect, useRef } from 'react';
import {
  generateKeyPair,
  exportPublicKeyAsJWK,
  getStoredPrivateKey,
} from '@/lib/cryptoUtils';

interface UseE2EEInitializationResult {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  privateKey: CryptoKey | null;
  retry: () => void;
}

/**
 * Hook: useE2EEInitialization
 *
 * On mount:
 *   1. Calls GET /api/auth/initialize-encryption to check server status
 *   2. If NOT initialized → generates RSA-4096 key pair (private key stored
 *      in IndexedDB by cryptoUtils), exports public key as JWK, POSTs it
 *      to the server
 *   3. If already initialized → retrieves stored private key from IndexedDB
 *
 * Exposes: { isInitialized, isLoading, error, privateKey, retry }
 */
export function useE2EEInitialization(): UseE2EEInitializationResult {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null);

  // Prevent double-initialization in React StrictMode
  const initializingRef = useRef(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (initializingRef.current) return;
    initializingRef.current = true;

    let cancelled = false;

    async function initialize() {
      setIsLoading(true);
      setError(null);

      try {
        // Step 1: Check server-side encryption status
        const statusRes = await fetch('/api/auth/initialize-encryption');

        if (!statusRes.ok) {
          if (statusRes.status === 401) {
            // User not logged in — silently skip, not an error
            setIsLoading(false);
            return;
          }
          throw new Error('Failed to check encryption status');
        }

        const status = await statusRes.json();

        if (cancelled) return;

        if (status.initialized) {
          // Already initialized on server — retrieve private key from IndexedDB
          console.log('[E2EE] Encryption already initialized, loading private key...');
          const storedKey = await getStoredPrivateKey();

          if (cancelled) return;

          if (storedKey) {
            setPrivateKey(storedKey);
            setIsInitialized(true);
            console.log('[E2EE] Private key loaded from IndexedDB');
          } else {
            // Edge case: server says initialized but no local private key.
            // This can happen if IndexedDB was cleared or the bug where
            // onupgradeneeded was missing. Regenerate keys and re-upload.
            console.warn('[E2EE] Server has public key but no local private key — regenerating...');
            const keyPair = await generateKeyPair();

            if (cancelled) return;

            const publicKeyJWK = await exportPublicKeyAsJWK(keyPair.publicKey);

            const postRes = await fetch('/api/auth/initialize-encryption', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ publicKey: publicKeyJWK }),
            });

            if (!postRes.ok) {
              const errData = await postRes.json().catch(() => ({}));
              throw new Error(errData.error || 'Failed to re-upload public key');
            }

            if (cancelled) return;

            setPrivateKey(keyPair.privateKey);
            setIsInitialized(true);
            console.log('[E2EE] Keys regenerated and re-uploaded successfully');
          }
        } else {
          // Not initialized — generate keys
          console.log('[E2EE] Generating RSA-4096 key pair...');
          const keyPair = await generateKeyPair();

          if (cancelled) return;

          // Export public key as JWK string for server storage
          const publicKeyJWK = await exportPublicKeyAsJWK(keyPair.publicKey);

          // POST public key to server
          const postRes = await fetch('/api/auth/initialize-encryption', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicKey: publicKeyJWK }),
          });

          if (!postRes.ok) {
            const errData = await postRes.json().catch(() => ({}));
            throw new Error(errData.error || 'Failed to store public key');
          }

          if (cancelled) return;

          setPrivateKey(keyPair.privateKey);
          setIsInitialized(true);
          console.log('[E2EE] Encryption initialized successfully');
        }
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Encryption initialization failed';
        console.error('[E2EE] Initialization error:', message);
        setError(message);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          initializingRef.current = false;
        }
      }
    }

    initialize();

    return () => {
      cancelled = true;
      initializingRef.current = false;
    };
  }, [retryCount]);

  const retry = () => {
    setRetryCount(c => c + 1);
  };

  return { isInitialized, isLoading, error, privateKey, retry };
}
