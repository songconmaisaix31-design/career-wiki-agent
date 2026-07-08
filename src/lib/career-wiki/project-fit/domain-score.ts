import type { CareerJdTestView, CareerProjectView } from "../types";

const DOMAIN_TERMS: Record<string, string[]> = {
  "ai application engineer": ["ai", "agent", "llm", "rag", "workflow", "review", "knowledge", "prompt", "智能体", "大模型", "知识库"],
  "fde / solution engineer": ["solution", "customer", "api", "integration", "vercel", "dashboard", "delivery", "blob", "storage", "方案", "客户", "交付"],
  "data automation engineer": ["data", "automation", "sql", "dashboard", "adb", "cdp", "collection", "governance", "report", "数据", "自动化", "采集", "治理"],
};

export function scoreProjectDomain(jdTest: CareerJdTestView, project: CareerProjectView, targetDirection?: string) {
  const direction = normalize(targetDirection || jdTest.targetDirection || jdTest.role);
  const terms = DOMAIN_TERMS[bestDomain(direction)] ?? [];
  if (!terms.length) return 50;
  const text = normalize([project.name, project.description, ...project.techStack, ...project.highlights, ...project.resumeBullets].join(" "));
  const matched = terms.filter((term) => text.includes(normalize(term)));
  return Math.round((matched.length / Math.min(terms.length, 8)) * 100);
}

function bestDomain(direction: string) {
  if (/data|automation|数据|自动化|治理|采集/.test(direction)) return "data automation engineer";
  if (/fde|solution|customer|解决方案|客户|交付/.test(direction)) return "fde / solution engineer";
  return "ai application engineer";
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}
