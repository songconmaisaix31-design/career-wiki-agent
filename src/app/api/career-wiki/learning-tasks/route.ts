import { apiError } from "@/lib/career-wiki/api";
import { getCareerWikiData, updateLearningTaskStatus } from "@/lib/career-wiki/repository";
import { learningTaskUpdateInputSchema } from "@/lib/career-wiki/schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getCareerWikiData();
    return Response.json({ learningTasks: data.learningTasks });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const input = learningTaskUpdateInputSchema.parse(await request.json());
    return Response.json({ task: await updateLearningTaskStatus(input.id, input.status) });
  } catch (error) {
    return apiError(error);
  }
}

