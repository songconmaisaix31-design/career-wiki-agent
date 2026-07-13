import { apiError } from "@/lib/career-wiki/api";
import { recordManualApplicationHandoff } from "@/lib/career-wiki/manual-application-handoff";
import { manualApplicationHandoffInputSchema } from "@/lib/career-wiki/schemas";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = manualApplicationHandoffInputSchema.parse(await request.json());
    return Response.json({ handoff: await recordManualApplicationHandoff(input) });
  } catch (error) {
    return apiError(error);
  }
}
