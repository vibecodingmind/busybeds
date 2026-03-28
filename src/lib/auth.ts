import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

// Security: Fail fast in production if JWT_SECRET is not set
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL: JWT_SECRET environment variable is required in production');
    }
    // Dev fallback only
    console.warn('⚠️ Using default JWT secret for development. Set JWT_SECRET in production!');
    return new TextEncoder().encode('busybeds-dev-secret-change-in-production');
  }
  return new TextEncoder().encode(secret);
}

const SECRET = getJwtSecret();

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  fullName: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('bb_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getSessionFromRequest(req: NextRequest): Promise<JWTPayload | null> {
  const token = req.cookies.get('bb_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function requireRole(...roles: string[]) {
  return async (req: NextRequest) => {
    const session = await getSessionFromRequest(req);
    if (!session) return { error: 'Unauthorized', status: 401 };
    if (!roles.includes(session.role)) return { error: 'Forbidden', status: 403 };
    return { session };
  };
}
