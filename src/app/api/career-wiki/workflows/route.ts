import { apiError } from "@/lib/career-wiki/api";
import { listWorkflowRuns } from "@/lib/career-wiki/workflow/repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    return Response.json({ workflows: await listWorkflowRuns() });
  } catch (error) {
    return apiError(error);
  }
}
