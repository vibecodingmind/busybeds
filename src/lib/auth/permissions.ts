export type Permission =
  | "membership:subscribe"
  | "hotel:search"
  | "rate:view_member"
  | "booking:create"
  | "booking:view_own"
  | "coupon:verify"
  | "coupon:redeem"
  | "hotel:profile:view"
  | "hotel:profile:edit"
  | "hotel:rooms:manage"
  | "hotel:rates:view"
  | "hotel:rates:create"
  | "hotel:rates:submit"
  | "hotel:benefits:manage"
  | "hotel:staff:manage"
  | "hotel:reports:view"
  | "hotel:analytics:view"
  | "booking:confirm_availability"
  | "booking:confirm_deposit"
  | "platform:hotels:approve"
  | "platform:rates:approve"
  | "platform:members:manage"
  | "platform:disputes:manage"
  | "platform:analytics:view"
  | "platform:admins:manage"
  | "platform:integrations:manage"
  | "platform:security:configure"
  | "corporate:seats:manage"
  | "corporate:employees:invite"
  | "corporate:usage:view"
  | "corporate:billing:view"
  | "audit:view";

export type HotelRoleName = "RECEPTION" | "MANAGER" | "OWNER";
export type PlatformRoleName = "MEMBER" | "BUSYBEDS_ADMIN" | "SUPER_ADMIN";

const HOTEL_ROLE_PERMISSIONS: Record<HotelRoleName, Permission[]> = {
  RECEPTION: [
    "coupon:verify",
    "coupon:redeem",
    "hotel:profile:view",
    "booking:confirm_deposit",
  ],
  MANAGER: [
    "coupon:verify",
    "coupon:redeem",
    "hotel:profile:view",
    "hotel:profile:edit",
    "hotel:rooms:manage",
    "hotel:rates:view",
    "hotel:rates:create",
    "hotel:rates:submit",
    "hotel:benefits:manage",
    "hotel:reports:view",
    "hotel:analytics:view",
    "booking:confirm_deposit",
  ],
  OWNER: [
    "coupon:verify",
    "coupon:redeem",
    "hotel:profile:view",
    "hotel:profile:edit",
    "hotel:rooms:manage",
    "hotel:rates:view",
    "hotel:rates:create",
    "hotel:rates:submit",
    "hotel:benefits:manage",
    "hotel:staff:manage",
    "hotel:reports:view",
    "hotel:analytics:view",
    "booking:confirm_availability",
    "booking:confirm_deposit",
  ],
};

const PLATFORM_ROLE_PERMISSIONS: Record<PlatformRoleName, Permission[]> = {
  MEMBER: [
    "membership:subscribe",
    "hotel:search",
    "rate:view_member",
    "booking:create",
    "booking:view_own",
  ],
  BUSYBEDS_ADMIN: [
    "hotel:search",
    "rate:view_member",
    "coupon:verify",
    "coupon:redeem",
    "platform:hotels:approve",
    "platform:rates:approve",
    "platform:members:manage",
    "platform:disputes:manage",
    "platform:analytics:view",
    "booking:confirm_availability",
    "booking:confirm_deposit",
    "audit:view",
  ],
  SUPER_ADMIN: [
    "membership:subscribe",
    "hotel:search",
    "rate:view_member",
    "booking:create",
    "booking:view_own",
    "coupon:verify",
    "coupon:redeem",
    "platform:hotels:approve",
    "platform:rates:approve",
    "platform:members:manage",
    "platform:disputes:manage",
    "platform:analytics:view",
    "platform:admins:manage",
    "platform:integrations:manage",
    "platform:security:configure",
    "booking:confirm_availability",
    "booking:confirm_deposit",
    "audit:view",
  ],
};

export function permissionsForPlatformRole(role: PlatformRoleName): Permission[] {
  return PLATFORM_ROLE_PERMISSIONS[role] ?? [];
}

export function permissionsForHotelRole(role: HotelRoleName): Permission[] {
  return HOTEL_ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(
  permissions: Permission[],
  required: Permission,
): boolean {
  return permissions.includes(required);
}
