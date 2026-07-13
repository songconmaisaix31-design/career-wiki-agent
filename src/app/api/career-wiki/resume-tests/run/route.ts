import { apiError } from "@/lib/career-wiki/api";
import { tailorRunInputSchema } from "@/lib/career-wiki/schemas";
import { runResumeTailorTests } from "@/lib/career-wiki/test-harness-repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = tailorRunInputSchema.parse(await request.json());
    return Response.json({ runs: await runResumeTailorTests(input) });
  } catch (error) {
    return apiError(error);
  }
}
