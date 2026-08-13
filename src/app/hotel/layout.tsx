import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";

const hotelNav = [
  { href: "/hotel", label: "Dashboard" },
  { href: "/hotel/profile", label: "Profile" },
  { href: "/hotel/rooms", label: "Rooms" },
  { href: "/hotel/rates", label: "Rates" },
  { href: "/hotel/bookings", label: "Bookings" },
  { href: "/hotel/verify", label: "Verify member" },
];

export default async function HotelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const hotelCtx = user?.contexts.find((c) => c.orgType === "HOTEL");
  if (!user || !hotelCtx) {
    redirect("/login");
  }

  return (
    <DashboardShell title="Hotel portal" nav={hotelNav}>
      {children}
    </DashboardShell>
  );
}
