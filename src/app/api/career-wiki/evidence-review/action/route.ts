import { apiError } from "@/lib/career-wiki/api";
import { updateEvidenceReviewItemStatus } from "@/lib/career-wiki/evidence-review/repository";
import { evidenceReviewActionInputSchema } from "@/lib/career-wiki/schemas";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = evidenceReviewActionInputSchema.parse(await request.json());
    return Response.json({ item: await updateEvidenceReviewItemStatus(input.id, input.status) });
  } catch (error) {
    return apiError(error);
  }
}
