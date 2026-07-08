import Link from "next/link";

import { listWorkflowRuns } from "@/lib/career-wiki/workflow/repository";

export const dynamic = "force-dynamic";

export default async function CareerWorkflowPage() {
  const workflows = await listWorkflowRuns();
  const current = workflows[0];

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <Link href="/career-wiki/profile" className="text-sm text-muted-foreground hover:text-foreground">
              Back to Career Wiki
            </Link>
            <h1 className="mt-2 text-2xl font-semibold">Career Workflow</h1>
            <p className="mt-1 text-sm text-muted-foreground">Local review state for JD, Project Fit, evidence, resume approval, and export.</p>
          </div>
          <Link href="/career-wiki/dashboard" className="rounded-md border border-line px-3 py-2 text-sm hover:bg-surface-low">
            Operation Dashboard
          </Link>
        </header>

        {current ? (
          <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
            <article className="rounded-lg border border-line bg-surface p-4">
              <h2 className="text-base font-semibold">{current.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">State: {current.currentState}</p>
              <p className="text-sm text-muted-foreground">Status: {current.status}</p>
              <p className="text-sm text-muted-foreground">Updated: {current.updatedAt}</p>
            </article>
            <article className="rounded-lg border border-line bg-surface p-4">
              <h2 className="text-base font-semibold">Checklist</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {current.checklist.map((item) => (
                  <li key={item.key} className="rounded-md border border-line bg-background p-3">
                    <span className={item.passed ? "text-green-600" : "text-red-600"}>{item.passed ? "PASS" : "BLOCK"}</span>
                    <span className="ml-2 font-medium">{item.label}</span>
                    {item.reason ? <p className="mt-1 text-muted-foreground">{item.reason}</p> : null}
                  </li>
                ))}
              </ul>
            </article>
          </section>
        ) : (
          <section className="rounded-lg border border-line bg-surface p-6">
            <h2 className="text-base font-semibold">No workflow run yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">Start one through `POST /api/career-wiki/workflows/start` after importing a JD.</p>
          </section>
        )}
      </div>
    </main>
  );
}
