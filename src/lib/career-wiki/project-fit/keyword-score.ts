import type { CareerJdTestView, CareerProjectView } from "../types";

export type KeywordScoreResult = {
  score: number;
  requirements: string[];
  matched: string[];
  missing: string[];
};

const STOP_WORDS = new Set([
  "and",
  "or",
  "the",
  "with",
  "for",
  "to",
  "of",
  "in",
  "a",
  "an",
  "on",
  "as",
  "by",
  "岗位",
  "职责",
  "要求",
  "需要",
  "负责",
  "具备",
  "熟悉",
  "相关",
  "能力",
]);

const PHRASE_REQUIREMENTS = [
  "ai agent",
  "llm",
  "rag",
  "workflow",
  "automation",
  "data governance",
  "data collection",
  "dashboard",
  "api",
  "integration",
  "solution",
  "customer",
  "vercel",
  "blob",
  "storage",
  "typescript",
  "react",
  "next.js",
  "python",
  "sql",
  "adb",
  "cdp",
  "可视化",
  "自动化",
  "数据采集",
  "数据治理",
  "解决方案",
  "客户",
  "交付",
  "大模型",
  "智能体",
  "知识库",
];

export function scoreProjectKeywords(jdTest: CareerJdTestView, project: CareerProjectView): KeywordScoreResult {
  const requirements = extractJdRequirements(jdTest);
  const haystack = projectText(project);
  const matched = requirements.filter((requirement) => containsRequirement(haystack, requirement));
  const missing = requirements.filter((requirement) => !matched.includes(requirement));
  const score = requirements.length ? Math.round((matched.length / requirements.length) * 100) : 0;
  return { score, requirements, matched, missing };
}

export function extractJdRequirements(jdTest: CareerJdTestView) {
  const text = normalize(`${jdTest.targetDirection} ${jdTest.role} ${jdTest.jdText}`);
  const phrases = PHRASE_REQUIREMENTS.filter((phrase) => text.includes(normalize(phrase)));
  const tokens = text
    .split(/[^a-z0-9+#.\u4e00-\u9fa5]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !STOP_WORDS.has(token));
  return [...new Set([...phrases, ...tokens.filter(isUsefulToken).slice(0, 36)])];
}

function containsRequirement(haystack: string, requirement: string) {
  const normalized = normalize(requirement);
  if (!normalized) return false;
  if (haystack.includes(normalized)) return true;
  return aliasesFor(normalized).some((alias) => haystack.includes(alias));
}

function aliasesFor(requirement: string) {
  const aliases: Record<string, string[]> = {
    ai: ["llm", "agent", "大模型", "智能体"],
    "ai agent": ["agent", "智能体"],
    llm: ["大模型", "agent"],
    rag: ["knowledge", "知识库"],
    automation: ["自动化", "workflow", "脚本"],
    workflow: ["automation", "流程", "自动化"],
    data: ["数据", "dashboard", "sql"],
    "data collection": ["采集", "adb", "cdp"],
    "data governance": ["治理", "dashboard", "指标"],
    solution: ["方案", "交付", "customer"],
    integration: ["api", "接口", "集成"],
    storage: ["blob", "object storage", "存储"],
    customer: ["客户", "交付", "方案"],
    javascript: ["typescript", "react", "next.js"],
  };
  return aliases[requirement] ?? [];
}

function projectText(project: CareerProjectView) {
  return normalize(
    [
      project.name,
      project.status,
      project.description,
      project.interviewStory,
      ...project.techStack,
      ...project.highlights,
      ...project.resumeBullets,
    ].join(" "),
  );
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function isUsefulToken(token: string) {
  if (/^\d+$/.test(token)) return false;
  if (token.length > 32) return false;
  return /[a-z\u4e00-\u9fa5]/i.test(token);
}
