import { apiError } from "@/lib/career-wiki/api";
import { deleteEvidenceItem, getEvidenceItems, saveEvidenceItem } from "@/lib/career-wiki/evidence";
import { evidenceDeleteInputSchema, evidenceInputSchema, evidenceUpdateInputSchema } from "@/lib/career-wiki/schemas";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    return Response.json({
      evidenceItems: await getEvidenceItems({
        targetType: searchParams.get("targetType") || undefined,
        targetId: searchParams.get("targetId") || undefined,
        jdTestId: searchParams.get("jdTestId") || undefined,
        status: searchParams.get("status") || undefined,
      }),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = evidenceInputSchema.parse(await request.json());
    return Response.json({ evidenceItem: await saveEvidenceItem(input) });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const input = evidenceUpdateInputSchema.parse(await request.json());
    return Response.json({ evidenceItem: await saveEvidenceItem(input) });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    const input = evidenceDeleteInputSchema.parse({ id: url.searchParams.get("id") || body.id });
    return Response.json(await deleteEvidenceItem(input.id));
  } catch (error) {
    return apiError(error);
  }
}
