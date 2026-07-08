import { apiError } from "@/lib/career-wiki/api";
import { tailorExportInputSchema } from "@/lib/career-wiki/schemas";
import { exportTailorRuns } from "@/lib/career-wiki/test-harness-export";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = tailorExportInputSchema.parse(await request.json());
    return Response.json(await exportTailorRuns(input.runIds));
  } catch (error) {
    return apiError(error);
  }
}
