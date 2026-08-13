import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Admin",
};

export default function AdminDashboardPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-2xl font-bold text-primary">BusyBeds Admin</h1>
      <p className="mt-2 text-muted-foreground">
        Operations queue: confirm hotel availability and approve rates.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Availability queue</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Booking requests in <code>PENDING_AVAILABILITY</code> — call hotels,
            then confirm to issue QR + 3-hour deposit window.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Rate approvals</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Discounts above 25% require explicit admin approval before publish.
          </CardContent>
        </Card>
      </div>
      <ButtonLink href="/" className="mt-8" variant="outline">
        Back to home
      </ButtonLink>
    </div>
  );
}
