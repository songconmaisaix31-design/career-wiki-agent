import { apiError } from "@/lib/career-wiki/api";
import { previewWikiImport } from "@/lib/career-wiki/test-harness-repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    return Response.json(await previewWikiImport());
  } catch (error) {
    return apiError(error);
  }
}
