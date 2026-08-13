import { getAdminMetrics } from "@/lib/hotels/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const metrics = await getAdminMetrics();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Platform dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Members</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{metrics.members}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Approved hotels</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{metrics.hotels}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Total bookings</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{metrics.bookings}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Pending availability</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold text-amber-600">{metrics.pendingBookings}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Hotels to approve</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{metrics.pendingHotels}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Rates to approve</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{metrics.pendingRates}</CardContent>
        </Card>
      </div>
    </div>
  );
}
