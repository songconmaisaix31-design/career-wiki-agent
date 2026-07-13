"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { ArrowRight, Check, FileCheck2, LoaderCircle, WandSparkles } from "lucide-react";

import { CareerWikiAppShell } from "@/components/career-wiki/app-shell";
import { Button } from "@/components/ui/button";
import { runOneClickCareerFlow, type OneClickFlowResult } from "@/lib/career-wiki/one-click-flow";
import { getBaselineQualityIssues } from "@/lib/career-wiki/resume-tailor";
import type { ResumeTailorHarnessData } from "@/lib/career-wiki/types";
import { cn } from "@/lib/utils";

type JdMode = "existing" | "manual";

export function OneClickCareerWorkspace({ initialData }: { initialData: ResumeTailorHarnessData }) {
  const usableBaselines = useMemo(
    () => initialData.baselines.filter((baseline) => getBaselineQualityIssues(baseline).length === 0),
    [initialData.baselines],
  );
  const [baselineId, setBaselineId] = useState(usableBaselines[0]?.id ?? "");
  const [jdMode, setJdMode] = useState<JdMode>(initialData.jdTests.length ? "existing" : "manual");
  const [jdTestId, setJdTestId] = useState(initialData.jdTests[0]?.id ?? "");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [jdText, setJdText] = useState("");
  const [result, setResult] = useState<OneClickFlowResult | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedJd = useMemo(() => initialData.jdTests.find((item) => item.id === jdTestId), [initialData.jdTests, jdTestId]);
  const canGenerate = Boolean(baselineId && (jdMode === "existing" ? selectedJd : company.trim() && role.trim() && jdText.trim().length >= 20));

  function generate() {
    if (!canGenerate || isPending) return;
    setError("");
    setResult(null);
    startTransition(async () => {
      try {
        const next = await runOneClickCareerFlow(
          {
            baselineId,
            jd:
              jdMode === "existing" && selectedJd
                ? { mode: "existing", jdTest: selectedJd }
                : { mode: "manual", company: company.trim(), role: role.trim(), jdText: jdText.trim() },
          },
          requestJson,
        );
        setResult(next);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "生成失败，请稍后重试。");
      }
    });
  }

  return (
    <CareerWikiAppShell
      active="quick-start"
      title="一键生成求职方案"
      description="选择简历和 JD，系统自动完成项目匹配、定制草稿和版本创建。正式导出前仍需你确认。"
      actions={<></>}
      className="max-w-5xl"
    >
      <section className="border-y border-line bg-surface px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-6">
            <Field label="基准简历" hint={usableBaselines.length ? "真实经历是生成依据" : "需要重新导入真实简历"}>
              <select
                value={baselineId}
                onChange={(event) => setBaselineId(event.target.value)}
                className="min-h-11 w-full rounded-lg border border-line bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {!usableBaselines.length ? <option value="">没有可用的真实简历</option> : null}
                {usableBaselines.map((baseline) => <option key={baseline.id} value={baseline.id}>{baseline.name}</option>)}
              </select>
            </Field>

            <Field label="目标 JD" hint="使用已导入岗位，或直接粘贴新岗位">
              <div className="mb-3 inline-flex rounded-lg border border-line bg-background p-1">
                <ModeButton active={jdMode === "existing"} onClick={() => setJdMode("existing")} disabled={!initialData.jdTests.length}>已有 JD</ModeButton>
                <ModeButton active={jdMode === "manual"} onClick={() => setJdMode("manual")}>粘贴新 JD</ModeButton>
              </div>
              {jdMode === "existing" ? (
                <select
                  value={jdTestId}
                  onChange={(event) => setJdTestId(event.target.value)}
                  className="min-h-11 w-full rounded-lg border border-line bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  {initialData.jdTests.map((jd) => <option key={jd.id} value={jd.id}>{jd.company} · {jd.role}</option>)}
                </select>
              ) : (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input value={company} onChange={(event) => setCompany(event.target.value)} placeholder="公司名称" className="min-h-11 rounded-lg border border-line bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                    <input value={role} onChange={(event) => setRole(event.target.value)} placeholder="岗位名称" className="min-h-11 rounded-lg border border-line bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <textarea value={jdText} onChange={(event) => setJdText(event.target.value)} placeholder="粘贴完整 JD，至少 20 个字" rows={9} className="w-full resize-y rounded-lg border border-line bg-background px-3 py-3 text-sm leading-6 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
              )}
            </Field>

            <div>
              <Button size="lg" className="min-h-12 w-full text-base sm:w-auto sm:min-w-64" disabled={!canGenerate || isPending} onClick={generate}>
                {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <WandSparkles className="size-4" />}
                {isPending ? "正在生成求职方案" : "一键生成求职方案"}
              </Button>
              {error ? <p className="mt-3 text-sm text-destructive" role="alert">{error}</p> : null}
              {!usableBaselines.length ? (
                <div className="mt-3 border-l-2 border-amber-500 pl-3 text-sm leading-6 text-muted-foreground">
                  当前保存的简历仍是模板占位内容，系统已停止继续生成错误草稿。
                  <Link className="ml-1 font-medium text-primary underline" href="/career-wiki/resume-baseline">重新上传或粘贴真实简历</Link>
                </div>
              ) : null}
            </div>
          </div>

          <aside className="border-t border-line pt-6 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <p className="text-sm font-semibold">一次点击会完成</p>
            <ol className="mt-4 space-y-4 text-sm text-muted-foreground">
              {["分析岗位要求", "匹配可用项目", "生成定制草稿", "创建待审核版本"].map((item) => (
                <li key={item} className="flex gap-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Check className="size-3.5" /></span><span className="pt-0.5">{item}</span></li>
              ))}
            </ol>
            <p className="mt-6 text-xs leading-5 text-muted-foreground">不会自动批准、导出或投递。证据不足的内容仍会被阻断。</p>
          </aside>
        </div>
      </section>

      {result ? <ResultPanel result={result} /> : (
        <div className="flex min-h-28 items-center justify-center border-b border-line px-4 text-center text-sm text-muted-foreground">生成结果会显示在这里，不需要在多个页面之间切换。</div>
      )}
    </CareerWikiAppShell>
  );
}

function ResultPanel({ result }: { result: OneClickFlowResult }) {
  const topProjects = [...result.fitResults].sort((left, right) => right.fit_score - left.fit_score).slice(0, 3);
  const passed = result.checklist.filter((item) => item.passed).length;
  return (
    <section className="border-b border-line bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-2 text-primary"><FileCheck2 className="size-5" /><span className="text-sm font-semibold">草稿已生成</span></div>
          <h2 className="mt-3 text-balance text-2xl font-semibold">{result.jdTest.company} · {result.jdTest.role}</h2>
          <p className="mt-2 text-pretty text-sm text-muted-foreground">版本状态为 draft。检查清单通过 {passed}/{result.checklist.length} 项，确认前不会导出正式简历。</p>
        </div>
        <Button nativeButton={false} render={<Link href={`/career-wiki/resume-versions/${result.version.id}/preview?template=modern`} />}>
          审阅简历草稿 <ArrowRight className="size-4" />
        </Button>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {topProjects.map((project) => (
          <div key={project.project_id} className="border-t border-line pt-3">
            <p className="truncate text-sm font-medium">{project.project_name}</p>
            <p className="mt-1 text-sm text-muted-foreground">匹配分 {project.fit_score} · {project.recommended_resume_usage}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return <div><div className="mb-2 flex flex-wrap items-baseline justify-between gap-2"><label className="text-sm font-semibold">{label}</label><span className="text-xs text-muted-foreground">{hint}</span></div>{children}</div>;
}

function ModeButton({ active, disabled, onClick, children }: { active: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" disabled={disabled} onClick={onClick} className={cn("min-h-8 rounded-md px-3 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40", active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{children}</button>;
}

async function requestJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || payload.message || "请求失败");
  return payload as T;
}
