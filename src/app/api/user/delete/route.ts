export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { confirmation } = await req.json();
  if (confirmation !== 'DELETE MY ACCOUNT') {
    return NextResponse.json({ error: 'Please type DELETE MY ACCOUNT to confirm' }, { status: 400 });
  }

  try {
    await prisma.user.delete({ where: { id: session.userId } });
    const response = NextResponse.json({ ok: true, message: 'Account deleted successfully' });
    response.cookies.delete('bb_token');
    return response;
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
