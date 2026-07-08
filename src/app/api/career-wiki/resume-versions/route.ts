import { apiError } from "@/lib/career-wiki/api";
import { resumeVersionCreateInputSchema, resumeVersionUpdateInputSchema } from "@/lib/career-wiki/schemas";
import { createCareerResumeVersion, getTestHarnessData, updateCareerResumeVersionStatus } from "@/lib/career-wiki/test-harness-repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await getTestHarnessData();
    return Response.json({ resumeVersions: data.resumeVersions });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = resumeVersionCreateInputSchema.parse(await request.json());
    return Response.json(await createCareerResumeVersion(input));
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const input = resumeVersionUpdateInputSchema.parse(await request.json());
    return Response.json({ version: await updateCareerResumeVersionStatus(input.id, input.status) });
  } catch (error) {
    return apiError(error);
  }
}
