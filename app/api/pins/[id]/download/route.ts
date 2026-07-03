import { NextRequest, NextResponse } from 'next/server';
import { ImageFormat } from 'node-appwrite';
import { getCurrentUser } from '@/lib/auth';
import { getUserFull, trackAnalyticsEvent } from '@/lib/db';
import { storage, BUCKET_ID, databases, DB_ID, PINS_COL } from '@/lib/appwrite';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: pinId } = await params;
        
        // Parse quality param
        const url = new URL(req.url);
        const quality = url.searchParams.get('quality') || 'standard';
        
        const authUser = await getCurrentUser();
        if (!authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await getUserFull(authUser.id);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const doc = await databases.getDocument(DB_ID, PINS_COL, pinId);
        const imageUrl = doc.imageUrl;
        const authorId = doc.authorId;
        const title = doc.title || 'auroric-pin';

        // Track silently
        await trackAnalyticsEvent(pinId, authorId, 'download');

        // Extract fileId
        const match = imageUrl.match(/\/files\/([^/]+)\//);
        const fileId = match ? match[1] : null;

        if (!fileId) {
            // Fallback for external URLs or broken formats
            const response = await fetch(imageUrl);
            const arrayBuffer = await response.arrayBuffer();
            return new NextResponse(arrayBuffer, {
                headers: {
                    'Content-Disposition': `attachment; filename="${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png"`,
                    'Content-Type': 'image/png',
                }
            });
        }

        const isPremium = user.subscriptionTier === 'monthly' || user.subscriptionTier === 'yearly';
        
        // Security Check
        if ((quality === 'hd' || quality === 'fullhd') && !isPremium) {
            return NextResponse.json({ error: 'Premium required for HD downloads' }, { status: 403 });
        }

        let arrayBuffer: ArrayBuffer;
        let finalQuality = 'standard';
        
        if (quality === 'fullhd' && isPremium) {
            // Original uncompressed
            arrayBuffer = await storage.getFileDownload(BUCKET_ID, fileId);
            finalQuality = 'fullhd';
        } else if (quality === 'hd' && isPremium) {
            // HD: width 1920, quality 90
            arrayBuffer = await storage.getFilePreview(BUCKET_ID, fileId, 1920, 0, undefined, 90, undefined, undefined, undefined, undefined, undefined, undefined, ImageFormat.Png);
            finalQuality = 'hd';
        } else {
            // Compressed: width 800, quality 70 (standard)
            arrayBuffer = await storage.getFilePreview(BUCKET_ID, fileId, 800, 0, undefined, 70, undefined, undefined, undefined, undefined, undefined, undefined, ImageFormat.Png);
        }

        return new NextResponse(arrayBuffer, {
            headers: {
                'Content-Disposition': `attachment; filename="${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${finalQuality}.png"`,
                'Content-Type': 'image/png',
            }
        });

    } catch (error: any) {
        console.error('[Download API] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
