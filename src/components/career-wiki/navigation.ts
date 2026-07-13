import {
  Activity,
  Archive,
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  FileInput,
  FileText,
  FolderKanban,
  Gauge,
  GitBranch,
  GitMerge,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRound,
  WandSparkles,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

export type CareerWikiRouteKey =
  | "quick-start"
  | "dashboard"
  | "workflow"
  | "jd-import"
  | "jd-analyzer"
  | "wiki-import"
  | "resume-baseline"
  | "project-fit"
  | "evidence-editor"
  | "evidence-review"
  | "resume-tailor"
  | "resume-versions"
  | "resume-tests"
  | "learning-tasks"
  | "profile"
  | "projects"
  | "skills"
  | "audit"
  | "health";

export type CareerWikiNavItem = {
  key: CareerWikiRouteKey;
  label: string;
  technicalLabel?: string;
  description: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export type CareerWikiNavGroup = {
  label: string;
  items: CareerWikiNavItem[];
};

export const careerWikiNavGroups: CareerWikiNavGroup[] = [
  {
    label: "开始",
    items: [
      {
        key: "quick-start",
        label: "一键生成",
        technicalLabel: "Quick Start",
        description: "选择简历和 JD，一次生成匹配结果与简历草稿",
        href: "/career-wiki/quick-start",
        icon: WandSparkles,
      },
    ],
  },
  {
    label: "总览",
    items: [
      {
        key: "dashboard",
        label: "总览",
        technicalLabel: "Dashboard",
        description: "查看系统状态、风险和下一步动作",
        href: "/career-wiki/dashboard",
        icon: LayoutDashboard,
      },
      {
        key: "workflow",
        label: "求职流程",
        technicalLabel: "Workflow",
        description: "查看 JD 到导出的状态机进度",
        href: "/career-wiki/workflow",
        icon: GitBranch,
      },
    ],
  },
  {
    label: "输入",
    items: [
      {
        key: "jd-import",
        label: "JD 导入",
        technicalLabel: "JD Import",
        description: "上传或粘贴 JD",
        href: "/career-wiki/jd-import",
        icon: Upload,
      },
      {
        key: "jd-analyzer",
        label: "JD 分析",
        technicalLabel: "JD Analyzer",
        description: "手动输入并分析 JD",
        href: "/career-wiki/jd-analyzer",
        icon: Sparkles,
      },
      {
        key: "wiki-import",
        label: "Wiki 导入",
        technicalLabel: "Wiki Import",
        description: "从本地 Wiki 导入项目与技能",
        href: "/career-wiki/wiki-import",
        icon: FileInput,
      },
      {
        key: "resume-baseline",
        label: "基准简历",
        technicalLabel: "Baseline Resume",
        description: "导入 Markdown 基准简历",
        href: "/career-wiki/resume-baseline",
        icon: FileText,
      },
    ],
  },
  {
    label: "匹配与证据",
    items: [
      {
        key: "project-fit",
        label: "项目匹配",
        technicalLabel: "Project Fit",
        description: "判断项目是否匹配 JD",
        href: "/career-wiki/project-fit",
        icon: GitMerge,
      },
      {
        key: "evidence-editor",
        label: "证据中心",
        technicalLabel: "Evidence Editor",
        description: "补充、验证或拒绝证据",
        href: "/career-wiki/evidence-editor",
        icon: ShieldCheck,
      },
      {
        key: "evidence-review",
        label: "证据审核",
        technicalLabel: "Evidence Review",
        description: "处理高风险证据问题",
        href: "/career-wiki/evidence-review",
        icon: ClipboardCheck,
      },
    ],
  },
  {
    label: "简历",
    items: [
      {
        key: "resume-tailor",
        label: "简历工作台",
        technicalLabel: "Resume Tailor",
        description: "生成、校验并批准定制简历",
        href: "/career-wiki/resume-tailor",
        icon: ClipboardList,
      },
      {
        key: "resume-versions",
        label: "导出与版本",
        technicalLabel: "Resume Versions",
        description: "预览、选择模板并导出",
        href: "/career-wiki/resume-versions",
        icon: Archive,
      },
      {
        key: "resume-tests",
        label: "测试集",
        technicalLabel: "JD Tests",
        description: "管理 JD 测试运行",
        href: "/career-wiki/resume-tests",
        icon: ListChecks,
      },
      {
        key: "learning-tasks",
        label: "学习任务",
        technicalLabel: "Learning Tasks",
        description: "生成和维护学习计划",
        href: "/career-wiki/learning-tasks",
        icon: GraduationCap,
      },
    ],
  },
  {
    label: "知识库",
    items: [
      {
        key: "profile",
        label: "个人画像",
        technicalLabel: "Profile",
        description: "维护目标岗位和个人总结",
        href: "/career-wiki/profile",
        icon: UserRound,
      },
      {
        key: "projects",
        label: "项目素材库",
        technicalLabel: "Project Bank",
        description: "维护项目亮点和简历 bullet",
        href: "/career-wiki/projects",
        icon: FolderKanban,
      },
      {
        key: "skills",
        label: "技能矩阵",
        technicalLabel: "Skill Matrix",
        description: "维护技能分类和学习优先级",
        href: "/career-wiki/skills",
        icon: BookOpen,
      },
    ],
  },
  {
    label: "运维",
    items: [
      {
        key: "audit",
        label: "审计日志",
        technicalLabel: "Audit Log",
        description: "追踪关键动作和原因",
        href: "/career-wiki/audit",
        icon: ScrollText,
      },
      {
        key: "health",
        label: "运维健康",
        technicalLabel: "Health",
        description: "查看健康检查和完整性状态",
        href: "/career-wiki/dashboard#health",
        icon: Activity,
      },
    ],
  },
];

export const careerWikiNavItems = careerWikiNavGroups.flatMap((group) => group.items);

const primaryRouteKeys: CareerWikiRouteKey[] = ["quick-start", "resume-versions", "learning-tasks"];

export const careerWikiPrimaryNavItems = careerWikiNavItems.filter((item) => primaryRouteKeys.includes(item.key));
export const careerWikiAdvancedNavGroups = careerWikiNavGroups
  .map((group) => ({ ...group, items: group.items.filter((item) => !primaryRouteKeys.includes(item.key)) }))
  .filter((group) => group.items.length > 0);

export function getCareerWikiNavItem(key: CareerWikiRouteKey) {
  return careerWikiNavItems.find((item) => item.key === key);
}

export function routeKeyFromPath(pathname: string): CareerWikiRouteKey {
  if (pathname.includes("/quick-start")) return "quick-start";
  if (pathname.includes("/workflow")) return "workflow";
  if (pathname.includes("/jd-import")) return "jd-import";
  if (pathname.includes("/jd-analyzer")) return "jd-analyzer";
  if (pathname.includes("/wiki-import")) return "wiki-import";
  if (pathname.includes("/resume-baseline")) return "resume-baseline";
  if (pathname.includes("/project-fit")) return "project-fit";
  if (pathname.includes("/evidence-editor")) return "evidence-editor";
  if (pathname.includes("/evidence-review")) return "evidence-review";
  if (pathname.includes("/resume-tailor")) return "resume-tailor";
  if (pathname.includes("/resume-versions")) return "resume-versions";
  if (pathname.includes("/resume-tests")) return "resume-tests";
  if (pathname.includes("/learning-tasks")) return "learning-tasks";
  if (pathname.includes("/profile")) return "profile";
  if (pathname.includes("/projects")) return "projects";
  if (pathname.includes("/skills")) return "skills";
  if (pathname.includes("/audit")) return "audit";
  return "dashboard";
}

export function labelForWorkflowState(value: string) {
  const labels: Record<string, string> = {
    profile_ready: "个人画像就绪",
    projects_ready: "项目素材就绪",
    skills_ready: "技能矩阵就绪",
    jd_imported: "JD 已导入",
    project_fit_reviewed: "项目匹配已审核",
    evidence_reviewed: "证据已审核",
    resume_drafted: "简历草稿已生成",
    diff_reviewed: "Diff 已审核",
    resume_approved: "简历已批准",
    exported: "已导出",
    archived: "已归档",
  };
  return labels[value] ?? value;
}

export function labelForStatus(value: string) {
  const labels: Record<string, string> = {
    pass: "通过",
    warn: "注意",
    fail: "失败",
    active: "进行中",
    completed: "已完成",
    archived: "已归档",
    draft: "草稿",
    approved: "已批准",
    exported: "已导出",
    verified: "已验证",
    rejected: "已拒绝",
    open: "待处理",
    resolved: "已解决",
    ignored: "已忽略",
    todo: "待办",
    doing: "进行中",
    done: "已完成",
    strong_fit: "强匹配",
    medium_fit: "中匹配",
    weak_fit: "弱匹配",
    not_recommended: "不推荐",
    insufficient_evidence: "证据不足",
    force_include: "强制纳入",
    force_exclude: "强制排除",
    needs_review: "需要复核",
  };
  return labels[value] ?? value;
}

export function statusTone(value: string): "success" | "warning" | "danger" | "info" | "muted" | "blocked" {
  if (["pass", "success", "done", "completed", "approved", "exported", "verified", "strong_fit", "resolved"].includes(value)) {
    return "success";
  }
  if (["warn", "warning", "draft", "doing", "medium_fit", "needs_review", "open"].includes(value)) return "warning";
  if (["fail", "danger", "rejected", "not_recommended", "high"].includes(value)) return "danger";
  if (["blocked", "blocking", "insufficient_evidence"].includes(value)) return "blocked";
  if (["active", "info", "weak_fit"].includes(value)) return "info";
  return "muted";
}

export function healthIconLabel(status?: string) {
  if (status === "pass") return { icon: Gauge, label: "系统健康", tone: "success" as const };
  if (status === "warn") return { icon: Gauge, label: "系统注意", tone: "warning" as const };
  return { icon: Gauge, label: "系统异常", tone: "danger" as const };
}
