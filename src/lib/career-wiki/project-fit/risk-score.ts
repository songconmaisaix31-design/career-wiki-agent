import type { CareerProjectView } from "../types";

export type RiskScoreResult = {
  score: number;
  warnings: string[];
};

const STATUS_RISK_PATTERN = /wip|prototype|mvp|semi-finished|draft|实验|原型|半成品/i;

export function scoreProjectRisk(project: CareerProjectView, evidenceScore: number, keywordScore: number): RiskScoreResult {
  const warnings: string[] = [];
  let score = 0;

  if (STATUS_RISK_PATTERN.test(project.status)) {
    warnings.push(`${project.name} 当前状态为 ${project.status}，简历中必须保留 WIP/prototype/MVP/semi-finished 表述。`);
    score += 30;
  }
  if (evidenceScore < 30) {
    warnings.push("证据不足：缺少可验证描述、项目 bullet 或 Wiki/source 记录。");
    score += 45;
  }
  if (keywordScore < 20) {
    warnings.push("JD 关键词匹配弱，不建议作为主项目。");
    score += 25;
  }
  if (containsProductionReadyClaim(project)) {
    warnings.push("发现 production-ready 相关表述，需要人工确认后才能进入正式简历。");
    score += 35;
  }

  return { score: Math.min(score, 100), warnings };
}

function containsProductionReadyClaim(project: CareerProjectView) {
  return [project.description, ...project.highlights, ...project.resumeBullets, project.interviewStory].some((item) =>
    /production-ready|生产级|已上线|稳定支撑/i.test(item),
  );
}
