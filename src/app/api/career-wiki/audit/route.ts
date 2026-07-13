import { apiError } from "@/lib/career-wiki/api";
import { listAuditLogs } from "@/lib/career-wiki/audit/audit-log";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const limit = Number(new URL(request.url).searchParams.get("limit") || 100);
    return Response.json({ auditLogs: await listAuditLogs(limit) });
  } catch (error) {
    return apiError(error);
  }
}
