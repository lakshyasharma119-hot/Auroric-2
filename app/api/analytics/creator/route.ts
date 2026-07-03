import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getCreatorAnalytics } from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await getCreatorAnalytics(user.id);
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[Creator Analytics API] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
