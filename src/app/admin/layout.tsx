import { DashboardShell } from "@/components/layout/dashboard-shell";

export const dynamic = "force-dynamic";

const adminNav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/bookings", label: "Availability queue" },
  { href: "/admin/hotels", label: "Hotels" },
  { href: "/admin/rates", label: "Rates" },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/audit", label: "Audit log" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell title="Platform Admin" nav={adminNav}>
      {children}
    </DashboardShell>
  );
}
