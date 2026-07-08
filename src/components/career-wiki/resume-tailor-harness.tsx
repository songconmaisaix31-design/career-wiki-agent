"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { ArrowLeft, Download, FileText, GitMerge, ListChecks, Play, Upload } from "lucide-react";

import type {
  CareerProjectView,
  CareerResumeVersionView,
  CareerJdTestView,
  ResumeBaselineView,
  ResumeTailorHarnessData,
  ResumeTailorRunView,
  WikiImportPreview,
} from "@/lib/career-wiki/types";
import type { ParsedDocument } from "@/lib/career-wiki/document-ingest/types";
import { cn } from "@/lib/utils";

export type ResumeTailorHarnessSection = "wiki-import" | "jd-import" | "resume-baseline" | "resume-tests" | "resume-tailor" | "resume-versions";

type JdTestDraft = {
  company: string;
  role: string;
  source: string;
  targetDirection: string;
  jdText: string;
};

const navItems: Array<{ section: ResumeTailorHarnessSection; label: string; icon: typeof FileText }> = [
  { section: "wiki-import", label: "Wiki 导入", icon: GitMerge },
  { section: "jd-import", label: "JD 导入", icon: Upload },
  { section: "resume-baseline", label: "基准简历", icon: FileText },
  { section: "resume-tests", label: "JD 测试集", icon: ListChecks },
  { section: "resume-tailor", label: "简历测试", icon: Play },
  { section: "resume-versions", label: "简历版本", icon: Download },
];

const emptyJdDraft: JdTestDraft = {
  company: "",
  role: "",
  source: "manual",
  targetDirection: "AI Application Engineer",
  jdText: "",
};

export function ResumeTailorHarness({
  initialSection,
  initialData,
}: {
  initialSection: ResumeTailorHarnessSection;
  initialData: ResumeTailorHarnessData;
}) {
  const [data, setData] = useState(initialData);
  const [preview, setPreview] = useState<WikiImportPreview | null>(null);
  const [parsedDocument, setParsedDocument] = useState<ParsedDocument | null>(null);
  const [ingestPurpose, setIngestPurpose] = useState<"jd" | "resume_baseline">("jd");
  const [pastedDocument, setPastedDocument] = useState("");
  const [importMeta, setImportMeta] = useState({ company: "", role: "", source: "document-ingest", targetDirection: "AI Application Engineer" });
  const [baselineMarkdown, setBaselineMarkdown] = useState("");
  const [jdDraft, setJdDraft] = useState<JdTestDraft>(emptyJdDraft);
  const [selectedBaselineId, setSelectedBaselineId] = useState(initialData.baselines[0]?.id ?? "");
  const [selectedJdIds, setSelectedJdIds] = useState<string[]>(initialData.jdTests.slice(0, 1).map((test) => test.id));
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(initialData.projects.slice(0, 4).map((project) => project.id));
  const [selectedRunIds, setSelectedRunIds] = useState<string[]>(initialData.tailorRuns.slice(0, 1).map((run) => run.id));
  const [selectedVersionId, setSelectedVersionId] = useState(initialData.resumeVersions[0]?.id ?? "");
  const [renderPreview, setRenderPreview] = useState<{ format: "markdown" | "html"; content: string } | null>(null);
  const [status, setStatus] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedRuns = useMemo(
    () => data.tailorRuns.filter((run) => selectedRunIds.includes(run.id)),
    [data.tailorRuns, selectedRunIds],
  );
  const selectedVersion = data.resumeVersions.find((version) => version.id === selectedVersionId) ?? data.resumeVersions[0];

  async function refresh() {
    const next = await requestJson<ResumeTailorHarnessData>("/api/career-wiki/resume-tests");
    setData(next);
    return next;
  }

  function loadPreview() {
    startTransition(async () => {
      try {
        const next = await requestJson<WikiImportPreview>("/api/career-wiki/wiki-import/preview");
        setPreview(next);
        setStatus(`预览完成：${next.projects.length} 个项目，${next.skills.length} 个技能。`);
      } catch (error) {
        setStatus(formatError(error));
      }
    });
  }

  function applyImport(dryRun: boolean) {
    startTransition(async () => {
      try {
        const result = await requestJson<{ applied: boolean; projectCount: number; skillCount: number; preview: WikiImportPreview }>(
          "/api/career-wiki/wiki-import/apply",
          { dryRun },
          "POST",
        );
        setPreview(result.preview);
        await refresh();
        setStatus(result.applied ? `已导入 ${result.projectCount} 个项目、${result.skillCount} 个技能。` : "Dry-run 已完成，未写入数据库。");
      } catch (error) {
        setStatus(formatError(error));
      }
    });
  }

  function ingestPastedDocument() {
    startTransition(async () => {
      try {
        const result = await requestJson<{ parsed: ParsedDocument }>(
          "/api/career-wiki/document-ingest",
          { text: pastedDocument, fileName: ingestPurpose === "jd" ? "pasted-jd.md" : "pasted-resume.md", purpose: ingestPurpose },
          "POST",
        );
        setParsedDocument(result.parsed);
        setStatus(`解析完成：${result.parsed.title}`);
      } catch (error) {
        setStatus(formatError(error));
      }
    });
  }

  function ingestUploadedDocument(file: File | null) {
    if (!file) return;
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("file", file);
        formData.set("purpose", ingestPurpose);
        const response = await fetch("/api/career-wiki/document-ingest", { method: "POST", body: formData });
        const payload = (await response.json().catch(() => ({}))) as { parsed?: ParsedDocument; message?: string };
        if (!response.ok || !payload.parsed) throw new Error(payload.message || "解析失败");
        setParsedDocument(payload.parsed);
        setStatus(`解析完成：${payload.parsed.title}`);
      } catch (error) {
        setStatus(formatError(error));
      }
    });
  }

  function confirmParsedDocument() {
    if (!parsedDocument) {
      setStatus("请先解析文件或粘贴文本。");
      return;
    }
    startTransition(async () => {
      try {
        await requestJson(
          "/api/career-wiki/jd-import/confirm",
          {
            purpose: ingestPurpose,
            markdown: parsedDocument.markdown,
            title: parsedDocument.title,
            parser: parsedDocument.parser,
            source: importMeta.source,
            company: importMeta.company,
            role: importMeta.role,
            targetDirection: importMeta.targetDirection,
            baselineName: parsedDocument.title,
          },
          "POST",
        );
        const next = await refresh();
        setParsedDocument(null);
        setPastedDocument("");
        setStatus(ingestPurpose === "jd" ? `已保存为 JD test，当前共有 ${next.jdTests.length} 个。` : `已保存为 baseline resume，当前共有 ${next.baselines.length} 个。`);
      } catch (error) {
        setStatus(formatError(error));
      }
    });
  }

  function importBaseline() {
    startTransition(async () => {
      try {
        const result = await requestJson<{ baseline: ResumeBaselineView; exportedFile: string | null }>(
          "/api/career-wiki/resume-baseline",
          { name: "baseline_resume_2025", source: baselineMarkdown.trim() ? "manual" : "vault", markdown: baselineMarkdown },
          "POST",
        );
        const next = await refresh();
        setSelectedBaselineId(result.baseline.id);
        setBaselineMarkdown("");
        setStatus(result.exportedFile ? `基准简历已导入并导出：${result.exportedFile}` : `基准简历已导入，当前共有 ${next.baselines.length} 个版本。`);
      } catch (error) {
        setStatus(formatError(error));
      }
    });
  }

  function createJdTest() {
    startTransition(async () => {
      try {
        const result = await requestJson<{ jdTest: CareerJdTestView }>("/api/career-wiki/resume-tests", jdDraft, "POST");
        await refresh();
        setSelectedJdIds((current) => [...new Set([result.jdTest.id, ...current])]);
        setJdDraft(emptyJdDraft);
        setStatus("JD 测试样本已保存。");
      } catch (error) {
        setStatus(formatError(error));
      }
    });
  }

  function seedPlaceholders() {
    startTransition(async () => {
      try {
        const result = await requestJson<{ jdTests: CareerJdTestView[] }>("/api/career-wiki/resume-tests", { seedPlaceholders: true }, "POST");
        await refresh();
        setSelectedJdIds(result.jdTests.map((test) => test.id));
        setStatus("已创建 3 个占位 JD 模板，需替换为真实 JD 后再用于正式结论。");
      } catch (error) {
        setStatus(formatError(error));
      }
    });
  }

  function runTailorTests() {
    startTransition(async () => {
      try {
        const result = await requestJson<{ runs: ResumeTailorRunView[] }>(
          "/api/career-wiki/resume-tests/run",
          { baselineId: selectedBaselineId || undefined, jdTestIds: selectedJdIds, projectIds: selectedProjectIds },
          "POST",
        );
        await refresh();
        setSelectedRunIds(result.runs.map((run) => run.id));
        setStatus(`已生成 ${result.runs.length} 份定制简历和对比报告。`);
      } catch (error) {
        setStatus(formatError(error));
      }
    });
  }

  function saveDraftVersion() {
    const runId = selectedRunIds[0];
    if (!runId) {
      setStatus("请先选择一个 draft run。");
      return;
    }
    startTransition(async () => {
      try {
        const result = await requestJson<{ version: CareerResumeVersionView }>("/api/career-wiki/resume-versions", { tailorRunId: runId }, "POST");
        await refresh();
        setSelectedVersionId(result.version.id);
        setStatus(`已保存 draft version：${result.version.versionName}`);
      } catch (error) {
        setStatus(formatError(error));
      }
    });
  }

  function updateVersionStatus(id: string, nextStatus: CareerResumeVersionView["status"]) {
    startTransition(async () => {
      try {
        const result = await requestJson<{ version: CareerResumeVersionView }>("/api/career-wiki/resume-versions", { id, status: nextStatus }, "PATCH");
        await refresh();
        setSelectedVersionId(result.version.id);
        setStatus(`版本状态已更新为 ${result.version.status}。`);
      } catch (error) {
        setStatus(formatError(error));
      }
    });
  }

  function exportVersion(id: string) {
    startTransition(async () => {
      try {
        const result = await requestJson<{ configured: boolean; message: string; files: string[] }>(
          "/api/career-wiki/resume-versions/export",
          { versionId: id },
          "POST",
        );
        await refresh();
        setStatus(result.configured ? `${result.message} ${result.files.slice(0, 2).join("；")}` : result.message);
      } catch (error) {
        setStatus(formatError(error));
      }
    });
  }

  function renderVersion(id: string, format: "markdown" | "html") {
    startTransition(async () => {
      try {
        const result = await requestJson<{ format: "markdown" | "html"; content: string }>(
          "/api/career-wiki/resume-versions/render",
          { versionId: id, format },
          "POST",
        );
        setRenderPreview(result);
        setStatus(`${format.toUpperCase()} 预览已生成。`);
      } catch (error) {
        setStatus(formatError(error));
      }
    });
  }

  function exportVersionFormat(id: string, format: "markdown" | "json" | "html" | "docx" | "pdf") {
    startTransition(async () => {
      try {
        const result = await requestJson<{ configured: boolean; message: string; files: string[] }>(
          "/api/career-wiki/resume-versions/export-format",
          { versionId: id, format },
          "POST",
        );
        await refresh();
        setStatus(result.configured ? `${result.message} ${result.files.slice(0, 2).join("；")}` : result.message);
      } catch (error) {
        setStatus(formatError(error));
      }
    });
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:px-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <Link href="/career-wiki/profile" className="mb-5 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
            返回 Career Wiki
          </Link>
          <nav className="rounded-lg border border-line bg-surface p-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.section}
                  href={`/career-wiki/${item.section}`}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-surface-low",
                    initialSection === item.section && "bg-primary text-primary-foreground hover:bg-primary",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0 flex-1 space-y-5">
          <header className="border-b border-line pb-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Resume Tailor Test Harness</p>
            <h1 className="mt-2 text-2xl font-semibold">{sectionTitle(initialSection)}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              用 Wiki 项目素材、基准简历和多 JD 测试集验证定制简历质量；不包含自动投递、平台爬虫、登录自动化或 Cookie 管理。
            </p>
          </header>

          {!data.vaultConfigured ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              未配置 CAREER_VAULT_PATH。测试可运行；配置后才能导出到 Obsidian。
            </div>
          ) : null}
          {status ? <div className="rounded-lg border border-line bg-surface px-4 py-3 text-sm">{status}</div> : null}

          <div className="lg:hidden">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {navItems.map((item) => (
                <Link
                  key={item.section}
                  href={`/career-wiki/${item.section}`}
                  className={cn(
                    "shrink-0 rounded-md border border-line px-3 py-2 text-sm",
                    initialSection === item.section && "border-primary bg-primary text-primary-foreground",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {initialSection === "wiki-import" && (
            <WikiImportPanel preview={preview} isPending={isPending} onPreview={loadPreview} onApply={applyImport} />
          )}
          {initialSection === "jd-import" && (
            <DocumentIngestPanel
              purpose={ingestPurpose}
              setPurpose={setIngestPurpose}
              pastedText={pastedDocument}
              setPastedText={setPastedDocument}
              parsed={parsedDocument}
              importMeta={importMeta}
              setImportMeta={setImportMeta}
              onUpload={ingestUploadedDocument}
              onParseText={ingestPastedDocument}
              onConfirm={confirmParsedDocument}
              isPending={isPending}
            />
          )}
          {initialSection === "resume-baseline" && (
            <BaselinePanel
              baselines={data.baselines}
              markdown={baselineMarkdown}
              setMarkdown={setBaselineMarkdown}
              onImport={importBaseline}
              isPending={isPending}
            />
          )}
          {initialSection === "resume-tests" && (
            <JdTestsPanel
              tests={data.jdTests}
              draft={jdDraft}
              setDraft={setJdDraft}
              selectedIds={selectedJdIds}
              setSelectedIds={setSelectedJdIds}
              onCreate={createJdTest}
              onSeed={seedPlaceholders}
              isPending={isPending}
            />
          )}
          {initialSection === "resume-tailor" && (
            <TailorRunsPanel
              baselines={data.baselines}
              tests={data.jdTests}
              projects={data.projects}
              versions={data.resumeVersions}
              selectedBaselineId={selectedBaselineId}
              setSelectedBaselineId={setSelectedBaselineId}
              selectedJdIds={selectedJdIds}
              setSelectedJdIds={setSelectedJdIds}
              selectedProjectIds={selectedProjectIds}
              setSelectedProjectIds={setSelectedProjectIds}
              selectedRunIds={selectedRunIds}
              setSelectedRunIds={setSelectedRunIds}
              selectedRuns={selectedRuns}
              selectedVersion={selectedVersion}
              onRun={runTailorTests}
              onSaveDraft={saveDraftVersion}
              onApprove={(id) => updateVersionStatus(id, "approved")}
              onExport={exportVersion}
              isPending={isPending}
            />
          )}
          {initialSection === "resume-versions" && (
            <ResumeVersionsPanel
              versions={data.resumeVersions}
              selectedVersionId={selectedVersionId}
              setSelectedVersionId={setSelectedVersionId}
              onApprove={(id) => updateVersionStatus(id, "approved")}
              onArchive={(id) => updateVersionStatus(id, "archived")}
              onExport={exportVersion}
              onRender={renderVersion}
              onExportFormat={exportVersionFormat}
              renderPreview={renderPreview}
              isPending={isPending}
            />
          )}
        </section>
      </div>
    </main>
  );
}

function WikiImportPanel({
  preview,
  isPending,
  onPreview,
  onApply,
}: {
  preview: WikiImportPreview | null;
  isPending: boolean;
  onPreview: () => void;
  onApply: (dryRun: boolean) => void;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <ActionButton onClick={onPreview} disabled={isPending} icon={GitMerge} label="生成预览" />
        <ActionButton onClick={() => onApply(true)} disabled={isPending} icon={Play} label="Dry-run" variant="secondary" />
        <ActionButton onClick={() => onApply(false)} disabled={isPending || !preview} icon={Upload} label="确认导入" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <PreviewList title="项目预览" items={(preview?.projects ?? []).map((project) => `${project.name} · ${project.status} · ${project.sourceFile}`)} />
        <PreviewList title="技能预览" items={(preview?.skills ?? []).map((skill) => `${skill.name} · ${skill.category} · ${skill.sourceFile}`)} />
      </div>
      {preview?.warnings.length ? <PreviewList title="导入警告" items={preview.warnings} /> : null}
    </section>
  );
}

function DocumentIngestPanel({
  purpose,
  setPurpose,
  pastedText,
  setPastedText,
  parsed,
  importMeta,
  setImportMeta,
  onUpload,
  onParseText,
  onConfirm,
  isPending,
}: {
  purpose: "jd" | "resume_baseline";
  setPurpose: (purpose: "jd" | "resume_baseline") => void;
  pastedText: string;
  setPastedText: (value: string) => void;
  parsed: ParsedDocument | null;
  importMeta: { company: string; role: string; source: string; targetDirection: string };
  setImportMeta: (value: { company: string; role: string; source: string; targetDirection: string }) => void;
  onUpload: (file: File | null) => void;
  onParseText: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_420px]">
      <div className="space-y-4 rounded-lg border border-line bg-surface p-4">
        <div>
          <h2 className="text-base font-semibold">多格式 JD / 简历导入</h2>
          <p className="mt-1 text-sm text-muted-foreground">支持 MD、TXT、HTML；PDF/DOCX 需要本机 MarkItDown CLI，可缺省 fallback。</p>
        </div>
        <label className="block text-sm font-medium">
          用途
          <select
            value={purpose}
            onChange={(event) => setPurpose(event.target.value === "resume_baseline" ? "resume_baseline" : "jd")}
            className="mt-1 h-10 w-full rounded-md border border-line bg-background px-3 text-sm"
          >
            <option value="jd">JD test</option>
            <option value="resume_baseline">Resume baseline</option>
          </select>
        </label>
        <label className="block text-sm font-medium">
          上传文件
          <input
            type="file"
            accept=".md,.txt,.html,.pdf,.docx"
            onChange={(event) => onUpload(event.target.files?.[0] ?? null)}
            className="mt-1 block w-full rounded-md border border-line bg-background px-3 py-2 text-sm"
          />
        </label>
        <Textarea label="或粘贴文本" value={pastedText} onChange={setPastedText} rows={10} />
        <ActionButton onClick={onParseText} disabled={isPending || !pastedText.trim()} icon={FileText} label="解析粘贴文本" variant="secondary" />
        {purpose === "jd" ? (
          <div className="grid gap-3 md:grid-cols-2">
            <Input label="公司" value={importMeta.company} onChange={(company) => setImportMeta({ ...importMeta, company })} />
            <Input label="岗位" value={importMeta.role} onChange={(role) => setImportMeta({ ...importMeta, role })} />
            <Input label="来源" value={importMeta.source} onChange={(source) => setImportMeta({ ...importMeta, source })} />
            <Input
              label="目标方向"
              value={importMeta.targetDirection}
              onChange={(targetDirection) => setImportMeta({ ...importMeta, targetDirection })}
            />
          </div>
        ) : null}
        <ActionButton onClick={onConfirm} disabled={isPending || !parsed} icon={Upload} label={purpose === "jd" ? "保存为 JD test" : "保存为 baseline resume"} />
      </div>
      <div className="rounded-lg border border-line bg-surface p-4">
        <h2 className="text-base font-semibold">解析预览</h2>
        {parsed ? (
          <div className="mt-3 space-y-3">
            <div className="text-sm text-muted-foreground">
              {parsed.title} · {parsed.parser} · {Math.round(parsed.provenance.size_bytes / 1024)} KB
            </div>
            {parsed.warnings.length ? <ListBlock title="提示" items={parsed.warnings} /> : null}
            <pre className="max-h-[520px] overflow-auto rounded-md border border-line bg-background p-3 text-xs whitespace-pre-wrap">
              {parsed.markdown.slice(0, 6000)}
            </pre>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">上传文件或粘贴文本后，这里显示 normalized Markdown。</p>
        )}
      </div>
    </section>
  );
}

function BaselinePanel({
  baselines,
  markdown,
  setMarkdown,
  onImport,
  isPending,
}: {
  baselines: ResumeBaselineView[];
  markdown: string;
  setMarkdown: (value: string) => void;
  onImport: () => void;
  isPending: boolean;
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div className="rounded-lg border border-line bg-surface p-4">
        <label className="text-sm font-medium">Markdown 简历</label>
        <textarea
          value={markdown}
          onChange={(event) => setMarkdown(event.target.value)}
          rows={18}
          className="mt-2 min-h-96 w-full rounded-md border border-line bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          placeholder="粘贴 baseline Markdown；留空时会尝试读取 CareerVault/05_Resume_Versions/baseline_resume_2025.md"
        />
        <div className="mt-3">
          <ActionButton onClick={onImport} disabled={isPending} icon={Upload} label="导入 baseline" />
        </div>
      </div>
      <PreviewList title="已导入版本" items={baselines.map((item) => `${item.name} · ${item.source} · ${new Date(item.updatedAt).toLocaleString()}`)} />
    </section>
  );
}

function JdTestsPanel({
  tests,
  draft,
  setDraft,
  selectedIds,
  setSelectedIds,
  onCreate,
  onSeed,
  isPending,
}: {
  tests: CareerJdTestView[];
  draft: JdTestDraft;
  setDraft: (draft: JdTestDraft) => void;
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  onCreate: () => void;
  onSeed: () => void;
  isPending: boolean;
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_420px]">
      <div className="space-y-3 rounded-lg border border-line bg-surface p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="公司" value={draft.company} onChange={(company) => setDraft({ ...draft, company })} />
          <Input label="岗位" value={draft.role} onChange={(role) => setDraft({ ...draft, role })} />
          <Input label="来源" value={draft.source} onChange={(source) => setDraft({ ...draft, source })} />
          <Input label="目标方向" value={draft.targetDirection} onChange={(targetDirection) => setDraft({ ...draft, targetDirection })} />
        </div>
        <Textarea label="JD 内容" value={draft.jdText} onChange={(jdText) => setDraft({ ...draft, jdText })} rows={12} />
        <div className="flex flex-wrap gap-2">
          <ActionButton onClick={onCreate} disabled={isPending} icon={Upload} label="保存 JD" />
          <ActionButton onClick={onSeed} disabled={isPending} icon={FileText} label="创建占位模板" variant="secondary" />
        </div>
      </div>
      <Checklist
        title="JD 测试集"
        items={tests}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        labelOf={(test) => `${test.company} · ${test.role} · ${test.targetDirection}`}
      />
    </section>
  );
}

function TailorRunsPanel({
  baselines,
  tests,
  projects,
  versions,
  selectedBaselineId,
  setSelectedBaselineId,
  selectedJdIds,
  setSelectedJdIds,
  selectedProjectIds,
  setSelectedProjectIds,
  selectedRunIds,
  setSelectedRunIds,
  selectedRuns,
  selectedVersion,
  onRun,
  onSaveDraft,
  onApprove,
  onExport,
  isPending,
}: {
  baselines: ResumeBaselineView[];
  tests: CareerJdTestView[];
  projects: CareerProjectView[];
  versions: CareerResumeVersionView[];
  selectedBaselineId: string;
  setSelectedBaselineId: (id: string) => void;
  selectedJdIds: string[];
  setSelectedJdIds: (ids: string[]) => void;
  selectedProjectIds: string[];
  setSelectedProjectIds: (ids: string[]) => void;
  selectedRunIds: string[];
  setSelectedRunIds: (ids: string[]) => void;
  selectedRuns: ResumeTailorRunView[];
  selectedVersion?: CareerResumeVersionView;
  onRun: () => void;
  onSaveDraft: () => void;
  onApprove: (id: string) => void;
  onExport: (id: string) => void;
  isPending: boolean;
}) {
  const latestRun = selectedRuns[0];
  return (
    <section className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-line bg-surface p-4">
          <h2 className="text-base font-semibold">Step 1 · 选择 baseline resume</h2>
          <select
            value={selectedBaselineId}
            onChange={(event) => setSelectedBaselineId(event.target.value)}
            className="mt-3 h-10 w-full rounded-md border border-line bg-background px-3 text-sm"
          >
            <option value="">使用最近导入版本</option>
            {baselines.map((baseline) => (
              <option key={baseline.id} value={baseline.id}>
                {baseline.name} · {baseline.source}
              </option>
            ))}
          </select>
        </div>
        <Checklist
          title="Step 2 · 选择 JD test"
          items={tests}
          selectedIds={selectedJdIds}
          setSelectedIds={(ids) => setSelectedJdIds(ids.slice(-1))}
          labelOf={(test) => `${test.company} · ${test.role}`}
        />
      </div>

      <Checklist
        title="Step 3 · 选择要使用的项目素材"
        items={projects}
        selectedIds={selectedProjectIds}
        setSelectedIds={setSelectedProjectIds}
        labelOf={(project) => `${project.name} · ${project.status}`}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <PreviewList
          title="Step 4 · 推荐项目预览"
          items={projects.filter((project) => selectedProjectIds.includes(project.id)).map((project) => `${project.name} · ${project.status}`)}
        />
        <PreviewList
          title="推荐技能预览"
          items={latestRun ? latestRun.targetedSkills : ["生成 draft 后显示匹配技能"]}
        />
      </div>

      <div className="rounded-lg border border-line bg-surface p-4">
        <h2 className="text-base font-semibold">Step 5 · 生成定制简历草稿</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <ActionButton onClick={onRun} disabled={isPending || selectedJdIds.length === 0 || selectedProjectIds.length === 0} icon={Play} label="生成 draft" />
          <ActionButton onClick={onSaveDraft} disabled={isPending || selectedRunIds.length === 0} icon={FileText} label="保存为 draft version" variant="secondary" />
        </div>
      </div>

      <div className="grid gap-4">
        {selectedRuns.map((run) => (
          <article key={run.id} className="rounded-lg border border-line bg-surface p-4">
            <h2 className="text-base font-semibold">
              Step 6 · Diff 和风险提示：{run.jdAnalysis.company} · {run.jdAnalysis.role}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Baseline {run.comparisonReport.baselineScore} → Tailored {run.comparisonReport.tailoredScore}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <ActionButton
                onClick={() => setSelectedRunIds([run.id])}
                disabled={isPending}
                icon={ListChecks}
                label={selectedRunIds.includes(run.id) ? "当前 draft" : "选择 draft"}
                variant="secondary"
              />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <ListBlock title="匹配项目" items={run.selectedProjects} />
              <ListBlock title="风险提示" items={run.riskNotes} />
              <ListBlock title="缺失证据" items={run.missingEvidence} />
              <ListBlock title="下一步" items={run.comparisonReport.nextActions} />
            </div>
          </article>
        ))}
      </div>

      <div className="rounded-lg border border-line bg-surface p-4">
        <h2 className="text-base font-semibold">Step 7 · 用户确认后保存为正式版本</h2>
        {selectedVersion ? (
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <ListBlock title={`${selectedVersion.versionName} · ${selectedVersion.status}`} items={[`${selectedVersion.company} · ${selectedVersion.role}`]} />
            <ListBlock
              title="导出前检查清单"
              items={selectedVersion.checklist.map((item) => `${item.passed ? "PASS" : "BLOCK"} · ${item.label}${item.reason ? `：${item.reason}` : ""}`)}
            />
            <ListBlock title="Diff" items={selectedVersion.diffSummary.projectBullets.slice(0, 6)} />
            <ListBlock title="Evidence validation" items={selectedVersion.evidenceSummary.map((item) => `${item.valid ? "PASS" : "BLOCK"} · ${item.section} · ${item.evidenceSource}`)} />
            <div className="flex flex-wrap gap-2 lg:col-span-2">
              <ActionButton onClick={() => onApprove(selectedVersion.id)} disabled={isPending || selectedVersion.status !== "draft"} icon={ListChecks} label="确认为 approved" />
              <ActionButton
                onClick={() => onExport(selectedVersion.id)}
                disabled={isPending || (selectedVersion.status !== "approved" && selectedVersion.status !== "exported")}
                icon={Download}
                label="Step 8 · 导出到 Obsidian"
              />
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">保存 draft version 后显示审批和导出检查。</p>
        )}
      </div>

      <PreviewList title="历史版本" items={versions.slice(0, 8).map((version) => `${version.versionName} · ${version.status} · ${version.company} · ${version.role}`)} />
    </section>
  );
}

function ResumeVersionsPanel({
  versions,
  selectedVersionId,
  setSelectedVersionId,
  onApprove,
  onArchive,
  onExport,
  onRender,
  onExportFormat,
  renderPreview,
  isPending,
}: {
  versions: CareerResumeVersionView[];
  selectedVersionId: string;
  setSelectedVersionId: (id: string) => void;
  onApprove: (id: string) => void;
  onArchive: (id: string) => void;
  onExport: (id: string) => void;
  onRender: (id: string, format: "markdown" | "html") => void;
  onExportFormat: (id: string, format: "markdown" | "json" | "html" | "docx" | "pdf") => void;
  renderPreview: { format: "markdown" | "html"; content: string } | null;
  isPending: boolean;
}) {
  const selected = versions.find((version) => version.id === selectedVersionId) ?? versions[0];
  const canExport = selected ? selected.status === "approved" || selected.status === "exported" : false;
  return (
    <section className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <Checklist
        title="简历版本列表"
        items={versions}
        selectedIds={selected ? [selected.id] : []}
        setSelectedIds={(ids) => setSelectedVersionId(ids.at(-1) ?? "")}
        labelOf={(version) => `${version.versionName} · ${version.status} · ${version.company} · ${version.role}`}
      />
      {selected ? (
        <article className="rounded-lg border border-line bg-surface p-4">
          <h2 className="text-base font-semibold">
            {selected.versionName} · {selected.company} · {selected.role}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Status: {selected.status}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ActionButton onClick={() => onApprove(selected.id)} disabled={isPending || selected.status !== "draft"} icon={ListChecks} label="标记 approved" />
            <ActionButton onClick={() => onArchive(selected.id)} disabled={isPending || selected.status === "archived"} icon={FileText} label="归档" variant="secondary" />
            <ActionButton
              onClick={() => onExport(selected.id)}
              disabled={isPending || !canExport}
              icon={Download}
              label="导出 Markdown + 审核报告"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <ActionButton onClick={() => onRender(selected.id, "markdown")} disabled={isPending} icon={FileText} label="Markdown preview" variant="secondary" />
            <ActionButton onClick={() => onRender(selected.id, "html")} disabled={isPending} icon={FileText} label="HTML preview" variant="secondary" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["markdown", "json", "html", "docx", "pdf"] as const).map((format) => (
              <ActionButton
                key={format}
                onClick={() => onExportFormat(selected.id, format)}
                disabled={isPending || !canExport}
                icon={Download}
                label={`Export ${format.toUpperCase()}`}
                variant="secondary"
              />
            ))}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <ListBlock title="导出前检查清单" items={selected.checklist.map((item) => `${item.passed ? "PASS" : "BLOCK"} · ${item.label}${item.reason ? `：${item.reason}` : ""}`)} />
            <ListBlock title="风险提示" items={selected.riskNotes} />
            <ListBlock title="Diff · Project Bullets" items={selected.diffSummary.projectBullets} />
            <ListBlock title="Evidence" items={selected.evidenceSummary.map((item) => `${item.valid ? "PASS" : "BLOCK"} · ${item.content}`)} />
          </div>
          {renderPreview ? (
            <div className="mt-4 rounded-md border border-line bg-background p-3">
              <h3 className="text-sm font-medium">{renderPreview.format.toUpperCase()} preview</h3>
              {renderPreview.format === "html" ? (
                <iframe title="HTML resume preview" srcDoc={renderPreview.content} className="mt-2 h-[640px] w-full rounded-md border border-line bg-white" />
              ) : (
                <pre className="mt-2 max-h-[640px] overflow-auto whitespace-pre-wrap text-xs">{renderPreview.content}</pre>
              )}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">点击 preview 生成 Markdown 或 HTML 预览；draft 可以预览，但不能导出 final。</p>
          )}
        </article>
      ) : (
        <PreviewList title="版本详情" items={[]} />
      )}
    </section>
  );
}

function Checklist<T extends { id: string }>({
  title,
  items,
  selectedIds,
  setSelectedIds,
  labelOf,
}: {
  title: string;
  items: T[];
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  labelOf: (item: T) => string;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="mt-3 space-y-2">
        {items.length ? (
          items.map((item) => (
            <label key={item.id} className="flex gap-2 rounded-md border border-line bg-background px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={selectedIds.includes(item.id)}
                onChange={(event) =>
                  setSelectedIds(event.target.checked ? [...selectedIds, item.id] : selectedIds.filter((id) => id !== item.id))
                }
              />
              <span>{labelOf(item)}</span>
            </label>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">暂无数据。</p>
        )}
      </div>
    </div>
  );
}

function PreviewList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <h2 className="text-base font-semibold">{title}</h2>
      <ListBlock title="" items={items} />
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      {title ? <h3 className="text-sm font-medium">{title}</h3> : null}
      {items.length ? (
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          {items.slice(0, 12).map((item, index) => (
            <li key={`${item}-${index}`}>- {item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">暂无数据。</p>
      )}
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-sm font-medium">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-10 w-full rounded-md border border-line bg-background px-3 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}

function Textarea({ label, value, onChange, rows }: { label: string; value: string; rows: number; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="mt-1 w-full rounded-md border border-line bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}

function ActionButton({
  label,
  icon: Icon,
  onClick,
  disabled,
  variant = "primary",
}: {
  label: string;
  icon: typeof FileText;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium disabled:opacity-60",
        variant === "primary" ? "bg-primary text-primary-foreground" : "border border-line bg-surface hover:bg-surface-low",
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}

async function requestJson<T>(url: string, body?: unknown, method = body ? "POST" : "GET"): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof payload.message === "string" ? payload.message : "请求失败");
  return payload as T;
}

function sectionTitle(section: ResumeTailorHarnessSection) {
  return navItems.find((item) => item.section === section)?.label ?? "Resume Tailor";
}

function formatError(error: unknown) {
  return error instanceof Error ? error.message : "请求失败";
}
