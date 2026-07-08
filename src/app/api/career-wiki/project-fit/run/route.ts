import { apiError } from "@/lib/career-wiki/api";
import { runProjectFitClassifier } from "@/lib/career-wiki/project-fit/repository";
import { projectFitRunInputSchema } from "@/lib/career-wiki/schemas";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = projectFitRunInputSchema.parse(await request.json());
    return Response.json(await runProjectFitClassifier(input));
  } catch (error) {
    return apiError(error);
  }
}
