import { apiError } from "@/lib/career-wiki/api";
import { wikiImportApplyInputSchema } from "@/lib/career-wiki/schemas";
import { applyWikiImport } from "@/lib/career-wiki/test-harness-repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = wikiImportApplyInputSchema.parse(await request.json());
    return Response.json(await applyWikiImport(input.dryRun));
  } catch (error) {
    return apiError(error);
  }
}
