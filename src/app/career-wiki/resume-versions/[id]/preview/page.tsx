import { notFound } from "next/navigation";

import { ResumePrintPreview } from "@/components/career-wiki/resume-print-preview";
import { renderResumeVersion } from "@/lib/career-wiki/resume-format-export";
import { isResumeTemplateId, type ResumeTemplateId } from "@/lib/career-wiki/resume-templates/templates";

export const dynamic = "force-dynamic";

export default async function ResumeVersionPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ template?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const template: ResumeTemplateId = isResumeTemplateId(query.template) ? query.template : "modern";
  let html = "";
  try {
    const rendered = await renderResumeVersion(id, "html", template);
    html = rendered.content;
  } catch {
    notFound();
  }
  return <ResumePrintPreview versionId={id} template={template} html={html} />;
}
