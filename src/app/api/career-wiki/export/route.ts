import { apiError } from "@/lib/career-wiki/api";
import { exportCareerWikiToObsidian } from "@/lib/career-wiki/obsidian-export";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  try {
    return Response.json(await exportCareerWikiToObsidian());
  } catch (error) {
    return apiError(error);
  }
}

