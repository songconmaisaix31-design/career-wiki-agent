import { apiError } from "@/lib/career-wiki/api";
import { evidenceReviewQueryInputSchema } from "@/lib/career-wiki/schemas";
import { listEvidenceReviewItems } from "@/lib/career-wiki/evidence-review/repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const input = evidenceReviewQueryInputSchema.parse({
      jdTestId: new URL(request.url).searchParams.get("jdTestId") || "",
    });
    return Response.json({ items: await listEvidenceReviewItems(input.jdTestId) });
  } catch (error) {
    return apiError(error);
  }
}
