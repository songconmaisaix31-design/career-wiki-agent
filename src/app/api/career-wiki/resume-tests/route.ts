import { apiError } from "@/lib/career-wiki/api";
import { jdTestInputSchema } from "@/lib/career-wiki/schemas";
import { createJdTest, getTestHarnessData, seedPlaceholderJdTests } from "@/lib/career-wiki/test-harness-repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await getTestHarnessData();
    return Response.json(data);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (isSeedRequest(body)) return Response.json({ jdTests: await seedPlaceholderJdTests() });
    const input = jdTestInputSchema.parse(body);
    return Response.json({ jdTest: await createJdTest(input) });
  } catch (error) {
    return apiError(error);
  }
}

function isSeedRequest(body: unknown): body is { seedPlaceholders: true } {
  return Boolean(body && typeof body === "object" && "seedPlaceholders" in body && body.seedPlaceholders === true);
}
