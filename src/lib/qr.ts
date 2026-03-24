import QRCode from 'qrcode';
import { randomBytes } from 'crypto';

export function generateCouponCode(): string {
  // 10-character uppercase alphanumeric code (A-Z, 0-9, excluding ambiguous chars O/0/I/1)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const bytes = randomBytes(10);
  for (let i = 0; i < 10; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

export async function generateQRDataUrl(code: string, appUrl: string): Promise<string> {
  const verifyUrl = `${appUrl}/portal?scan=${code}`;
  return QRCode.toDataURL(verifyUrl, {
    width: 300,
    margin: 2,
    color: { dark: '#1A3C5E', light: '#FFFFFF' },
  });
}
