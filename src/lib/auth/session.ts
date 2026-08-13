import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { SessionUser, OrgContext } from "@/lib/auth/authorize";
import type { PlatformRole } from "@prisma/client";

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const assignments = await prisma.userRoleAssignment.findMany({
    where: { userId: session.user.id },
    include: {
      organization: {
        include: { hotel: true },
      },
    },
  });

  const contexts: OrgContext[] = assignments
    .filter((a) => a.organization)
    .map((a) => {
      const org = a.organization!;
      if (org.type === "HOTEL" && org.hotel) {
        return {
          orgType: "HOTEL" as const,
          orgId: org.id,
          hotelId: org.hotel.id,
          role: a.hotelRole ?? "RECEPTION",
        };
      }
      return {
        orgType: "CORPORATE" as const,
        orgId: org.id,
        role: a.corporateRole ?? "ADMIN",
      };
    });

  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name,
    platformRole: (session.user.platformRole as PlatformRole) ?? "MEMBER",
    contexts,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (
    user.platformRole !== "BUSYBEDS_ADMIN" &&
    user.platformRole !== "SUPER_ADMIN"
  ) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export async function getActiveSubscription(userId: string) {
  return prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] },
    },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });
}

export function hasActiveMembership(
  sub: { status: string; currentPeriodEnd: Date } | null,
): boolean {
  if (!sub) return false;
  if (sub.status === "ACTIVE" || sub.status === "TRIALING") return true;
  if (sub.status === "PAST_DUE") {
    const graceEnd = new Date(sub.currentPeriodEnd);
    graceEnd.setDate(graceEnd.getDate() + 7);
    return graceEnd > new Date();
  }
  return false;
}
