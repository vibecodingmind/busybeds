export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { uploadToCloudinary, hasCloudinary } from '@/lib/cloudinary';

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * POST /api/upload
 * Accepts a multipart form with a single "file" field.
 * Returns { url, publicId }
 *
 * Query params:
 *   folder=hotels|avatars|covers  (default: 'busybeds')
 */
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!hasCloudinary) {
    return NextResponse.json(
      { error: 'Image upload is not configured. Add Cloudinary environment variables.' },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Only JPEG, PNG, WebP and GIF images are allowed' },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: 'File too large. Maximum size is 5 MB.' },
      { status: 400 }
    );
  }

  const folder = (req.nextUrl.searchParams.get('folder') || 'busybeds').replace(/[^a-zA-Z0-9_-]/g, '');

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const { url, publicId } = await uploadToCloudinary(buffer, folder);
    return NextResponse.json({ url, publicId });
  } catch (err: any) {
    console.error('[Upload Error]', err);
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
  }
}
