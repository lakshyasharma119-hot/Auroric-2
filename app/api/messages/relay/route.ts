/**
 * GET /api/messages/relay
 * Fetch pending relay messages for the current user (as recipient).
 * Returns up to 50 messages ordered by createdAt ascending.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { databases, DB_ID, MESSAGE_RELAY_COL } from '@/lib/appwrite';
import { Query } from 'node-appwrite';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since');
    const offsetStr = searchParams.get('offset');
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;

    const queries = [
      Query.equal('recipientId', user.id),
      Query.orderAsc('createdAt'),
      Query.limit(50),
    ];

    if (since) {
      queries.push(Query.greaterThan('createdAt', since));
    }
    if (offset > 0) {
      queries.push(Query.offset(offset));
    }

    const { documents } = await databases.listDocuments(
      DB_ID,
      MESSAGE_RELAY_COL,
      queries
    );

    const messages = documents.map((doc) => ({
      id: doc.$id,
      senderId: doc.senderId,
      recipientId: doc.recipientId,
      ciphertext: doc.ciphertext,
      createdAt: doc.createdAt,
      isRequest: doc.isRequest ?? false,
    }));

    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error('[messages/relay GET] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
