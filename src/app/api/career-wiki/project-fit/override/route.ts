import { apiError } from "@/lib/career-wiki/api";
import { overrideProjectFitResult } from "@/lib/career-wiki/project-fit/repository";
import { projectFitOverrideInputSchema } from "@/lib/career-wiki/schemas";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(request: Request) {
  try {
    const input = projectFitOverrideInputSchema.parse(await request.json());
    return Response.json(await overrideProjectFitResult(input));
  } catch (error) {
    return apiError(error);
  }
}
