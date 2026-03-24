export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { fileName, totalRows } = await req.json();
  const job = await prisma.bulkUploadJob.create({
    data: { uploadedBy: session.userId, fileName, totalRows, status: 'pending' },
  });

  return NextResponse.json({ job }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const jobs = await prisma.bulkUploadJob.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ jobs });
}
