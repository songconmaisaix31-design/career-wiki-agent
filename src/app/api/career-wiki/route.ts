import { apiError } from "@/lib/career-wiki/api";
import { getCareerWikiData } from "@/lib/career-wiki/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await getCareerWikiData());
  } catch (error) {
    return apiError(error);
  }
}

