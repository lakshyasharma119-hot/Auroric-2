import { NextRequest, NextResponse } from 'next/server';
import { trackAnalyticsEvent, AnalyticsActionType } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

/**
 * POST /api/analytics — Track client-side analytics events
 * Body: { pinId: string, ownerId: string, actionType: string }
 */
export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { pinId, ownerId, actionType } = body;

        if (!pinId || !ownerId || !actionType) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const validActions: AnalyticsActionType[] = ['view', 'like', 'download', 'share'];
        if (!validActions.includes(actionType as AnalyticsActionType)) {
            return NextResponse.json({ error: 'Invalid action type' }, { status: 400 });
        }

        // Track silently (trackAnalyticsEvent handles its own errors silently)
        await trackAnalyticsEvent(pinId, ownerId, actionType as AnalyticsActionType);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        // Even if there's a catastrophic error in the route, we swallow it to not break the client
        console.warn('[Analytics API] Failed to process tracking event:', error);
        return NextResponse.json({ success: false });
    }
}
