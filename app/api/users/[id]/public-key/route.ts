/**
 * GET /api/users/[id]/public-key
 * Lightweight endpoint to fetch a user's public key for E2EE.
 * Auth required — only logged-in users can look up public keys.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { Client, Databases } from 'node-appwrite';
import { DB_ID, USERS_COL } from '@/lib/appwrite';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Use Admin SDK with APPWRITE_API_KEY as requested to bypass read constraints
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT || process.env.APPWRITE_PROJECT_ID || '')
      .setKey(process.env.APPWRITE_API_KEY || process.env.APPWRITE_KEY || '');
    
    const adminDatabases = new Databases(client);

    let doc;
    try {
      doc = await adminDatabases.getDocument(DB_ID, USERS_COL, id);
    } catch (err: any) {
      console.error('[users/public-key GET] Appwrite fetch error:', err.message);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      publicKey: doc.publicKey || null,
    });
  } catch (error: any) {
    console.error('[users/public-key GET] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
