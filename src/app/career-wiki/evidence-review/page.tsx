import Link from "next/link";

import { listEvidenceReviewItems } from "@/lib/career-wiki/evidence-review/repository";

export const dynamic = "force-dynamic";

export default async function EvidenceReviewPage() {
  const items = await listEvidenceReviewItems();
  const openHigh = items.filter((item) => item.status === "open" && item.severity === "high").length;

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <Link href="/career-wiki/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
              Back to Dashboard
            </Link>
            <h1 className="mt-2 text-2xl font-semibold">Evidence Quality Review</h1>
            <p className="mt-1 text-sm text-muted-foreground">Review weak, duplicate, draft, and insufficient evidence before resume approval.</p>
          </div>
          <div className="rounded-md border border-line px-3 py-2 text-sm">
            Open high severity: <span className={openHigh ? "text-red-600" : "text-green-600"}>{openHigh}</span>
          </div>
        </header>

        <section className="grid gap-3">
          {items.length ? items.map((item) => (
            <article key={item.id} className="rounded-lg border border-line bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold">{item.title}</h2>
                <span className="rounded-md border border-line px-2 py-1 text-xs">{item.severity} / {item.status}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{item.issueType} - {item.targetType} / {item.targetId}</p>
              <p className="mt-2 text-sm">{item.detail}</p>
              <p className="mt-2 text-sm text-muted-foreground">Action: {item.recommendedAction}</p>
            </article>
          )) : (
            <article className="rounded-lg border border-line bg-surface p-6">
              <h2 className="text-base font-semibold">No review items yet</h2>
              <p className="mt-2 text-sm text-muted-foreground">Run `POST /api/career-wiki/evidence-review/run` after Project Fit and evidence edits.</p>
            </article>
          )}
        </section>
      </div>
    </main>
  );
}
