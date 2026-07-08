import { apiError } from "@/lib/career-wiki/api";
import { getProjectFitResults } from "@/lib/career-wiki/project-fit/repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jdTestId = searchParams.get("jdTestId")?.trim() || undefined;
    return Response.json({ results: await getProjectFitResults(jdTestId) });
  } catch (error) {
    return apiError(error);
  }
}
