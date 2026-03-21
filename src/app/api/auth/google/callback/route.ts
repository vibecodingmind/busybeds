export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import prisma from '@/lib/prisma';

async function getGoogleUser(code: string, redirectUri: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  const tokens = await tokenRes.json();
  if (!tokens.access_token) throw new Error('No access token');

  // Get user info
  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  return userRes.json();
}

export async function GET(req: Request) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(`${base}/login?error=google_cancelled`);
  }

  try {
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${base}/api/auth/google/callback`;
    const googleUser = await getGoogleUser(code, redirectUri);

    if (!googleUser.email) {
      return NextResponse.redirect(`${base}/login?error=google_no_email`);
    }

    // Find or create user
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId: googleUser.id }, { email: googleUser.email }] },
    });

    if (!user) {
      // New user — create as traveler
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          fullName: googleUser.name || googleUser.email.split('@')[0],
          passwordHash: '', // no password for OAuth users
          role: 'traveler',
          googleId: googleUser.id,
          emailVerified: true, // Google emails are pre-verified
        },
      });
    } else if (!user.googleId) {
      // Existing email user — link Google account
      await prisma.user.update({
        where: { id: user.id },
        data: { googleId: googleUser.id, emailVerified: true },
      });
    }

    // Create JWT (same as regular login)
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'busybeds-dev-secret-change-in-production');
    const token = await new SignJWT({ userId: user.id, email: user.email, role: user.role, fullName: user.fullName })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret);

    // Check if new traveler user needs subscription
    const isNewTraveler = user.role === 'traveler';
    let redirectPath = '/dashboard';
    
    if (isNewTraveler) {
      const sub = await prisma.subscription.findFirst({
        where: { userId: user.id, status: 'active' },
      });
      if (!sub) redirectPath = '/subscribe';
    }

    const response = NextResponse.redirect(`${base}${redirectPath}`);
    response.cookies.set('bb_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return response;
  } catch (err) {
    console.error('Google OAuth error:', err);
    return NextResponse.redirect(`${base}/login?error=google_failed`);
  }
}
