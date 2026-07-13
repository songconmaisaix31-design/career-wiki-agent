import { apiError } from "@/lib/career-wiki/api";
import { resumeBaselineInputSchema } from "@/lib/career-wiki/schemas";
import { exportBaselineResume } from "@/lib/career-wiki/test-harness-export";
import { getTestHarnessData, importResumeBaseline } from "@/lib/career-wiki/test-harness-repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await getTestHarnessData();
    return Response.json({ baselines: data.baselines });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = resumeBaselineInputSchema.parse(await request.json());
    const baseline = await importResumeBaseline(input);
    const exportedFile = input.markdown?.trim() ? await exportBaselineResume(input.markdown) : null;
    return Response.json({ baseline, exportedFile });
  } catch (error) {
    return apiError(error);
  }
}
