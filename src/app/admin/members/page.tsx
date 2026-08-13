import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminMembersPage() {
  const users = await prisma.user.findMany({
    where: { platformRole: "MEMBER" },
    include: {
      subscriptions: {
        include: { plan: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Members</h1>
      <div className="space-y-2">
        {users.map((u) => {
          const sub = u.subscriptions[0];
          return (
            <Card key={u.id}>
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium">{u.email}</CardTitle>
                <CardContent className="p-0 pt-2">
                  {sub ? (
                    <Badge>{sub.plan.name} — {sub.status}</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">No subscription</span>
                  )}
                </CardContent>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
