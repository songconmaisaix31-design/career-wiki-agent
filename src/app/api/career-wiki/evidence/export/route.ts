import { apiError } from "@/lib/career-wiki/api";
import { exportEvidenceReport } from "@/lib/career-wiki/evidence";
import { evidenceExportInputSchema } from "@/lib/career-wiki/schemas";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = evidenceExportInputSchema.parse(await request.json().catch(() => ({})));
    return Response.json(await exportEvidenceReport(input));
  } catch (error) {
    return apiError(error);
  }
}
