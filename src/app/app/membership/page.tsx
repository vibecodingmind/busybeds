import { getCurrentUser, getActiveSubscription, hasActiveMembership } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";

export default async function MembershipPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const sub = await getActiveSubscription(user.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Membership</h1>
      <Card>
        <CardHeader>
          <CardTitle>Current plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sub && hasActiveMembership(sub) ? (
            <>
              <p className="font-medium">{sub.plan.name}</p>
              <p className="text-sm text-muted-foreground">
                Valid until {sub.currentPeriodEnd.toLocaleDateString()}
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">No active membership</p>
          )}
          <ButtonLink href="/plans">View plans</ButtonLink>
        </CardContent>
      </Card>
    </div>
  );
}
