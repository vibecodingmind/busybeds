export const dynamic = 'force-dynamic';
import { rateLimit, getIp } from '@/lib/rateLimit';
import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { signToken } from '@/lib/auth';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  console.log('[LOGIN] Starting login attempt');
  
  try {
    // 10 attempts per IP per 15 minutes
    const rl = rateLimit(`login:${getIp(req)}`, { limit: 10, windowSec: 900 });
    if (!rl.success) {
      console.log('[LOGIN] Rate limit exceeded for IP:', getIp(req));
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      );
    }

    console.log('[LOGIN] Parsing request body');
    const body = await req.json();
    const data = schema.parse(body);
    
    console.log('[LOGIN] Finding user:', data.email);
    let user;
    try {
      user = await prisma.user.findUnique({ 
        where: { email: data.email },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          role: true,
          fullName: true,
          suspendedAt: true,
        }
      });
    } catch (dbError) {
      console.error('[LOGIN] Database error:', dbError);
      return NextResponse.json({
        error: 'Database connection error. Please try again.',
        code: 'DB_ERROR'
      }, { status: 503 });
    }

    if (!user) {
      console.log('[LOGIN] User not found:', data.email);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.suspendedAt) {
      console.log('[LOGIN] Account suspended:', data.email);
      return NextResponse.json({ error: 'Account suspended' }, { status: 403 });
    }

    console.log('[LOGIN] Validating password');
    const valid = await compare(data.password, user.passwordHash);
    if (!valid) {
      console.log('[LOGIN] Invalid password for:', data.email);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    console.log('[LOGIN] Generating token');
    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    });

    console.log('[LOGIN] Creating response');
    const res = NextResponse.json({
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        fullName: user.fullName 
      },
    });

    console.log('[LOGIN] Setting cookie');
    res.cookies.set('bb_token', token, { 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    console.log('[LOGIN] Success for:', data.email);
    
    // Add security headers
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('X-Frame-Options', 'DENY');
    res.headers.set('X-XSS-Protection', '1; mode=block');
    
    return res;
  } catch (err) {
    const errorId = Math.random().toString(36).substr(2, 9);
    
    if (err instanceof z.ZodError) {
      console.error(`[LOGIN ERROR ${errorId}] Validation error:`, err.issues);
      return NextResponse.json({ 
        error: 'Invalid input format',
        fields: err.issues.map(i => ({
          field: i.path.join('.'),
          message: i.message
        }))
      }, { status: 400 });
    }

    // Database connection errors
    if (err.code === 'P1001' || err.code === 'P1002') {
      console.error(`[LOGIN ERROR ${errorId}] Database connection error:`, err);
      return NextResponse.json({
        error: 'Service temporarily unavailable. Please try again later.',
        code: errorId
      }, { status: 503 });
    }

    // JWT signing errors
    if (err.name === 'JWTError') {
      console.error(`[LOGIN ERROR ${errorId}] JWT signing error:`, err);
      return NextResponse.json({
        error: 'Authentication service error. Please try again.',
        code: errorId
      }, { status: 500 });
    }

    // Generic error handler
    console.error(`[LOGIN ERROR ${errorId}] Unhandled error:`, err);
    return NextResponse.json({
      error: 'An unexpected error occurred. Please try again later.',
      code: errorId
    }, { status: 500 });
  }
    
    const errorId = Math.random().toString(36).substring(7);
    console.error(`[LOGIN ERROR] ${errorId}:`, err);
    
    return NextResponse.json({ 
      error: 'An unexpected error occurred. Please try again later.',
      code: errorId
    }, { status: 500 });
  }
}