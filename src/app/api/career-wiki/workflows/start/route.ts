import { apiError } from "@/lib/career-wiki/api";
import { workflowStartInputSchema } from "@/lib/career-wiki/schemas";
import { startWorkflowRun } from "@/lib/career-wiki/workflow/repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = workflowStartInputSchema.parse(await request.json().catch(() => ({})));
    return Response.json(await startWorkflowRun(input));
  } catch (error) {
    return apiError(error);
  }
}
