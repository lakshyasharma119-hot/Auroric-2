import { NextResponse } from 'next/server';
import { searchPins, searchUsers, searchBoards } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const category = url.searchParams.get('category') || undefined;

    if (!query.trim()) {
      return NextResponse.json({ pins: [], users: [], boards: [] });
    }

    let [pins, users, boards] = await Promise.all([
      searchPins(query, category),
      searchUsers(query),
      searchBoards(query),
    ]);

    // ── Subscription tier priority sort ──
    const tierPriority: Record<string, number> = { yearly: 0, monthly: 1, free: 2 };
    users.sort((a, b) => {
      const pa = tierPriority[a.subscriptionTier ?? 'free'] ?? 2;
      const pb = tierPriority[b.subscriptionTier ?? 'free'] ?? 2;
      return pa - pb;
    });

    return NextResponse.json({ pins, users, boards });
  } catch {
    return NextResponse.json({ pins: [], users: [], boards: [] }, { status: 500 });
  }
}
