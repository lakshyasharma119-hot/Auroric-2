/**
 * ============================================================================
 * API ROUTE: Initialize E2EE for User (Appwrite)
 * GET  /api/auth/initialize-encryption — check encryption status
 * POST /api/auth/initialize-encryption — store public key
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { databases, DB_ID, USERS_COL } from '@/lib/appwrite';

/**
 * GET /api/auth/initialize-encryption
 * Check if the current user's encryption keys are initialized.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Read the user document directly from Appwrite
    const doc = await databases.getDocument(DB_ID, USERS_COL, user.id);

    const initialized = doc.encryptionInitialized === true;

    return NextResponse.json({
      initialized,
      publicKey: initialized ? doc.publicKey ?? null : null,
    });
  } catch (error) {
    console.error('[E2EE] Error checking encryption status:', error);
    return NextResponse.json(
      { error: 'Failed to check encryption status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/initialize-encryption
 * Accept a JWK public key string, store it on the user document,
 * and mark encryptionInitialized = true.
 *
 * Body: { publicKey: string }  (JSON-stringified JWK)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { publicKey } = body;

    if (!publicKey || typeof publicKey !== 'string') {
      return NextResponse.json(
        { error: 'publicKey is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate JWK format — must be parseable JSON with kty: "RSA"
    try {
      const jwk = JSON.parse(publicKey);
      if (!jwk.kty || jwk.kty !== 'RSA') {
        throw new Error('Not an RSA JWK');
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid public key format. Expected JSON-stringified RSA JWK.' },
        { status: 400 }
      );
    }

    // Store public key and mark encryption as initialized
    await databases.updateDocument(DB_ID, USERS_COL, user.id, {
      publicKey,
      encryptionInitialized: true,
    });

    console.log(`[E2EE] Public key stored for user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: 'Encryption initialized successfully',
    });
  } catch (error) {
    console.error('[E2EE] Error storing public key:', error);
    return NextResponse.json(
      { error: 'Failed to initialize encryption' },
      { status: 500 }
    );
  }
}
