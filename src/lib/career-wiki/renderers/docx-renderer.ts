import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";

import type { ResumeRenderSchema } from "../resume-render-schema";
import type { ResumeTemplateId } from "../resume-templates/templates";

export async function renderResumeDocx(schema: ResumeRenderSchema, template: ResumeTemplateId = "modern") {
  const pageMargin = template === "compact" ? 600 : 720;
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: pageMargin, right: pageMargin, bottom: pageMargin, left: pageMargin },
          },
        },
        children: [
          paragraph(schema.profile.name, HeadingLevel.TITLE),
          paragraph(schema.profile.headline),
          paragraph("职业概述", HeadingLevel.HEADING_1),
          paragraph(schema.summary),
          paragraph("核心技能", HeadingLevel.HEADING_1),
          ...schema.skills.flatMap((group) => [paragraph(group.category, HeadingLevel.HEADING_2), bullet(group.items.join(" / "))]),
          paragraph("工作经历", HeadingLevel.HEADING_1),
          ...schema.work_experience.map(bullet),
          paragraph("项目经历", HeadingLevel.HEADING_1),
          ...schema.projects.flatMap((project) => [
            paragraph(`${project.name}${project.status ? ` (${project.status})` : ""}`, HeadingLevel.HEADING_2),
            ...project.bullets.map(bullet),
          ]),
          paragraph("教育背景", HeadingLevel.HEADING_1),
          ...schema.education.map(bullet),
        ],
      },
    ],
  });
  return Buffer.from(await Packer.toBuffer(doc));
}

function paragraph(text: string, heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel]) {
  return new Paragraph({
    heading,
    children: [new TextRun({ text: text || "暂无可验证内容", bold: heading === HeadingLevel.TITLE })],
    spacing: { before: heading === HeadingLevel.HEADING_1 ? 180 : 0, after: 120 },
  });
}

function bullet(text: string) {
  return new Paragraph({
    text: text || "暂无可验证内容",
    bullet: { level: 0 },
    spacing: { after: 80 },
  });
}
