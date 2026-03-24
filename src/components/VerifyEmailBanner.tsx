import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import ResendVerificationBtn from './ResendVerificationBtn';

export default async function VerifyEmailBanner() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { emailVerified: true },
  });

  if (!user || user.emailVerified) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 z-30">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-amber-800">
          <span className="font-semibold">⚠️ Verify your email</span>
          {' '}— Check your inbox and click the link to unlock all features.
        </p>
        <ResendVerificationBtn />
      </div>
    </div>
  );
}
