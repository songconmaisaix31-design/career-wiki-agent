import { apiError } from "@/lib/career-wiki/api";
import { getCareerWikiDashboard } from "@/lib/career-wiki/dashboard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    return Response.json(await getCareerWikiDashboard());
  } catch (error) {
    return apiError(error);
  }
}
