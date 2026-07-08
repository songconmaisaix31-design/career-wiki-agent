import Link from "next/link";

import { getCareerWikiDashboard } from "@/lib/career-wiki/dashboard";

export const dynamic = "force-dynamic";

export default async function CareerWikiDashboardPage() {
  const dashboard = await getCareerWikiDashboard();
  const countCards = [
    ["Projects", dashboard.counts.projects],
    ["Skills", dashboard.counts.skills],
    ["JD Tests", dashboard.counts.jdTests],
    ["Project Fit", dashboard.counts.fitResults],
    ["Evidence", dashboard.counts.evidenceItems],
    ["Resume Versions", dashboard.counts.resumeVersions],
    ["Approved", dashboard.counts.approvedVersions],
    ["Exported", dashboard.counts.exportedVersions],
  ];

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <Link href="/career-wiki/profile" className="text-sm text-muted-foreground hover:text-foreground">
              Back to Career Wiki
            </Link>
            <h1 className="mt-2 text-2xl font-semibold">Career Wiki Operation Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">Production-quality status for local workflow, evidence, exports, audit, and health.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <Link className="rounded-md border border-line px-3 py-2 hover:bg-surface-low" href="/career-wiki/workflow">Workflow</Link>
            <Link className="rounded-md border border-line px-3 py-2 hover:bg-surface-low" href="/career-wiki/evidence-review">Evidence Review</Link>
            <Link className="rounded-md border border-line px-3 py-2 hover:bg-surface-low" href="/career-wiki/audit">Audit</Link>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {countCards.map(([label, value]) => (
            <article key={label} className="rounded-lg border border-line bg-surface p-4">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-2 text-2xl font-semibold">{value}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-lg border border-line bg-surface p-4">
            <h2 className="text-base font-semibold">Workflow</h2>
            {dashboard.workflow ? (
              <div className="mt-3 text-sm text-muted-foreground">
                <p>{dashboard.workflow.name}</p>
                <p>State: {dashboard.workflow.currentState}</p>
                <p>Status: {dashboard.workflow.status}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No workflow run yet.</p>
            )}
          </article>

          <article className="rounded-lg border border-line bg-surface p-4">
            <h2 className="text-base font-semibold">Evidence Review</h2>
            <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <span>High: {dashboard.evidenceReview.openHigh}</span>
              <span>Medium: {dashboard.evidenceReview.openMedium}</span>
              <span>Low: {dashboard.evidenceReview.openLow}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Open high-severity items block approval.</p>
          </article>

          <article className="rounded-lg border border-line bg-surface p-4">
            <h2 className="text-base font-semibold">Health</h2>
            <p className={`mt-3 text-sm ${dashboard.health.status === "pass" ? "text-green-600" : dashboard.health.status === "warn" ? "text-yellow-600" : "text-red-600"}`}>
              {dashboard.health.status.toUpperCase()}
            </p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {dashboard.health.checks.slice(0, 4).map((check) => (
                <li key={check.key}>{check.status.toUpperCase()} - {check.label}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className="rounded-lg border border-line bg-surface p-4">
          <h2 className="text-base font-semibold">Recent Audit Logs</h2>
          <div className="mt-3 grid gap-2">
            {dashboard.auditLogs.length ? dashboard.auditLogs.map((log) => (
              <div key={log.id} className="rounded-md border border-line bg-background p-3 text-sm">
                <span className="font-medium">{log.action}</span>
                <span className="ml-2 text-muted-foreground">{log.summary}</span>
              </div>
            )) : <p className="text-sm text-muted-foreground">No audit logs yet.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
