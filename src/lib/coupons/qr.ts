import { createHmac, randomBytes } from "crypto";
import QRCode from "qrcode";

const QR_SECRET = process.env.AUTH_SECRET ?? "dev-secret";

export function signBookingToken(bookingId: string, couponCode: string): string {
  return createHmac("sha256", QR_SECRET)
    .update(`${bookingId}:${couponCode}`)
    .digest("hex")
    .slice(0, 32);
}

export function hashQrToken(token: string): string {
  return createHmac("sha256", QR_SECRET).update(token).digest("hex");
}

export async function generateQrDataUrl(payload: {
  bookingId: string;
  couponCode: string;
}): Promise<{ token: string; dataUrl: string; hash: string }> {
  const token = signBookingToken(payload.bookingId, payload.couponCode);
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/v/${token}`;
  const dataUrl = await QRCode.toDataURL(verifyUrl, {
    margin: 2,
    width: 280,
  });
  return { token, dataUrl, hash: hashQrToken(token) };
}

export function generateVerificationToken(): string {
  return randomBytes(32).toString("hex");
}
