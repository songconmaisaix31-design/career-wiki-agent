"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Download, FileText, GitMerge, ListChecks, Play, Upload } from "lucide-react";

import { CareerWikiAppShell } from "@/components/career-wiki/app-shell";
import { labelForStatus } from "@/components/career-wiki/navigation";
import type { CareerWikiRouteKey } from "@/components/career-wiki/navigation";
import type {
  CareerEvidenceItemView,
  CareerEvidenceStatus,
  CareerEvidenceTargetType,
  CareerEvidenceType,
  CareerProjectView,
  CareerResumeVersionView,
  CareerJdTestView,
  ResumeBaselineView,
  ResumeTailorHarnessData,
  ResumeTailorRunView,
  WikiImportPreview,
} from "@/lib/career-wiki/types";
import type { ParsedDocument } from "@/lib/career-wiki/document-ingest/types";
import type { ProjectFitOverrideType, ProjectFitResult } from "@/lib/career-wiki/project-fit/types";
import type { ResumeTemplateId } from "@/lib/career-wiki/resume-templates/templates";
import { cn } from "@/lib/utils";

export type ResumeTailorHarnessSection = "wiki-import" | "jd-import" | "resume-baseline" | "resume-tests" | "project-fit" | "evidence-editor" | "resume-tailor" | "resume-versions";

type JdTestDraft = {
  company: string;
  role: string;
  source: string;
  targetDirection: string;
  jdText: string;
};

type EvidenceDraft = {
  id?: string;
  targetType: CareerEvidenceTargetType;
  targetId: string;
  jdTestId: string;
  evidenceType: CareerEvidenceType;
  title: string;
  content: string;
  sourcePath: string;
  sourceExcerpt: string;
  confidence: number;
  status: CareerEvidenceStatus;
};

const navItems: Array<{ section: ResumeTailorHarnessSection; label: string; icon: typeof FileText }> = [
  { section: "wiki-import", label: "Wiki 导入", icon: GitMerge },
  { section: "jd-import", label: "JD 导入", icon: Upload },
  { section: "resume-baseline", label: "基准简历", icon: FileText },
  { section: "resume-tests", label: "JD 测试集", icon: ListChecks },
  { section: "project-fit", label: "项目匹配", icon: GitMerge },
  { section: "evidence-editor", label: "证据中心", icon: FileText },
  { section: "resume-tailor", label: "简历工作台", icon: Play },
  { section: "resume-versions", label: "导出与版本", icon: Download },
];

const sectionDescriptions: Record<ResumeTailorHarnessSection, string> = {
  "wiki-import": "从本地 Wiki 导入项目和技能，先预览再写入，避免误覆盖真实素材。",
  "jd-import": "上传或粘贴 JD / 简历文档，解析后确认公司、岗位、来源和方向再保存。",
  "resume-baseline": "导入 Markdown 基准简历，作为后续定制简历对比和 diff 的来源。",
  "resume-tests": "维护多 JD 测试集，用于验证定制简历生成质量。",
  "project-fit": "按 JD 解释项目匹配程度、证据强度、风险和推荐用法。",
  "evidence-editor": "为项目、技能和 bullet 补充证据，并区分 draft / verified / rejected。",
  "resume-tailor": "按 baseline、JD、项目匹配、证据审核、diff、checklist 和人工批准推进。",
  "resume-versions": "查看简历版本，选择模板预览，并导出 approved / exported 版本。",
};

const emptyJdDraft: JdTestDraft = {
  company: "",
  role: "",
  source: "manual",
  targetDirection: "AI Application Engineer",
  jdText: "",
};

const emptyEvidenceDraft: EvidenceDraft = {
  targetType: "project",
  targetId: "",
  jdTestId: "",
  evidenceType: "user_input",
  title: "",
  content: "",
  sourcePath: "manual_input",
  sourceExcerpt: "",
  confidence: 70,
  status: "draft",
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
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplateId>("modern");
  const [selectedProjectFitJdId, setSelectedProjectFitJdId] = useState(initialData.jdTests[0]?.id ?? "");
  const [projectFitResults, setProjectFitResults] = useState<ProjectFitResult[]>([]);
  const [projectFitOverrides, setProjectFitOverrides] = useState<Record<string, { overrideType: ProjectFitOverrideType; overrideReason: string }>>({});
  const [evidenceItems, setEvidenceItems] = useState<CareerEvidenceItemView[]>(initialData.evidenceItems);
  const [evidenceDraft, setEvidenceDraft] = useState<EvidenceDraft>({ ...emptyEvidenceDraft, targetId: initialData.projects[0]?.id ?? "", jdTestId: initialData.jdTests[0]?.id ?? "" });
  const [evidenceFilter, setEvidenceFilter] = useState({ jdTestId: initialData.jdTests[0]?.id ?? "", targetType: "all", status: "all" });
  const [renderPreview, setRenderPreview] = useState<{ format: "markdown" | "html"; content: string; template: ResumeTemplateId } | null>(null);
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
    setEvidenceItems(next.evidenceItems);
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
        setStatus(result.applied ? `已导入 ${result.projectCount} 个项目、${result.skillCount} 个技能。` : "预演完成，未写入数据库。");
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

  function loadProjectFitResults(jdTestId = selectedProjectFitJdId) {
    if (!jdTestId) {
      setStatus("请先选择一个 JD test。");
      return;
    }
    startTransition(async () => {
      try {
        const result = await requestJson<{ results: ProjectFitResult[] }>(`/api/career-wiki/project-fit?jdTestId=${encodeURIComponent(jdTestId)}`);
        setProjectFitResults(result.results);
        setStatus(`已加载 ${result.results.length} 条项目匹配结果。`);
      } catch (error) {
        setStatus(formatError(error));
      }
    });
  }

  function runProjectFit(exportReport = false) {
    const jdTest = data.jdTests.find((test) => test.id === selectedProjectFitJdId);
    if (!jdTest) {
      setStatus("请先选择一个 JD test。");
      return;
    }
    startTransition(async () => {
      try {
        const result = await requestJson<{ results: ProjectFitResult[]; exportedFile?: string }>(
          "/api/career-wiki/project-fit/run",
          { jdTestId: jdTest.id, targetDirection: jdTest.targetDirection, exportReport },
          "POST",
        );
        setProjectFitResults(result.results);
        setStatus(exportReport && result.exportedFile ? `项目匹配报告已导出：${result.exportedFile}` : `已完成 ${result.results.length} 个项目匹配分类。`);
      } catch (error) {
        setStatus(formatError(error));
      }
    });
  }

  function overrideProjectFit(resultId: string) {
    const draft = projectFitOverrides[resultId];
    if (!draft?.overrideReason.trim()) {
      setStatus("Manual override 必须填写原因。");
      return;
    }
    startTransition(async () => {
      try {
        await requestJson(
          "/api/career-wiki/project-fit/override",
          { id: resultId, overrideType: draft.overrideType, overrideReason: draft.overrideReason },
          "PATCH",
        );
        loadProjectFitResults();
      } catch (error) {
        setStatus(formatError(error));
      }
    });
  }

  function loadEvidenceItems() {
    startTransition(async () => {
      try {
        const params = new URLSearchParams();
        if (evidenceFilter.jdTestId) params.set("jdTestId", evidenceFilter.jdTestId);
        if (evidenceFilter.targetType !== "all") params.set("targetType", evidenceFilter.targetType);
        if (evidenceFilter.status !== "all") params.set("status", evidenceFilter.status);
        const result = await requestJson<{ evidenceItems: CareerEvidenceItemView[] }>(`/api/career-wiki/evidence?${params.toString()}`);
        setEvidenceItems(result.evidenceItems);
        setStatus(`已加载 ${result.evidenceItems.length} 条证据。`);
      } catch (error) {
        setStatus(formatError(error));
      }
    });
  }

  function saveEvidence() {
    startTransition(async () => {
      try {
        const result = await requestJson<{ evidenceItem: CareerEvidenceItemView }>(
          "/api/career-wiki/evidence",
          evidenceDraft,
          evidenceDraft.id ? "PATCH" : "POST",
        );
        await refresh();
        setEvidenceDraft({ ...emptyEvidenceDraft, targetId: evidenceDraft.targetId, jdTestId: evidenceDraft.jdTestId });
        setStatus(`证据已保存：${result.evidenceItem.title} · ${result.evidenceItem.status}`);
      } catch (error) {
        setStatus(formatError(error));
      }
    });
  }

  function deleteEvidence(id: string) {
    startTransition(async () => {
      try {
        await requestJson("/api/career-wiki/evidence", { id }, "DELETE");
        await refresh();
        setStatus("证据已删除。");
      } catch (error) {
        setStatus(formatError(error));
      }
    });
  }

  function exportEvidence() {
    startTransition(async () => {
      try {
        const result = await requestJson<{ configured: boolean; message: string; files: string[] }>(
          "/api/career-wiki/evidence/export",
          { jdTestId: evidenceFilter.jdTestId },
          "POST",
        );
        setStatus(result.configured ? result.message : "未配置 CAREER_VAULT_PATH，请先设置 CareerVault 路径。");
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

  function renderVersion(id: string, format: "markdown" | "html", template = selectedTemplate) {
    startTransition(async () => {
      try {
        const result = await requestJson<{ format: "markdown" | "html"; content: string }>(
          "/api/career-wiki/resume-versions/render",
          { versionId: id, format, template },
          "POST",
        );
        setRenderPreview({ ...result, template });
        setStatus(`${format.toUpperCase()} · ${template} 预览已生成。`);
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
          { versionId: id, format, template: selectedTemplate, page_size: "A4", include_internal_reports: false },
          "POST",
        );
        await refresh();
        setStatus(result.configured ? `${result.message} ${result.files.slice(0, 2).join("；")}` : result.message);
      } catch (error) {
        setStatus(formatError(error));
      }
    });
  }

  const active = initialSection as CareerWikiRouteKey;

  return (
    <CareerWikiAppShell
      active={active}
      title={sectionTitle(initialSection)}
      description={sectionDescriptions[initialSection]}
      statusItems={[
        { label: "CareerVault", value: data.vaultConfigured ? "已配置" : "待配置", status: data.vaultConfigured ? "pass" : "warn" },
        { label: "JD", value: String(data.jdTests.length) },
        { label: "项目", value: String(data.projects.length) },
        { label: "简历版本", value: String(data.resumeVersions.length) },
      ]}
      actions={
        <>
          <Link
            href="/career-wiki/project-fit"
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm font-medium hover:bg-surface-low"
          >
            <GitMerge className="size-4" />
            项目匹配
          </Link>
          <Link
            href="/career-wiki/resume-tailor"
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm font-medium hover:bg-surface-low"
          >
            <Play className="size-4" />
            简历工作台
          </Link>
          <Link
            href="/career-wiki/resume-versions"
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Download className="size-4" />
            导出与版本
          </Link>
        </>
      }
    >
      {!data.vaultConfigured ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          未配置 CAREER_VAULT_PATH。测试和本地审核可继续运行；配置后才能导出到 Obsidian。
        </div>
      ) : null}
      {status ? <div className="rounded-lg border border-line bg-surface px-4 py-3 text-sm leading-6">{status}</div> : null}

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
      {initialSection === "project-fit" && (
        <ProjectFitPanel
          tests={data.jdTests}
          results={projectFitResults}
          selectedJdId={selectedProjectFitJdId}
          setSelectedJdId={(id) => {
            setSelectedProjectFitJdId(id);
            setProjectFitResults([]);
          }}
          overrides={projectFitOverrides}
          setOverrides={setProjectFitOverrides}
          onLoad={loadProjectFitResults}
          onRun={runProjectFit}
          onOverride={overrideProjectFit}
          isPending={isPending}
        />
      )}
      {initialSection === "evidence-editor" && (
        <EvidenceEditorPanel
          tests={data.jdTests}
          projects={data.projects}
          skills={data.skills}
          evidenceItems={evidenceItems}
          projectFitResults={projectFitResults}
          draft={evidenceDraft}
          setDraft={setEvidenceDraft}
          filter={evidenceFilter}
          setFilter={setEvidenceFilter}
          onLoad={loadEvidenceItems}
          onLoadProjectFit={() => loadProjectFitResults(evidenceFilter.jdTestId)}
          onSave={saveEvidence}
          onDelete={deleteEvidence}
          onExport={exportEvidence}
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
          selectedTemplate={selectedTemplate}
          setSelectedTemplate={setSelectedTemplate}
          isPending={isPending}
        />
      )}
    </CareerWikiAppShell>
  );
}function WikiImportPanel({
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
        <ActionButton onClick={() => onApply(true)} disabled={isPending} icon={Play} label="预演导入" variant="secondary" />
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

function EvidenceEditorPanel({
  tests,
  projects,
  skills,
  evidenceItems,
  projectFitResults,
  draft,
  setDraft,
  filter,
  setFilter,
  onLoad,
  onLoadProjectFit,
  onSave,
  onDelete,
  onExport,
  isPending,
}: {
  tests: CareerJdTestView[];
  projects: CareerProjectView[];
  skills: { id: string; name: string; category: string }[];
  evidenceItems: CareerEvidenceItemView[];
  projectFitResults: ProjectFitResult[];
  draft: EvidenceDraft;
  setDraft: (draft: EvidenceDraft) => void;
  filter: { jdTestId: string; targetType: string; status: string };
  setFilter: (filter: { jdTestId: string; targetType: string; status: string }) => void;
  onLoad: () => void;
  onLoadProjectFit: () => void;
  onSave: () => void;
  onDelete: (id: string) => void;
  onExport: () => void;
  isPending: boolean;
}) {
  const targetOptions = draft.targetType === "skill" ? skills.map((skill) => ({ id: skill.id, label: `${skill.name} · ${skill.category}` })) : projects.map((project) => ({ id: project.id, label: `${project.name} · ${project.status}` }));
  const insufficientProjects = projectFitResults.filter((result) => result.fit_level === "insufficient_evidence");
  return (
    <section className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3 rounded-lg border border-line bg-surface p-4">
          <h2 className="text-base font-semibold">补充证据</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm font-medium">
              关联 JD
              <select
                value={draft.jdTestId}
                onChange={(event) => setDraft({ ...draft, jdTestId: event.target.value })}
                className="mt-1 h-10 w-full rounded-md border border-line bg-background px-3 text-sm"
              >
                <option value="">全局证据</option>
                {tests.map((test) => (
                  <option key={test.id} value={test.id}>
                    {test.company} · {test.role}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Target type
              <select
                value={draft.targetType}
                onChange={(event) => setDraft({ ...draft, targetType: event.target.value as CareerEvidenceTargetType, targetId: "" })}
                className="mt-1 h-10 w-full rounded-md border border-line bg-background px-3 text-sm"
              >
                <option value="project">project</option>
                <option value="skill">skill</option>
                <option value="bullet">bullet</option>
                <option value="work_experience">work_experience</option>
                <option value="education">education</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              Target
              <select
                value={draft.targetId}
                onChange={(event) => setDraft({ ...draft, targetId: event.target.value })}
                className="mt-1 h-10 w-full rounded-md border border-line bg-background px-3 text-sm"
              >
                <option value="">请选择</option>
                {targetOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Evidence type
              <select
                value={draft.evidenceType}
                onChange={(event) => setDraft({ ...draft, evidenceType: event.target.value as CareerEvidenceType })}
                className="mt-1 h-10 w-full rounded-md border border-line bg-background px-3 text-sm"
              >
                <option value="user_input">user_input · 人工补充</option>
                <option value="external_note">external_note · 外部笔记</option>
                <option value="wiki_project">wiki_project</option>
                <option value="wiki_workflow">wiki_workflow</option>
                <option value="wiki_changelog">wiki_changelog</option>
                <option value="baseline_resume">baseline_resume</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              Status
              <select
                value={draft.status}
                onChange={(event) => setDraft({ ...draft, status: event.target.value as CareerEvidenceStatus })}
                className="mt-1 h-10 w-full rounded-md border border-line bg-background px-3 text-sm"
              >
                <option value="draft">draft</option>
                <option value="verified">verified</option>
                <option value="rejected">rejected</option>
              </select>
            </label>
            <Input label="Confidence" value={String(draft.confidence)} onChange={(confidence) => setDraft({ ...draft, confidence: Number(confidence) || 0 })} />
          </div>
          <Input label="证据标题" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
          <Textarea label="证据内容" value={draft.content} onChange={(content) => setDraft({ ...draft, content })} rows={6} />
          <Input label="来源文件 / 路径" value={draft.sourcePath} onChange={(sourcePath) => setDraft({ ...draft, sourcePath })} />
          <Textarea label="来源摘录" value={draft.sourceExcerpt} onChange={(sourceExcerpt) => setDraft({ ...draft, sourceExcerpt })} rows={4} />
          <div className="flex flex-wrap gap-2">
            <ActionButton onClick={onSave} disabled={isPending || !draft.targetId || !draft.title || !draft.content} icon={Upload} label={draft.id ? "更新证据" : "保存证据"} />
            <ActionButton onClick={() => setDraft({ ...emptyEvidenceDraft, targetId: projects[0]?.id ?? "", jdTestId: filter.jdTestId })} disabled={isPending} icon={FileText} label="新建空白" variant="secondary" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-line bg-surface p-4">
            <h2 className="text-base font-semibold">筛选</h2>
            <label className="mt-3 block text-sm font-medium">
              JD
              <select
                value={filter.jdTestId}
                onChange={(event) => setFilter({ ...filter, jdTestId: event.target.value })}
                className="mt-1 h-10 w-full rounded-md border border-line bg-background px-3 text-sm"
              >
                <option value="">全部 JD</option>
                {tests.map((test) => (
                  <option key={test.id} value={test.id}>
                    {test.company} · {test.role}
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <label className="text-sm font-medium">
                Target type
                <select
                  value={filter.targetType}
                  onChange={(event) => setFilter({ ...filter, targetType: event.target.value })}
                  className="mt-1 h-10 w-full rounded-md border border-line bg-background px-3 text-sm"
                >
                  <option value="all">all</option>
                  <option value="project">project</option>
                  <option value="skill">skill</option>
                  <option value="bullet">bullet</option>
                  <option value="work_experience">work_experience</option>
                  <option value="education">education</option>
                </select>
              </label>
              <label className="text-sm font-medium">
                Status
                <select
                  value={filter.status}
                  onChange={(event) => setFilter({ ...filter, status: event.target.value })}
                  className="mt-1 h-10 w-full rounded-md border border-line bg-background px-3 text-sm"
                >
                  <option value="all">all</option>
                  <option value="draft">draft</option>
                  <option value="verified">verified</option>
                  <option value="rejected">rejected</option>
                </select>
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <ActionButton onClick={onLoad} disabled={isPending} icon={ListChecks} label="加载证据" variant="secondary" />
              <ActionButton onClick={onLoadProjectFit} disabled={isPending || !filter.jdTestId} icon={GitMerge} label="加载缺证据项目" variant="secondary" />
              <ActionButton onClick={onExport} disabled={isPending} icon={Download} label="导出 Evidence Report" />
            </div>
          </div>
          <PreviewList title="Insufficient Evidence Projects" items={insufficientProjects.map((result) => `${result.project_name} · evidence ${result.evidence_score} · ${result.exclusion_reason}`)} />
        </div>
      </div>

      <div className="grid gap-3">
        {evidenceItems.length ? (
          evidenceItems.map((item) => (
            <article key={item.id} className="rounded-lg border border-line bg-surface p-4">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">
                    {item.title} · {item.status}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.targetType} / {item.targetId} · {item.evidenceType} · confidence {item.confidence}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ActionButton onClick={() => setDraft({ ...item })} disabled={isPending} icon={FileText} label="编辑" variant="secondary" />
                  <ActionButton onClick={() => onDelete(item.id)} disabled={isPending} icon={FileText} label="删除" variant="secondary" />
                </div>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <ListBlock title="Evidence content" items={[item.content]} />
                <ListBlock title="Source" items={[item.sourcePath || "manual_input", item.sourceExcerpt || "暂无摘录"]} />
              </div>
            </article>
          ))
        ) : (
          <PreviewList title="证据列表" items={[]} />
        )}
      </div>
    </section>
  );
}

function ProjectFitPanel({
  tests,
  results,
  selectedJdId,
  setSelectedJdId,
  overrides,
  setOverrides,
  onLoad,
  onRun,
  onOverride,
  isPending,
}: {
  tests: CareerJdTestView[];
  results: ProjectFitResult[];
  selectedJdId: string;
  setSelectedJdId: (id: string) => void;
  overrides: Record<string, { overrideType: ProjectFitOverrideType; overrideReason: string }>;
  setOverrides: (drafts: Record<string, { overrideType: ProjectFitOverrideType; overrideReason: string }>) => void;
  onLoad: (jdTestId?: string) => void;
  onRun: (exportReport?: boolean) => void;
  onOverride: (resultId: string) => void;
  isPending: boolean;
}) {
  const selected = tests.find((test) => test.id === selectedJdId);
  const grouped = {
    primary: results.filter((result) => result.recommended_resume_usage === "primary_project"),
    supporting: results.filter((result) => result.recommended_resume_usage === "supporting_project"),
    blocked: results.filter((result) => result.recommended_resume_usage === "do_not_use" || result.fit_level === "insufficient_evidence"),
  };
  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-line bg-surface p-4">
        <h2 className="text-base font-semibold">Step 1 · 选择 JD test</h2>
        <select
          value={selectedJdId}
          onChange={(event) => setSelectedJdId(event.target.value)}
          className="mt-3 h-10 w-full rounded-md border border-line bg-background px-3 text-sm"
        >
          <option value="">请选择 JD</option>
          {tests.map((test) => (
            <option key={test.id} value={test.id}>
              {test.company} · {test.role} · {test.targetDirection}
            </option>
          ))}
        </select>
        <p className="mt-2 text-sm text-muted-foreground">
          {selected ? `当前方向：${selected.targetDirection || selected.role}` : "运行分类前需要先保存 JD test。"}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <ActionButton onClick={() => onLoad(selectedJdId)} disabled={isPending || !selectedJdId} icon={ListChecks} label="加载已有结果" variant="secondary" />
          <ActionButton onClick={() => onRun(false)} disabled={isPending || !selectedJdId} icon={Play} label="运行项目匹配" />
          <ActionButton onClick={() => onRun(true)} disabled={isPending || !selectedJdId} icon={Download} label="运行并导出报告" variant="secondary" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <PreviewList title="Primary Project" items={grouped.primary.map((result) => `${result.project_name} · ${result.fit_score}`)} />
        <PreviewList title="Supporting Project" items={grouped.supporting.map((result) => `${result.project_name} · ${result.fit_score}`)} />
        <PreviewList title="Blocked / Insufficient" items={grouped.blocked.map((result) => `${result.project_name} · ${result.fit_level}`)} />
      </div>

      <div className="space-y-3">
        {results.length ? (
          results.map((result) => {
            const draft = overrides[result.id ?? ""] ?? { overrideType: "needs_review" as ProjectFitOverrideType, overrideReason: "" };
            return (
              <article key={`${result.project_id}-${result.id ?? "preview"}`} className="rounded-lg border border-line bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold">
                      {result.project_name} · {result.fit_level}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      usage: {result.recommended_resume_usage} · fit {result.fit_score} · keyword {result.keyword_score} · evidence {result.evidence_score} · domain {result.domain_score} · risk {result.risk_score}
                    </p>
                  </div>
                  {result.override_type ? (
                    <span className="rounded-md border border-line px-2 py-1 text-xs text-muted-foreground">
                      override: {result.override_type}
                    </span>
                  ) : null}
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <ListBlock title="Matched JD requirements" items={result.matched_jd_requirements} />
                  <ListBlock title="Missing JD requirements" items={result.missing_jd_requirements} />
                  <ListBlock title="Supporting evidence" items={result.supporting_evidence} />
                  <ListBlock title="Risk warnings" items={result.risk_warnings} />
                  <ListBlock title="Suggested bullets" items={result.suggested_bullets} />
                  <ListBlock title="Exclusion reason" items={result.exclusion_reason ? [result.exclusion_reason] : []} />
                </div>
                {result.id ? (
                  <div className="mt-4 grid gap-2 rounded-md border border-line bg-background p-3 md:grid-cols-[180px_1fr_auto]">
                    <select
                      value={draft.overrideType}
                      onChange={(event) =>
                        setOverrides({
                          ...overrides,
                          [result.id as string]: { ...draft, overrideType: event.target.value as ProjectFitOverrideType },
                        })
                      }
                      className="h-10 rounded-md border border-line bg-surface px-3 text-sm"
                    >
                      <option value="needs_review">needs_review</option>
                      <option value="force_include">force_include</option>
                      <option value="force_exclude">force_exclude</option>
                    </select>
                    <input
                      value={draft.overrideReason}
                      onChange={(event) =>
                        setOverrides({
                          ...overrides,
                          [result.id as string]: { ...draft, overrideReason: event.target.value },
                        })
                      }
                      className="h-10 rounded-md border border-line bg-surface px-3 text-sm"
                      placeholder="Override reason，必须填写"
                    />
                    <ActionButton onClick={() => onOverride(result.id as string)} disabled={isPending} icon={ListChecks} label="保存 override" variant="secondary" />
                  </div>
                ) : null}
              </article>
            );
          })
        ) : (
          <PreviewList title="项目匹配结果" items={[]} />
        )}
      </div>
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
            <ListBlock title={`${selectedVersion.versionName} · ${labelForStatus(selectedVersion.status)}`} items={[`${selectedVersion.company} · ${selectedVersion.role}`]} />
            <ListBlock
              title="导出前检查清单"
              items={selectedVersion.checklist.map((item) => `${item.passed ? "通过" : "阻断"} · ${item.label}${item.reason ? `：${item.reason}` : ""}`)}
            />
            <ListBlock title="Diff" items={selectedVersion.diffSummary.projectBullets.slice(0, 6)} />
            <ListBlock title="证据校验" items={selectedVersion.evidenceSummary.map((item) => `${item.valid ? "通过" : "阻断"} · ${item.section} · ${item.evidenceSource}`)} />
            <div className="flex flex-wrap gap-2 lg:col-span-2">
              <ActionButton onClick={() => onApprove(selectedVersion.id)} disabled={isPending || selectedVersion.status !== "draft"} icon={ListChecks} label="确认为已批准" />
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

      <PreviewList title="历史版本" items={versions.slice(0, 8).map((version) => `${version.versionName} · ${labelForStatus(version.status)} · ${version.company} · ${version.role}`)} />
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
  selectedTemplate,
  setSelectedTemplate,
  isPending,
}: {
  versions: CareerResumeVersionView[];
  selectedVersionId: string;
  setSelectedVersionId: (id: string) => void;
  onApprove: (id: string) => void;
  onArchive: (id: string) => void;
  onExport: (id: string) => void;
  onRender: (id: string, format: "markdown" | "html", template?: ResumeTemplateId) => void;
  onExportFormat: (id: string, format: "markdown" | "json" | "html" | "docx" | "pdf") => void;
  renderPreview: { format: "markdown" | "html"; content: string; template: ResumeTemplateId } | null;
  selectedTemplate: ResumeTemplateId;
  setSelectedTemplate: (template: ResumeTemplateId) => void;
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
        labelOf={(version) => `${version.versionName} · ${labelForStatus(version.status)} · ${version.company} · ${version.role}`}
      />
      {selected ? (
        <article className="rounded-lg border border-line bg-surface p-4">
          <h2 className="text-base font-semibold">
            {selected.versionName} · {selected.company} · {selected.role}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">状态：{labelForStatus(selected.status)} · {selected.status}</p>
          <div className="mt-3 grid gap-2 rounded-md border border-line bg-background p-3">
            <label className="text-sm font-medium">
              简历模板
              <select
                value={selectedTemplate}
                onChange={(event) => {
                  const template = event.target.value as ResumeTemplateId;
                  setSelectedTemplate(template);
                  onRender(selected.id, "html", template);
                }}
                className="mt-1 h-10 w-full rounded-md border border-line bg-surface px-3 text-sm"
              >
                <option value="modern">modern · 视觉增强</option>
                <option value="ats">ats · ATS 保守结构</option>
                <option value="compact">compact · 高信息密度</option>
              </select>
            </label>
            <Link
              href={`/career-wiki/resume-versions/${selected.id}/preview?template=${selectedTemplate}`}
              className="inline-flex min-h-9 w-fit items-center rounded-md border border-line px-3 text-sm hover:bg-surface-low"
            >
              打开独立预览页
            </Link>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <ActionButton onClick={() => onApprove(selected.id)} disabled={isPending || selected.status !== "draft"} icon={ListChecks} label="标记已批准" />
            <ActionButton onClick={() => onArchive(selected.id)} disabled={isPending || selected.status === "archived"} icon={FileText} label="归档" variant="secondary" />
            <ActionButton
              onClick={() => onExport(selected.id)}
              disabled={isPending || !canExport}
              icon={Download}
              label="导出 Markdown + 审核报告"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <ActionButton onClick={() => onRender(selected.id, "markdown", selectedTemplate)} disabled={isPending} icon={FileText} label="预览 Markdown" variant="secondary" />
            <ActionButton onClick={() => onRender(selected.id, "html", selectedTemplate)} disabled={isPending} icon={FileText} label="预览 HTML" variant="secondary" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["markdown", "json", "html", "docx", "pdf"] as const).map((format) => (
              <ActionButton
                key={format}
                onClick={() => onExportFormat(selected.id, format)}
                disabled={isPending || !canExport}
                icon={Download}
                label={`导出 ${format.toUpperCase()}`}
                variant="secondary"
              />
            ))}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <ListBlock title="导出前检查清单" items={selected.checklist.map((item) => `${item.passed ? "通过" : "阻断"} · ${item.label}${item.reason ? `：${item.reason}` : ""}`)} />
            <ListBlock title="风险提示" items={selected.riskNotes} />
            <ListBlock title="Diff · Project Bullets" items={selected.diffSummary.projectBullets} />
            <ListBlock title="证据校验" items={selected.evidenceSummary.map((item) => `${item.valid ? "通过" : "阻断"} · ${item.content}`)} />
          </div>
          {renderPreview ? (
            <div className="mt-4 rounded-md border border-line bg-background p-3">
              <h3 className="text-sm font-medium">
                {renderPreview.format.toUpperCase()} 预览 · {renderPreview.template}
              </h3>
              {renderPreview.format === "html" ? (
                <iframe title="HTML resume preview" srcDoc={renderPreview.content} className="mt-2 h-[640px] w-full rounded-md border border-line bg-white" />
              ) : (
                <pre className="mt-2 max-h-[640px] overflow-auto whitespace-pre-wrap text-xs">{renderPreview.content}</pre>
              )}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">点击预览生成 Markdown 或 HTML；草稿可以预览，但不能导出 final。</p>
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
