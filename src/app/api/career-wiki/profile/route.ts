import { apiError } from "@/lib/career-wiki/api";
import { careerProfileInputSchema } from "@/lib/career-wiki/schemas";
import { getCareerProfile, updateCareerProfile } from "@/lib/career-wiki/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json({ profile: await getCareerProfile() });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const input = careerProfileInputSchema.parse(await request.json());
    return Response.json({ profile: await updateCareerProfile(input) });
  } catch (error) {
    return apiError(error);
  }
}

