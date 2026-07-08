import { apiError } from "@/lib/career-wiki/api";
import { exportResumeVersionFormat } from "@/lib/career-wiki/resume-format-export";
import { resumeVersionExportFormatInputSchema } from "@/lib/career-wiki/schemas";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = resumeVersionExportFormatInputSchema.parse(await request.json());
    return Response.json(
      await exportResumeVersionFormat({
        versionId: input.versionId,
        format: input.format,
        template: input.template,
        pageSize: input.page_size,
        includeInternalReports: input.include_internal_reports,
      }),
    );
  } catch (error) {
    return apiError(error);
  }
}
