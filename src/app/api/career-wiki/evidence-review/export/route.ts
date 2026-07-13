import { apiError } from "@/lib/career-wiki/api";
import { exportEvidenceQualityReview } from "@/lib/career-wiki/evidence-review/repository";
import { evidenceReviewQueryInputSchema } from "@/lib/career-wiki/schemas";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = evidenceReviewQueryInputSchema.parse(await request.json().catch(() => ({})));
    return Response.json(await exportEvidenceQualityReview(input.jdTestId));
  } catch (error) {
    return apiError(error);
  }
}
