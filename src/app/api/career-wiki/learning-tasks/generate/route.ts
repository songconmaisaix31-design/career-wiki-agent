import { apiError } from "@/lib/career-wiki/api";
import { generateLearningTasksForAnalysis } from "@/lib/career-wiki/repository";
import { learningTaskGenerateInputSchema } from "@/lib/career-wiki/schemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const input = learningTaskGenerateInputSchema.parse(await request.json());
    return Response.json({ tasks: await generateLearningTasksForAnalysis(input.jdAnalysisId) });
  } catch (error) {
    return apiError(error);
  }
}

