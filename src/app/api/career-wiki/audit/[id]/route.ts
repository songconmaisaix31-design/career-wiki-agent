import { apiError } from "@/lib/career-wiki/api";
import { getAuditLog } from "@/lib/career-wiki/audit/audit-log";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return Response.json({ auditLog: await getAuditLog(id) });
  } catch (error) {
    return apiError(error);
  }
}
