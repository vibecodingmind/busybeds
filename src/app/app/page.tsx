import {
  getActiveSubscription,
  getCurrentUser,
  hasActiveMembership,
} from "@/lib/auth/session";
import { getMemberBookings } from "@/lib/hotels/queries";
import { getLoyaltyBalance } from "@/lib/loyalty/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function MemberDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const sub = await getActiveSubscription(user.id);
  const bookings = await getMemberBookings(user.id);
  const loyalty = await getLoyaltyBalance(user.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Welcome, {user.name ?? user.email}</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm">Membership</CardTitle></CardHeader>
          <CardContent>
            {sub && hasActiveMembership(sub) ? (
              <Badge className="bg-primary">{sub.plan.name} — {sub.status}</Badge>
            ) : (
              <span className="text-sm text-muted-foreground">No active membership</span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">BusyPoints</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{loyalty?.balance ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Bookings</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{bookings.length}</CardContent>
        </Card>
      </div>
    </div>
  );
}
