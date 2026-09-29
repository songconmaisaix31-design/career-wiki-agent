import type {
  CareerJdAnalysisView,
  CareerLearningTaskView,
  CareerProjectView,
  CareerSkillView,
} from "./types";
import type { CareerJdInput } from "./schemas";

const COMMON_SKILLS = [
  "TypeScript",
  "JavaScript",
  "HTML",
  "CSS",
  "React",
  "Vue",
  "Next.js",
  "Vite",
  "Tailwind CSS",
  "TanStack Query",
  "Node.js",
  "Python",
  "FastAPI",
  "pytest",
  "SQL",
  "MySQL",
  "PostgreSQL",
  "MongoDB",
  "Redis",
  "Prisma",
  "Docker",
  "Linux",
  "Nginx",
  "CI/CD",
  "Git",
  "GitHub",
  "GitHub Actions",
  "Codex",
  "Cursor",
  "Claude Code",
  "GitHub Copilot",
  "Spec Coding",
  "REST API",
  "JSON Schema",
  "Vitest",
  "ESLint",
  "n8n",
  "CDP",
  "ADB",
  "uiautomator2",
  "数据分析",
  "数据运营",
  "BI",
  "规则引擎",
  "自动化测试",
  "代码审查",
  "安全审计",
  "需求分析",
  "产品设计",
  "PRD",
  "Figma",
  "Axure",
  "UI/UX",
  "模型评测",
  "机器学习",
  "RAG",
  "LLM",
  "Agent",
  "LangChain",
  "LangGraph",
  "Tool Calling",
  "Function Calling",
  "Structured Output",
  "Streaming",
  "Embedding",
  "Vector Database",
  "MCP",
  "AIGC",
  "ComfyUI",
  "NL2SQL",
  "TableRAG",
  "React Flow",
  "Kubernetes",
  "Monorepo",
  "ORM",
  "Prompt Engineering",
  "项目管理",
  "用户研究",
  "增长分析",
  "A/B Test",
  "eCPM",
  "ROI",
  "LTV",
];

export function analyzeCareerJd(
  input: CareerJdInput,
  projects: CareerProjectView[],
  skills: CareerSkillView[],
): Omit<CareerJdAnalysisView, "id" | "updatedAt"> {
  const jdText = input.jdText.trim();
  const lines = splitMeaningful(jdText);
  const requiredSkills = extractRequiredSkills(jdText, skills);
  const knownSkillNames = new Set(skills.map((skill) => normalize(skill.name)));
  const skillGaps = requiredSkills.filter((skill) => !knownSkillNames.has(normalize(skill)));
  const matchedProjects = matchProjects(requiredSkills, projects);
  const responsibilities = extractBySignals(lines, ["负责", "参与", "建设", "设计", "优化", "deliver", "build", "own"]).slice(0, 8);
  const bonusPoints = extractBySignals(lines, ["加分", "优先", "熟悉", "bonus", "plus", "nice to have"]).slice(0, 6);
  const matchScore = scoreMatch({ requiredSkills, skillGaps, matchedProjects });

  return {
    company: input.company,
    role: input.role,
    source: input.source,
    jdText,
    responsibilities: responsibilities.length ? responsibilities : lines.slice(0, 5),
    requiredSkills,
    bonusPoints,
    matchedProjects,
    skillGaps,
    matchScore,
    resumeSuggestions: buildResumeSuggestions(requiredSkills, matchedProjects, skillGaps),
    interviewTips: buildInterviewTips(requiredSkills, skillGaps),
  };
}

export function generateSevenDayTasks(
  analysis: CareerJdAnalysisView,
  skills: CareerSkillView[],
): Array<Omit<CareerLearningTaskView, "id" | "jdAnalysisId" | "updatedAt">> {
  const existingSkillNames = new Set(skills.map((skill) => normalize(skill.name)));
  const focusSkills = [...analysis.skillGaps, ...analysis.requiredSkills.filter((skill) => existingSkillNames.has(normalize(skill)))]
    .filter(Boolean)
    .slice(0, 7);
  const planSkills = focusSkills.length ? focusSkills : ["岗位理解", "项目表达", "简历优化", "面试复盘", "业务理解", "技术深挖", "输出整理"];

  return Array.from({ length: 7 }, (_, index) => {
    const skill = planSkills[index % planSkills.length];
    const dayIndex = index + 1;
    return {
      title: `Day ${dayIndex}: 补齐 ${skill}`,
      description: buildTaskDescription(dayIndex, skill, analysis),
      relatedSkill: skill,
      priority: analysis.skillGaps.some((gap) => normalize(gap) === normalize(skill)) ? "high" : "medium",
      dayIndex,
      estimatedTime: dayIndex <= 5 ? "60-90 min" : "90-120 min",
      outputRequired: buildTaskOutput(dayIndex, skill),
      status: "todo",
    };
  });
}

export function sanitizeWindowsFilename(input: string) {
  const sanitized = input
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 120);
  return sanitized || "untitled";
}

export function sanitizeResumeRoleLabel(role: string) {
  return role
    .replace(/（[^）]*(?:职位长图|截图|公开索引摘要|应届|在校)[^）]*）/g, "")
    .replace(/\([^)]*(?:职位长图|截图|公开索引摘要|应届|在校)[^)]*\)/gi, "")
    .trim();
}

function extractRequiredSkills(text: string, skills: CareerSkillView[]) {
  const candidates = [...COMMON_SKILLS, ...skills.map((skill) => skill.name)]
    .map((item) => item.trim())
    .filter((item) => item && normalize(item) !== "ai");
  const unique = new Map<string, string>();

  for (const candidate of candidates) {
    if (text.toLowerCase().includes(candidate.toLowerCase())) {
      unique.set(normalize(candidate), candidate);
    }
  }

  return [...unique.values()].slice(0, 18);
}

function matchProjects(requiredSkills: string[], projects: CareerProjectView[]) {
  const skillTokens = requiredSkills.map(normalize);
  return projects
    .filter((project) => {
      const haystack = [project.name, project.description, project.interviewStory, ...project.techStack, ...project.highlights]
        .join(" ")
        .toLowerCase();
      return skillTokens.some((skill) => skill && haystack.includes(skill));
    })
    .map((project) => project.name)
    .slice(0, 6);
}

function buildResumeSuggestions(requiredSkills: string[], matchedProjects: string[], skillGaps: string[]) {
  const suggestions = [
    "把 JD 中出现频率最高的技能放到简历前半部分，并用项目证据支撑。",
    "每条项目 bullet 使用「动作 + 方法 + 结果」结构，避免只堆技术名词。",
  ];
  if (requiredSkills.length) suggestions.push(`优先强化这些关键词：${requiredSkills.slice(0, 5).join("、")}。`);
  if (matchedProjects.length) suggestions.push(`重点展开匹配项目：${matchedProjects.map((name) => `[[${name}]]`).join("、")}。`);
  if (skillGaps.length) suggestions.push(`技能缺口需要学习任务覆盖：${skillGaps.slice(0, 5).join("、")}。`);
  return suggestions;
}

function buildInterviewTips(requiredSkills: string[], skillGaps: string[]) {
  return [
    "准备 1 个最匹配项目的 STAR 故事，突出你的真实贡献和量化结果。",
    "为每个核心技能准备一个「用过什么、怎么用、踩过什么坑」的回答。",
    skillGaps.length
      ? `对缺口技能主动说明学习计划，避免被动暴露：${skillGaps.slice(0, 3).join("、")}。`
      : `围绕 ${requiredSkills.slice(0, 3).join("、") || "岗位核心能力"} 准备追问。`,
  ];
}

function buildTaskDescription(dayIndex: number, skill: string, analysis: CareerJdAnalysisView) {
  if (dayIndex <= 2) return `阅读 ${analysis.company} - ${analysis.role} 的 JD，整理 ${skill} 在岗位中的使用场景。`;
  if (dayIndex <= 5) return `用一个已有项目补充 ${skill} 的证据，形成可放入简历或面试回答的表达。`;
  return `模拟面试追问 ${skill}，检查回答是否包含背景、行动、结果和复盘。`;
}

function buildTaskOutput(dayIndex: number, skill: string) {
  if (dayIndex <= 2) return `${skill} 学习笔记 1 篇`;
  if (dayIndex <= 5) return `${skill} 项目 bullet 2 条`;
  return `${skill} 面试问答卡片 3 张`;
}

function splitMeaningful(text: string) {
  return text
    .split(/\r?\n|。|；|;|\u2022|-/)
    .map((item) => item.trim())
    .filter((item) => item.length > 5);
}

function extractBySignals(lines: string[], signals: string[]) {
  return lines.filter((line) => signals.some((signal) => line.toLowerCase().includes(signal.toLowerCase())));
}

function scoreMatch({
  requiredSkills,
  skillGaps,
  matchedProjects,
}: {
  requiredSkills: string[];
  skillGaps: string[];
  matchedProjects: string[];
}) {
  const coverage = requiredSkills.length ? (requiredSkills.length - skillGaps.length) / requiredSkills.length : 0.35;
  const projectBonus = Math.min(25, matchedProjects.length * 8);
  return Math.max(10, Math.min(95, Math.round(35 + coverage * 40 + projectBonus)));
}

function normalize(input: string) {
  return input.trim().toLowerCase();
}
