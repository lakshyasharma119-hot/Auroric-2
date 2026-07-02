/**
 * POST /api/messages/send
 * Insert an encrypted message into the message_relay collection.
 *
 * Body: { recipientId: string, ciphertext: string, isRequest: boolean }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { databases, DB_ID, USERS_COL, MESSAGE_RELAY_COL } from '@/lib/appwrite';
import { ID } from 'node-appwrite';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { recipientId, ciphertext, isRequest } = body;

    // Validate ciphertext
    if (!ciphertext || typeof ciphertext !== 'string' || !ciphertext.trim()) {
      return NextResponse.json(
        { error: 'ciphertext is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (!recipientId || typeof recipientId !== 'string') {
      return NextResponse.json(
        { error: 'recipientId is required' },
        { status: 400 }
      );
    }

    if (recipientId === user.id) {
      return NextResponse.json(
        { error: 'Cannot send a message to yourself' },
        { status: 400 }
      );
    }

    // Validate recipient exists and has encryption set up
    let recipientDoc;
    try {
      recipientDoc = await databases.getDocument(DB_ID, USERS_COL, recipientId);
    } catch {
      return NextResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      );
    }

    if (!recipientDoc.publicKey) {
      return NextResponse.json(
        { error: 'Recipient has not set up encryption yet' },
        { status: 400 }
      );
    }

    // Insert into message_relay
    const doc = await databases.createDocument(
      DB_ID,
      MESSAGE_RELAY_COL,
      ID.unique(),
      {
        senderId: user.id,
        recipientId,
        ciphertext,
        createdAt: new Date().toISOString(),
        isRequest: isRequest ?? false,
      }
    );

    return NextResponse.json({ success: true, messageId: doc.$id });
  } catch (error: any) {
    console.error('[messages/send POST] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
