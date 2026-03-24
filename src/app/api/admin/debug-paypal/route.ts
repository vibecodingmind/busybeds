export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const clientId = process.env.PAYPAL_CLIENT_ID || '';
  const secret = process.env.PAYPAL_CLIENT_SECRET || '';
  const mode = process.env.PAYPAL_MODE || 'sandbox';

  const base = mode === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  // Try to get token
  let tokenResult: any = null;
  let tokenError: string | null = null;
  try {
    const res = await fetch(`${base}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });
    const data = await res.json();
    if (res.ok) {
      tokenResult = { success: true, tokenType: data.token_type, appId: data.app_id };
    } else {
      tokenError = `${data.error}: ${data.error_description}`;
    }
  } catch (e: any) {
    tokenError = e.message;
  }

  return NextResponse.json({
    mode,
    base,
    clientIdSet: !!clientId,
    clientIdPrefix: clientId ? clientId.slice(0, 8) + '...' : '(not set)',
    secretSet: !!secret,
    secretPrefix: secret ? secret.slice(0, 4) + '...' : '(not set)',
    authResult: tokenResult || { success: false, error: tokenError },
  });
}
