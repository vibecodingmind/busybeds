import { prisma } from "@/lib/db";

export default async function AdminAuditPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { actor: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Audit log</h1>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-2 text-left">Time</th>
              <th className="p-2 text-left">Action</th>
              <th className="p-2 text-left">Resource</th>
              <th className="p-2 text-left">Actor</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t">
                <td className="p-2">{log.createdAt.toISOString()}</td>
                <td className="p-2">{log.action}</td>
                <td className="p-2">{log.resource}</td>
                <td className="p-2">{log.actor?.email ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
