import { apiError } from "@/lib/career-wiki/api";
import { createCareerJdAnalysis, getCareerWikiData } from "@/lib/career-wiki/repository";
import { careerJdInputSchema } from "@/lib/career-wiki/schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getCareerWikiData();
    return Response.json({ jdAnalyses: data.jdAnalyses });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = careerJdInputSchema.parse(await request.json());
    return Response.json({ analysis: await createCareerJdAnalysis(input) });
  } catch (error) {
    return apiError(error);
  }
}

