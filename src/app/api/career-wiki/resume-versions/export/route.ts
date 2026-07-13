import { apiError } from "@/lib/career-wiki/api";
import { resumeVersionExportInputSchema } from "@/lib/career-wiki/schemas";
import { exportApprovedResumeVersion } from "@/lib/career-wiki/test-harness-export";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = resumeVersionExportInputSchema.parse(await request.json());
    return Response.json(await exportApprovedResumeVersion(input.versionId));
  } catch (error) {
    return apiError(error);
  }
}
