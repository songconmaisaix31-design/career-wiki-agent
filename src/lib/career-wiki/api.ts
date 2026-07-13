import { ZodError } from "zod";

export function apiError(error: unknown) {
  const message = formatApiError(error);
  return Response.json({ message }, { status: message.includes("not found") ? 404 : 400 });
}

function formatApiError(error: unknown) {
  if (error instanceof ZodError) return error.issues.map((issue) => issue.message).join("；");
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  return "请求处理失败";
}

