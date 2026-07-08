import { apiError } from "@/lib/career-wiki/api";
import { getWorkflowRun } from "@/lib/career-wiki/workflow/repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return Response.json(await getWorkflowRun(id));
  } catch (error) {
    return apiError(error);
  }
}
