import { apiError } from "@/lib/career-wiki/api";
import { getCareerWikiData, saveCareerProject } from "@/lib/career-wiki/repository";
import { careerProjectInputSchema } from "@/lib/career-wiki/schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getCareerWikiData();
    return Response.json({ projects: data.projects });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  return saveProject(request);
}

export async function PATCH(request: Request) {
  return saveProject(request);
}

async function saveProject(request: Request) {
  try {
    const input = careerProjectInputSchema.parse(await request.json());
    return Response.json({ project: await saveCareerProject(input) });
  } catch (error) {
    return apiError(error);
  }
}

