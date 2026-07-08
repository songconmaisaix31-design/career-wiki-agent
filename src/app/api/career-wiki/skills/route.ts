import { apiError } from "@/lib/career-wiki/api";
import { getCareerWikiData, saveCareerSkill } from "@/lib/career-wiki/repository";
import { careerSkillInputSchema } from "@/lib/career-wiki/schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getCareerWikiData();
    return Response.json({ skills: data.skills });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  return saveSkill(request);
}

export async function PATCH(request: Request) {
  return saveSkill(request);
}

async function saveSkill(request: Request) {
  try {
    const input = careerSkillInputSchema.parse(await request.json());
    return Response.json({ skill: await saveCareerSkill(input) });
  } catch (error) {
    return apiError(error);
  }
}

