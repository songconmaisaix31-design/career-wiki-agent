import { apiError } from "@/lib/career-wiki/api";
import { documentIngestConfirmInputSchema } from "@/lib/career-wiki/schemas";
import { createJdTest, importResumeBaseline } from "@/lib/career-wiki/test-harness-repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = documentIngestConfirmInputSchema.parse(await request.json());
    if (input.purpose === "resume_baseline") {
      const baseline = await importResumeBaseline({
        name: input.baselineName || input.title,
        source: `document-ingest:${input.parser}`,
        markdown: input.markdown,
      });
      return Response.json({ baseline });
    }

    const jdTest = await createJdTest({
      company: input.company || "Imported JD",
      role: input.role || input.title || "Imported Role",
      source: input.source || `document-ingest:${input.parser}`,
      jdText: input.markdown,
      targetDirection: input.targetDirection || input.role || "Imported JD",
    });
    return Response.json({ jdTest });
  } catch (error) {
    return apiError(error);
  }
}
