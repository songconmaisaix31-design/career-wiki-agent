import Link from "next/link";

import { listAuditLogs } from "@/lib/career-wiki/audit/audit-log";

export const dynamic = "force-dynamic";

export default async function CareerAuditPage() {
  const auditLogs = await listAuditLogs(100);

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <Link href="/career-wiki/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
              Back to Dashboard
            </Link>
            <h1 className="mt-2 text-2xl font-semibold">Career Audit Log</h1>
            <p className="mt-1 text-sm text-muted-foreground">Critical local workflow actions with sanitized before / after context.</p>
          </div>
        </header>

        <section className="grid gap-3">
          {auditLogs.length ? auditLogs.map((log) => (
            <article key={log.id} className="rounded-lg border border-line bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold">{log.action}</h2>
                <span className="text-xs text-muted-foreground">{log.createdAt}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{log.entityType} / {log.entityId}</p>
              <p className="mt-2 text-sm">{log.summary}</p>
            </article>
          )) : (
            <article className="rounded-lg border border-line bg-surface p-6">
              <h2 className="text-base font-semibold">No audit logs yet</h2>
              <p className="mt-2 text-sm text-muted-foreground">Logs will appear after evidence edits, Project Fit runs, resume approvals, and exports.</p>
            </article>
          )}
        </section>
      </div>
    </main>
  );
}
