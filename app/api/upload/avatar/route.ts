import { NextResponse } from 'next/server';
import { ID } from 'node-appwrite';
import { storage, BUCKET_ID } from '@/lib/appwrite';
import { getCurrentUser } from '@/lib/auth';
import { updateUser, getUserFull } from '@/lib/db';

export async function POST(request: Request) {
  try {
    // ── Authentication ──
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in.' },
        { status: 401 }
      );
    }

    // ── Parse form data ──
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: 'Invalid request format. Expected multipart form data.' },
        { status: 400 }
      );
    }

    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided. Please select an image to upload.' },
        { status: 400 }
      );
    }

    // ── Server-side validation: file type ──
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file format "${file.type}". Allowed: JPEG, PNG, WebP.` },
        { status: 400 }
      );
    }

    // ── Server-side validation: file size (10MB) ──
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 10MB.` },
        { status: 400 }
      );
    }

    // ── Delete old avatar file from storage (if it exists in our bucket) ──
    try {
      const currentFullUser = await getUserFull(authUser.id);
      if (currentFullUser?.avatar) {
        // Extract file ID from the Appwrite URL
        const oldUrl = currentFullUser.avatar;
        const fileIdMatch = oldUrl.match(/\/files\/([^/]+)\//);
        if (fileIdMatch?.[1]) {
          try {
            await storage.deleteFile(BUCKET_ID, fileIdMatch[1]);
          } catch {
            // Old file may already be deleted or from external source — ignore
          }
        }
      }
    } catch {
      // Non-critical — continue with upload
    }

    // ── Upload to Appwrite Storage ──
    const fileId = ID.unique();
    let uploaded;
    try {
      uploaded = await storage.createFile(BUCKET_ID, fileId, file);
    } catch (uploadErr: any) {
      console.error('Appwrite storage upload failed:', uploadErr.message);
      return NextResponse.json(
        { error: 'Storage upload failed. Please try again later.' },
        { status: 500 }
      );
    }

    // ── Build public URL ──
    const endpoint = process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
    const projectId = process.env.APPWRITE_PROJECT_ID || '';
    const url = `${endpoint}/storage/buckets/${BUCKET_ID}/files/${uploaded.$id}/view?project=${projectId}`;

    // ── Update user record in database ──
    try {
      await updateUser(authUser.id, { avatar: url });
    } catch (dbErr: any) {
      console.error('Database update failed:', dbErr.message);
      // Still return the URL — the image was uploaded successfully
      return NextResponse.json(
        { url, warning: 'Image uploaded but profile update failed. Please try updating your profile again.' },
        { status: 200 }
      );
    }

    return NextResponse.json({ url });
  } catch (err: any) {
    console.error('Avatar upload error:', err.message);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
