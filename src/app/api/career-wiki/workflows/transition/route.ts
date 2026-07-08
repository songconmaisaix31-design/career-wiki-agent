import { apiError } from "@/lib/career-wiki/api";
import { workflowTransitionInputSchema } from "@/lib/career-wiki/schemas";
import { transitionWorkflowRun } from "@/lib/career-wiki/workflow/repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = workflowTransitionInputSchema.parse(await request.json());
    return Response.json(await transitionWorkflowRun(input));
  } catch (error) {
    return apiError(error);
  }
}
