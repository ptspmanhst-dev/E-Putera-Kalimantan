import { AuditLogsClient } from '@/components/audit/audit-logs-client';
import { fetchAuditLogs } from '@/lib/worker';

export const dynamic = 'force-dynamic';

export default async function AuditLogsPage() {
  const initialLogs = await fetchAuditLogs();

  return (
    <div className="space-y-8 p-8 lg:p-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1a1c21]">Audit Logs & Activity</h1>
        <p className="mt-2 text-sm text-[#7c8b9a]">
          Track recent administrative actions, login events, and identify potential session bottlenecks across the portal.
        </p>
      </div>

      <AuditLogsClient initialLogs={initialLogs} />
    </div>
  );
}
