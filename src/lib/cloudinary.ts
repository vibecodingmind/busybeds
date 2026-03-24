/**
 * Cloudinary upload helper — uses REST API directly, no SDK needed.
 * Docs: https://cloudinary.com/documentation/image_upload_api_reference
 */

export const hasCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

/**
 * Upload a file buffer to Cloudinary and return the secure URL.
 * @param buffer  - file bytes
 * @param folder  - Cloudinary folder (e.g. 'hotels', 'avatars')
 * @param publicId - optional custom public ID
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder = 'busybeds',
  publicId?: string
): Promise<{ url: string; publicId: string }> {
  if (!hasCloudinary) {
    throw new Error('Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your environment.');
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;

  // Build signature
  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign: Record<string, string | number> = { folder, timestamp };
  if (publicId) paramsToSign.public_id = publicId;

  // Sort params and build string to sign
  const signatureString =
    Object.keys(paramsToSign)
      .sort()
      .map(k => `${k}=${paramsToSign[k]}`)
      .join('&') + apiSecret;

  // SHA-1 hash using Web Crypto
  const msgBuffer = new TextEncoder().encode(signatureString);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
  const signature = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Build form data
  const form = new FormData();
  const blob = new Blob([new Uint8Array(buffer)]);
  form.append('file', blob, 'upload');
  form.append('api_key', apiKey);
  form.append('timestamp', String(timestamp));
  form.append('folder', folder);
  form.append('signature', signature);
  if (publicId) form.append('public_id', publicId);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: form }
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Cloudinary upload failed: ${data.error?.message || JSON.stringify(data)}`);
  }

  return { url: data.secure_url, publicId: data.public_id };
}

/**
 * Delete an image from Cloudinary by public ID.
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  if (!hasCloudinary) return;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;

  const timestamp = Math.floor(Date.now() / 1000);
  const signatureString = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;

  const msgBuffer = new TextEncoder().encode(signatureString);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
  const signature = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  const form = new FormData();
  form.append('public_id', publicId);
  form.append('api_key', apiKey);
  form.append('timestamp', String(timestamp));
  form.append('signature', signature);

  await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
    method: 'POST',
    body: form,
  });
}
