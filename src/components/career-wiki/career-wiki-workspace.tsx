"use client";

import Link from "next/link";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";
import { ArrowLeft, BookOpen, CheckCircle2, Download, Edit3, FolderKanban, GraduationCap, ListChecks, Sparkles } from "lucide-react";

import type {
  CareerJdAnalysisView,
  CareerLearningTaskStatus,
  CareerLearningTaskView,
  CareerProfileView,
  CareerProjectView,
  CareerSkillView,
  CareerWikiData,
} from "@/lib/career-wiki/types";
import { cn } from "@/lib/utils";

export type CareerWikiSection = "profile" | "projects" | "skills" | "jd-analyzer" | "learning-tasks";

type ProjectDraft = Omit<CareerProjectView, "id" | "updatedAt"> & { id?: string };
type SkillDraft = Omit<CareerSkillView, "id" | "updatedAt"> & { id?: string };
type JdDraft = { company: string; role: string; source: string; jdText: string };

const navItems: Array<{ section: CareerWikiSection; label: string; icon: typeof BookOpen }> = [
  { section: "profile", label: "个人画像", icon: BookOpen },
  { section: "projects", label: "项目素材库", icon: FolderKanban },
  { section: "skills", label: "技能矩阵", icon: GraduationCap },
  { section: "jd-analyzer", label: "JD 分析", icon: Sparkles },
  { section: "learning-tasks", label: "学习任务", icon: ListChecks },
];

export function CareerWikiWorkspace({
  initialSection,
  initialData,
}: {
  initialSection: CareerWikiSection;
  initialData: CareerWikiData;
}) {
  const [data, setData] = useState(initialData);
  const [status, setStatus] = useState("");
  const [isPending, startTransition] = useTransition();

  const [profileDraft, setProfileDraft] = useState(initialData.profile);
  const [projectDraft, setProjectDraft] = useState<ProjectDraft>(emptyProjectDraft());
  const [skillDraft, setSkillDraft] = useState<SkillDraft>(emptySkillDraft());
  const [jdDraft, setJdDraft] = useState<JdDraft>({ company: "", role: "", source: "manual", jdText: "" });
  const latestAnalysis = data.jdAnalyses[0];
  const [selectedAnalysisId, setSelectedAnalysisId] = useState(latestAnalysis?.id ?? "");

  const selectedAnalysis = useMemo(
    () => data.jdAnalyses.find((analysis) => analysis.id === selectedAnalysisId) ?? latestAnalysis,
    [data.jdAnalyses, latestAnalysis, selectedAnalysisId],
  );
  const selectedTasks = selectedAnalysis
    ? data.learningTasks.filter((task) => task.jdAnalysisId === selectedAnalysis.id).sort((left, right) => left.dayIndex - right.dayIndex)
    : [];

  async function refresh() {
    const next = await requestJson<CareerWikiData>("/api/career-wiki");
    setData(next);
    if (!selectedAnalysisId && next.jdAnalyses[0]) setSelectedAnalysisId(next.jdAnalyses[0].id);
    return next;
  }

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      try {
        const result = await requestJson<{ profile: CareerProfileView }>("/api/career-wiki/profile", profileDraft, "PUT");
        setProfileDraft(result.profile);
        await refresh();
        setStatus("个人画像已保存。");
      } catch (error) {
        setStatus(formatError(error));
      }
    });
  }

  function saveProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      try {
        await requestJson<{ project: CareerProjectView }>(
          "/api/career-wiki/projects",
          projectDraft,
          projectDraft.id ? "PATCH" : "POST",
        );
        setProjectDraft(emptyProjectDraft());
        await refresh();
        setStatus("项目素材已保存。");
      } catch (error) {
        setStatus(formatError(error));
      }
    });
  }

  function saveSkill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      try {
        await requestJson<{ skill: CareerSkillView }>("/api/career-wiki/skills", skillDraft, skillDraft.id ? "PATCH" : "POST");
        setSkillDraft(emptySkillDraft());
        await refresh();
        setStatus("技能已保存。");
      } catch (error) {
        setStatus(formatError(error));
      }
    });
  }

  function analyzeJd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      try {
        const result = await requestJson<{ analysis: CareerJdAnalysisView }>("/api/career-wiki/jd-analyses", jdDraft, "POST");
        setSelectedAnalysisId(result.analysis.id);
        await refresh();
        setStatus("JD 分析已生成。");
      } catch (error) {
        setStatus(formatError(error));
      }
    });
  }

  function generateTasks() {
    if (!selectedAnalysis) {
      setStatus("请先生成一份 JD 分析。");
      return;
    }
    startTransition(async () => {
      try {
        await requestJson<{ tasks: CareerLearningTaskView[] }>(
          "/api/career-wiki/learning-tasks/generate",
          { jdAnalysisId: selectedAnalysis.id },
          "POST",
        );
        await refresh();
        setStatus("7 天学习任务已生成。");
      } catch (error) {
        setStatus(formatError(error));
      }
    });
  }

  function updateTaskStatus(id: string, nextStatus: CareerLearningTaskStatus) {
    startTransition(async () => {
      try {
        await requestJson<{ task: CareerLearningTaskView }>("/api/career-wiki/learning-tasks", { id, status: nextStatus }, "PATCH");
        await refresh();
        setStatus("任务状态已更新。");
      } catch (error) {
        setStatus(formatError(error));
      }
    });
  }

  function exportToObsidian() {
    startTransition(async () => {
      try {
        const result = await requestJson<{ configured: boolean; message: string; files: string[] }>("/api/career-wiki/export", {}, "POST");
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
          <Link href="/" className="mb-5 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
            返回 LuJie CareerKit
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
          <header className="flex flex-col gap-3 border-b border-line pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Career Wiki Agent MVP</p>
              <h1 className="mt-2 text-2xl font-semibold">{sectionTitle(initialSection)}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                本模块只处理个人知识库、项目素材、技能矩阵、JD 分析、学习任务和 Obsidian 导出，不包含自动投递或招聘平台自动化。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/career-wiki/resume-tailor"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-line bg-surface px-4 text-sm font-medium hover:bg-surface-low"
              >
                <Sparkles className="size-4" />
                简历测试
              </Link>
              <button
                type="button"
                onClick={exportToObsidian}
                disabled={isPending}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                <Download className="size-4" />
                导出到 Obsidian
              </button>
            </div>
          </header>

          {!data.vaultConfigured ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              未配置 CAREER_VAULT_PATH。基础编辑和分析可用；配置后才能导出到 Obsidian。
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

          {initialSection === "profile" && (
            <ProfilePanel profileDraft={profileDraft} setProfileDraft={setProfileDraft} onSubmit={saveProfile} isPending={isPending} />
          )}
          {initialSection === "projects" && (
            <ProjectsPanel
              projects={data.projects}
              draft={projectDraft}
              setDraft={setProjectDraft}
              onSubmit={saveProject}
              isPending={isPending}
            />
          )}
          {initialSection === "skills" && (
            <SkillsPanel skills={data.skills} draft={skillDraft} setDraft={setSkillDraft} onSubmit={saveSkill} isPending={isPending} />
          )}
          {initialSection === "jd-analyzer" && (
            <JdPanel
              draft={jdDraft}
              setDraft={setJdDraft}
              analyses={data.jdAnalyses}
              onSubmit={analyzeJd}
              isPending={isPending}
            />
          )}
          {initialSection === "learning-tasks" && (
            <LearningTasksPanel
              analyses={data.jdAnalyses}
              selectedAnalysis={selectedAnalysis}
              selectedAnalysisId={selectedAnalysis?.id ?? ""}
              setSelectedAnalysisId={setSelectedAnalysisId}
              tasks={selectedTasks}
              onGenerate={generateTasks}
              onUpdateStatus={updateTaskStatus}
              isPending={isPending}
            />
          )}
        </section>
      </div>
    </main>
  );
}

function ProfilePanel({
  profileDraft,
  setProfileDraft,
  onSubmit,
  isPending,
}: {
  profileDraft: CareerProfileView;
  setProfileDraft: (draft: CareerProfileView) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
}) {
  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-lg border border-line bg-surface p-4 md:grid-cols-2">
      <TextField label="姓名" value={profileDraft.name} onChange={(name) => setProfileDraft({ ...profileDraft, name })} />
      <TextField
        label="当前职位"
        value={profileDraft.currentPosition}
        onChange={(currentPosition) => setProfileDraft({ ...profileDraft, currentPosition })}
      />
      <TextAreaField
        label="目标岗位"
        value={profileDraft.targetRoles.join("\n")}
        onChange={(targetRoles) => setProfileDraft({ ...profileDraft, targetRoles: splitLines(targetRoles) })}
      />
      <TextAreaField label="教育背景" value={profileDraft.education} onChange={(education) => setProfileDraft({ ...profileDraft, education })} />
      <TextAreaField
        label="个人总结"
        value={profileDraft.summary}
        onChange={(summary) => setProfileDraft({ ...profileDraft, summary })}
        className="md:col-span-2"
      />
      <TextAreaField
        label="优势"
        value={profileDraft.strengths.join("\n")}
        onChange={(strengths) => setProfileDraft({ ...profileDraft, strengths: splitLines(strengths) })}
      />
      <TextAreaField
        label="短板"
        value={profileDraft.weaknesses.join("\n")}
        onChange={(weaknesses) => setProfileDraft({ ...profileDraft, weaknesses: splitLines(weaknesses) })}
      />
      <FormActions disabled={isPending} label="保存个人画像" />
    </form>
  );
}

function ProjectsPanel({
  projects,
  draft,
  setDraft,
  onSubmit,
  isPending,
}: {
  projects: CareerProjectView[];
  draft: ProjectDraft;
  setDraft: (draft: ProjectDraft) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-line bg-surface p-4">
        <TextField label="项目名称" value={draft.name} onChange={(name) => setDraft({ ...draft, name })} required />
        <TextField label="状态" value={draft.status} onChange={(status) => setDraft({ ...draft, status })} />
        <TextAreaField label="项目描述" value={draft.description} onChange={(description) => setDraft({ ...draft, description })} />
        <TextAreaField label="技术栈" value={draft.techStack.join("\n")} onChange={(techStack) => setDraft({ ...draft, techStack: splitLines(techStack) })} />
        <TextAreaField label="亮点" value={draft.highlights.join("\n")} onChange={(highlights) => setDraft({ ...draft, highlights: splitLines(highlights) })} />
        <TextAreaField
          label="简历 bullet"
          value={draft.resumeBullets.join("\n")}
          onChange={(resumeBullets) => setDraft({ ...draft, resumeBullets: splitLines(resumeBullets) })}
        />
        <TextAreaField label="面试故事" value={draft.interviewStory} onChange={(interviewStory) => setDraft({ ...draft, interviewStory })} />
        <FormActions disabled={isPending} label={draft.id ? "更新项目" : "新增项目"} onReset={() => setDraft(emptyProjectDraft())} />
      </form>
      <CardList empty="还没有项目素材。">
        {projects.map((project) => (
          <article key={project.id} className="rounded-lg border border-line bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">{project.name}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{project.status}</p>
              </div>
              <button type="button" onClick={() => setDraft(project)} className="rounded-md border border-line p-2 hover:bg-surface-low">
                <Edit3 className="size-4" />
              </button>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{project.description || "未填写描述"}</p>
            <TagRow items={project.techStack} />
            <ListBlock title="亮点" items={project.highlights} />
          </article>
        ))}
      </CardList>
    </div>
  );
}

function SkillsPanel({
  skills,
  draft,
  setDraft,
  onSubmit,
  isPending,
}: {
  skills: CareerSkillView[];
  draft: SkillDraft;
  setDraft: (draft: SkillDraft) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-line bg-surface p-4">
        <TextField label="技能名称" value={draft.name} onChange={(name) => setDraft({ ...draft, name })} required />
        <TextField label="分类" value={draft.category} onChange={(category) => setDraft({ ...draft, category })} />
        <TextField label="等级" value={draft.level} onChange={(level) => setDraft({ ...draft, level })} />
        <TextField label="学习优先级" value={draft.learningPriority} onChange={(learningPriority) => setDraft({ ...draft, learningPriority })} />
        <TextAreaField label="证据" value={draft.evidence} onChange={(evidence) => setDraft({ ...draft, evidence })} />
        <FormActions disabled={isPending} label={draft.id ? "更新技能" : "新增技能"} onReset={() => setDraft(emptySkillDraft())} />
      </form>
      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-surface-low text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2">技能</th>
              <th className="px-3 py-2">分类</th>
              <th className="px-3 py-2">等级</th>
              <th className="px-3 py-2">优先级</th>
              <th className="px-3 py-2">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {skills.map((skill) => (
              <tr key={skill.id}>
                <td className="px-3 py-3 font-medium">{skill.name}</td>
                <td className="px-3 py-3">{skill.category}</td>
                <td className="px-3 py-3">{skill.level}</td>
                <td className="px-3 py-3">{skill.learningPriority}</td>
                <td className="px-3 py-3">
                  <button type="button" onClick={() => setDraft(skill)} className="text-primary hover:underline">
                    编辑
                  </button>
                </td>
              </tr>
            ))}
            {!skills.length ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  还没有技能记录。
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function JdPanel({
  draft,
  setDraft,
  analyses,
  onSubmit,
  isPending,
}: {
  draft: JdDraft;
  setDraft: (draft: JdDraft) => void;
  analyses: CareerJdAnalysisView[];
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-line bg-surface p-4">
        <TextField label="公司" value={draft.company} onChange={(company) => setDraft({ ...draft, company })} required />
        <TextField label="岗位" value={draft.role} onChange={(role) => setDraft({ ...draft, role })} required />
        <TextField label="来源" value={draft.source} onChange={(source) => setDraft({ ...draft, source })} />
        <TextAreaField label="JD 文本" value={draft.jdText} onChange={(jdText) => setDraft({ ...draft, jdText })} className="min-h-64" required />
        <FormActions disabled={isPending} label="生成 JD 分析" />
      </form>
      <CardList empty="还没有 JD 分析。">
        {analyses.map((analysis) => (
          <article key={analysis.id} className="rounded-lg border border-line bg-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">{analysis.company} - {analysis.role}</h2>
                <p className="mt-1 text-xs text-muted-foreground">匹配分 {analysis.matchScore} · {analysis.source}</p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">{analysis.matchScore}</span>
            </div>
            <ListBlock title="职责" items={analysis.responsibilities} />
            <ListBlock title="技能要求" items={analysis.requiredSkills} />
            <ListBlock title="技能缺口" items={analysis.skillGaps} />
            <ListBlock title="简历建议" items={analysis.resumeSuggestions} />
          </article>
        ))}
      </CardList>
    </div>
  );
}

function LearningTasksPanel({
  analyses,
  selectedAnalysis,
  selectedAnalysisId,
  setSelectedAnalysisId,
  tasks,
  onGenerate,
  onUpdateStatus,
  isPending,
}: {
  analyses: CareerJdAnalysisView[];
  selectedAnalysis?: CareerJdAnalysisView;
  selectedAnalysisId: string;
  setSelectedAnalysisId: (id: string) => void;
  tasks: CareerLearningTaskView[];
  onGenerate: () => void;
  onUpdateStatus: (id: string, status: CareerLearningTaskStatus) => void;
  isPending: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 md:flex-row md:items-end">
        <label className="flex-1 text-sm font-medium">
          选择 JD 分析
          <select
            value={selectedAnalysisId}
            onChange={(event) => setSelectedAnalysisId(event.target.value)}
            className="mt-2 min-h-10 w-full rounded-md border border-line bg-background px-3"
          >
            {analyses.map((analysis) => (
              <option key={analysis.id} value={analysis.id}>
                {analysis.company} - {analysis.role}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={onGenerate}
          disabled={isPending || !selectedAnalysis}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          <CheckCircle2 className="size-4" />
          生成 7 天任务
        </button>
      </div>
      <CardList empty="还没有学习任务，请先生成 JD 分析和学习计划。">
        {tasks.map((task) => (
          <article key={task.id} className="grid gap-3 rounded-lg border border-line bg-surface p-4 md:grid-cols-[80px_minmax(0,1fr)_160px]">
            <div className="text-sm font-semibold text-primary">Day {task.dayIndex}</div>
            <div>
              <h2 className="font-semibold">{task.title}</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{task.description}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {task.relatedSkill} · {task.priority} · {task.estimatedTime} · 输出：{task.outputRequired}
              </p>
            </div>
            <select
              value={task.status}
              onChange={(event) => onUpdateStatus(task.id, event.target.value as CareerLearningTaskStatus)}
              className="min-h-10 rounded-md border border-line bg-background px-3 text-sm"
            >
              <option value="todo">todo</option>
              <option value="doing">doing</option>
              <option value="done">done</option>
            </select>
          </article>
        ))}
      </CardList>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-10 w-full rounded-md border border-line bg-background px-3 text-sm"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  className,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
}) {
  return (
    <label className={cn("block text-sm font-medium", className)}>
      {label}
      <textarea
        value={value}
        required={required}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
        className="mt-2 min-h-28 w-full rounded-md border border-line bg-background px-3 py-2 text-sm leading-6"
      />
    </label>
  );
}

function FormActions({ disabled, label, onReset }: { disabled: boolean; label: string; onReset?: () => void }) {
  return (
    <div className="flex gap-2 md:col-span-2">
      <button
        type="submit"
        disabled={disabled}
        className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {label}
      </button>
      {onReset ? (
        <button type="button" onClick={onReset} className="min-h-10 rounded-md border border-line px-4 text-sm font-medium hover:bg-surface-low">
          清空
        </button>
      ) : null}
    </div>
  );
}

function CardList({ empty, children }: { empty: string; children: ReactNode }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children;
  const isEmpty = Array.isArray(items) ? items.length === 0 : !items;
  return (
    <div className="space-y-3">
      {isEmpty ? <div className="rounded-lg border border-line bg-surface p-6 text-sm text-muted-foreground">{empty}</div> : items}
    </div>
  );
}

function TagRow({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className="rounded-full bg-surface-low px-2.5 py-1 text-xs text-muted-foreground">
          {item}
        </span>
      ))}
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-4">
      <h3 className="text-xs font-semibold text-muted-foreground">{title}</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

async function requestJson<T>(url: string, body?: unknown, method = "GET"): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = (await response.json().catch(() => null)) as (T & { message?: string }) | null;
  if (!response.ok) throw new Error(payload?.message ?? response.statusText);
  if (!payload) throw new Error("响应为空");
  return payload;
}

function splitLines(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function emptyProjectDraft(): ProjectDraft {
  return { name: "", status: "active", description: "", techStack: [], highlights: [], resumeBullets: [], interviewStory: "" };
}

function emptySkillDraft(): SkillDraft {
  return { name: "", category: "general", level: "learning", evidence: "", learningPriority: "medium" };
}

function sectionTitle(section: CareerWikiSection) {
  const item = navItems.find((navItem) => navItem.section === section);
  return item?.label ?? "Career Wiki";
}

function formatError(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  return "操作失败，请稍后重试。";
}
