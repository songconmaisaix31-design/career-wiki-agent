import { apiError } from "@/lib/career-wiki/api";
import { renderResumeVersion } from "@/lib/career-wiki/resume-format-export";
import { resumeVersionRenderInputSchema } from "@/lib/career-wiki/schemas";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = resumeVersionRenderInputSchema.parse(await request.json());
    return Response.json(await renderResumeVersion(input.versionId, input.format, input.template));
  } catch (error) {
    return apiError(error);
  }
}
