import { apiError } from "@/lib/career-wiki/api";
import { getCareerWikiHealth } from "@/lib/career-wiki/health";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    return Response.json(await getCareerWikiHealth());
  } catch (error) {
    return apiError(error);
  }
}
