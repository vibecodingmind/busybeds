import type { HotelRole, PlatformRole } from "@prisma/client";
import type { Permission } from "@/lib/auth/permissions";
import {
  permissionsForHotelRole,
  permissionsForPlatformRole,
  hasPermission,
} from "@/lib/auth/permissions";

export interface OrgContext {
  orgType: "HOTEL" | "CORPORATE";
  orgId: string;
  hotelId?: string;
  role: string;
}

export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  platformRole: PlatformRole;
  contexts: OrgContext[];
}

export function permissionsForUser(user: SessionUser): Permission[] {
  const perms = new Set<Permission>(
    permissionsForPlatformRole(user.platformRole as PlatformRole),
  );

  for (const ctx of user.contexts) {
    if (ctx.orgType === "HOTEL" && ctx.role) {
      for (const p of permissionsForHotelRole(ctx.role as HotelRole)) {
        perms.add(p);
      }
    }
  }

  return [...perms];
}

export function authorize(user: SessionUser, permission: Permission): boolean {
  return hasPermission(permissionsForUser(user), permission);
}

export function getHotelContext(user: SessionUser, hotelId?: string) {
  const hotelContexts = user.contexts.filter((c) => c.orgType === "HOTEL");
  if (hotelId) {
    return hotelContexts.find((c) => c.hotelId === hotelId);
  }
  return hotelContexts[0];
}
