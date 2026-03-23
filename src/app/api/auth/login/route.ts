export const dynamic = 'force-dynamic';
import { rateLimit, getIp } from '@/lib/rateLimit';
import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { signToken } from '@/lib/auth';

const schema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[LOGIN ${requestId}] Starting login attempt`);
  
  try {
    // Log request body
    const rawBody = await req.text();
    console.log(`[LOGIN ${requestId}] Request body:`, rawBody);
    
    // Parse JSON after logging
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      console.error(`[LOGIN ${requestId}] JSON parse error:`, e);
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }

    // Validate required fields
    if (!body.email || !body.password) {
      console.error(`[LOGIN ${requestId}] Missing required fields`);
      return NextResponse.json({ 
        error: 'Email and password are required',
        missing: !body.email ? 'email' : 'password'
      }, { status: 400 });
    }

    // Rate limiting check
    const rl = rateLimit(`login:${getIp(req)}`, { limit: 10, windowSec: 900 });
    if (!rl.success) {
      console.log(`[LOGIN ${requestId}] Rate limit exceeded for IP:`, getIp(req));
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      );
    }

    // Schema validation
    try {
      schema.parse(body);
    } catch (err) {
      if (err instanceof z.ZodError) {
        console.error(`[LOGIN ${requestId}] Validation error:`, err.issues);
        return NextResponse.json({ 
          error: 'Validation failed',
          issues: err.issues.map(i => ({
            field: i.path.join('.'),
            message: i.message
          }))
        }, { status: 400 });
      }
      throw err;
    }

    // Database query
    console.log(`[LOGIN ${requestId}] Querying database for user:`, body.email);
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email: body.email },
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
      console.error(`[LOGIN ${requestId}] Database error:`, dbError);
      return NextResponse.json({
        error: 'Database connection error. Please try again.',
        code: 'DB_ERROR'
      }, { status: 503 });
    }

    // User not found
    if (!user) {
      console.log(`[LOGIN ${requestId}] User not found:`, body.email);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check account status
    if (user.suspendedAt) {
      console.log(`[LOGIN ${requestId}] Account suspended:`, body.email);
      return NextResponse.json({ error: 'Account suspended' }, { status: 403 });
    }

    // Verify password
    console.log(`[LOGIN ${requestId}] Verifying password`);
    const valid = await compare(body.password, user.passwordHash);
    if (!valid) {
      console.log(`[LOGIN ${requestId}] Invalid password for:`, body.email);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Generate JWT
    console.log(`[LOGIN ${requestId}] Generating JWT token`);
    let token;
    try {
      token = await signToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      });
    } catch (jwtError) {
      console.error(`[LOGIN ${requestId}] JWT signing error:`, jwtError);
      return NextResponse.json({
        error: 'Error generating authentication token',
        code: 'JWT_ERROR'
      }, { status: 500 });
    }

    // Create response
    console.log(`[LOGIN ${requestId}] Creating success response`);
    const res = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      }
    });

    // Set cookie
    res.cookies.set('bb_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Add security headers
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('X-Frame-Options', 'DENY');
    res.headers.set('X-XSS-Protection', '1; mode=block');

    console.log(`[LOGIN ${requestId}] Login successful for:`, body.email);
    return res;

  } catch (err) {
    console.error(`[LOGIN ${requestId}] Unhandled error:`, err);
    return NextResponse.json({
      error: 'An unexpected error occurred',
      code: `ERROR_${requestId}`
    }, { status: 500 });
  }
}