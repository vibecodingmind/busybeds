import { DashboardShell } from "@/components/layout/dashboard-shell";

export const dynamic = "force-dynamic";

const memberNav = [
  { href: "/app", label: "Dashboard" },
  { href: "/hotels", label: "Search hotels" },
  { href: "/app/wallet", label: "Coupon wallet" },
  { href: "/app/membership", label: "Membership" },
  { href: "/plans", label: "Upgrade plan" },
];

export default function MemberAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell title="Member portal" nav={memberNav}>
      {children}
    </DashboardShell>
  );
}
