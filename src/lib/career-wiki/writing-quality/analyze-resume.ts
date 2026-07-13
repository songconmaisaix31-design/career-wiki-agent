import type { ResumeWritingFinding, ResumeWritingQualityReport } from "./types";

const genericClaimPatterns = [
  /深度参与/,
  /赋能/,
  /形成闭环/,
  /全面提升/,
  /高效完成/,
  /有效推动/,
  /表达重点对齐/,
];

const superlativePatterns = [/精通/, /卓越/, /优秀的?/, /强大的?/, /丰富的?经验/, /熟练掌握/];
const productionPatterns = /production[- ]?ready|生产级|投入生产|已上线|大规模应用/i;
const unfinishedPatterns = /wip|prototype|mvp|semi-finished|半成品|原型|项目状态/i;
const metricPattern = /(?:\d+(?:\.\d+)?%|\d+(?:\.\d+)?\s*(?:万|亿|ms|s|秒|分钟|小时|天|人|条|次|个|倍|GB|MB|QPS))/i;

export function analyzeResumeWriting(markdown: string): ResumeWritingQualityReport {
  const entries = extractReviewEntries(markdown);
  const findings: ResumeWritingFinding[] = [];

  for (const entry of entries) {
    if (genericClaimPatterns.some((pattern) => pattern.test(entry.content)) && !metricPattern.test(entry.content)) {
      findings.push(finding("generic_claim", "warning", entry, "表达偏抽象，缺少可核对的动作或结果。", "保留具体动作、对象和已验证结果，删除评价性连接词。"));
    }
    if (superlativePatterns.some((pattern) => pattern.test(entry.content))) {
      findings.push(finding("unsupported_superlative", "warning", entry, "包含自我评价或程度词，招聘方无法直接核验。", "改为具体技能、职责范围或项目证据。"));
    }
    if (metricPattern.test(entry.content)) {
      findings.push(finding("unverified_metric", "warning", entry, "包含量化结果，请确认数字能够追溯到证据。", "保留可验证数字；无法证明时改为不带数字的事实描述。"));
    }
    if (entry.content.length > 80) {
      findings.push(finding("overlong_bullet", "warning", entry, "单条内容过长，关键信息不易扫描。", "拆成一条主要动作和一条结果，或删除与目标岗位无关的信息。"));
    }
    if (/^(?:负责|参与|协助)(?:相关|部分|一些|多个)?(?:工作|项目|任务)?[，,：:]?\s*$/u.test(entry.content) || /^(?:负责|参与|协助)相关/u.test(entry.content)) {
      findings.push(finding("vague_subject", "warning", entry, "动作对象过于模糊。", "写明负责的系统、流程、数据或交付物。"));
    }
    if (hasKeywordStuffing(entry.content)) {
      findings.push(finding("excessive_keyword_stuffing", "warning", entry, "技术词密度过高，读起来像关键词堆叠。", "只保留实际用于该项目的关键技术，并说明用途。"));
    }
    if (productionPatterns.test(entry.content) && unfinishedPatterns.test(entry.content)) {
      findings.push(finding("production_status_overclaim", "blocking", entry, "同一条内容同时包含未完成状态和生产化表述。", "保留 WIP / prototype / MVP 状态，只描述已经验证的范围。"));
    }
    if (/ReviewFlow AI/i.test(entry.content) && productionPatterns.test(entry.content)) {
      findings.push(finding("production_status_overclaim", "blocking", entry, "ReviewFlow AI 必须保持 WIP / prototype 表述。", "删除生产级或已上线表述，改为已完成的原型验证范围。"));
    }
  }

  addRepeatedOpeningFindings(entries, findings);
  const uniqueFindings = deduplicateFindings(findings);
  const blockingCount = uniqueFindings.filter((item) => item.severity === "blocking").length;
  const warningCount = uniqueFindings.filter((item) => item.severity === "warning").length;
  return {
    score: Math.max(0, 100 - blockingCount * 25 - warningCount * 6),
    passed: blockingCount === 0,
    blockingCount,
    warningCount,
    findings: uniqueFindings,
  };
}

function extractReviewEntries(markdown: string) {
  const entries: Array<{ section: string; content: string }> = [];
  let section = "简历";
  let inFrontmatter = false;
  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "---") {
      inFrontmatter = !inFrontmatter;
      continue;
    }
    if (inFrontmatter || !line) continue;
    const heading = line.match(/^#{1,3}\s+(.+)$/)?.[1]?.trim();
    if (heading) {
      section = heading;
      continue;
    }
    const content = line.replace(/^[-*]\s+/, "").trim();
    if (content) entries.push({ section, content });
  }
  return entries;
}

function finding(
  code: ResumeWritingFinding["code"],
  severity: ResumeWritingFinding["severity"],
  entry: { section: string; content: string },
  message: string,
  suggestion: string,
): ResumeWritingFinding {
  return { code, severity, section: entry.section, content: entry.content, message, suggestion };
}

function hasKeywordStuffing(content: string) {
  const technologyTokens = content.match(/[A-Za-z][A-Za-z0-9.+#/-]{1,}/g) ?? [];
  return technologyTokens.length >= 9 && technologyTokens.join(" ").length > content.length * 0.45;
}

function addRepeatedOpeningFindings(entries: Array<{ section: string; content: string }>, findings: ResumeWritingFinding[]) {
  const openings = new Map<string, Array<{ section: string; content: string }>>();
  for (const entry of entries.filter((item) => /项目经历|工作经历/.test(item.section))) {
    const opening = entry.content.match(/^(负责|参与|协助|使用|基于|通过|构建|实现)/)?.[1];
    if (!opening) continue;
    openings.set(opening, [...(openings.get(opening) ?? []), entry]);
  }
  for (const [opening, repeated] of openings) {
    if (repeated.length < 3) continue;
    findings.push(
      finding(
        "repeated_sentence_opening",
        "warning",
        repeated[0],
        `连续 ${repeated.length} 条内容以“${opening}”开头，句式过于机械。`,
        "根据真实动作改用更具体的动词，或合并重复职责。",
      ),
    );
  }
}

function deduplicateFindings(findings: ResumeWritingFinding[]) {
  const seen = new Set<string>();
  return findings.filter((item) => {
    const key = `${item.code}:${item.section}:${item.content}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
