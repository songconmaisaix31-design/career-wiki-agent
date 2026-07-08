import { apiError } from "@/lib/career-wiki/api";
import { parseDocument } from "@/lib/career-wiki/document-ingest";
import type { DocumentInput, DocumentPurpose } from "@/lib/career-wiki/document-ingest";
import { normalizeExtension } from "@/lib/career-wiki/document-ingest/guards";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) return Response.json(await parseMultipart(request));
    return Response.json(await parseJson(request));
  } catch (error) {
    return apiError(error);
  }
}

async function parseMultipart(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const purpose = normalizePurpose(formData.get("purpose"));
  if (!(file instanceof File)) throw new Error("请上传需要解析的文件。");
  const bytes = Buffer.from(await file.arrayBuffer());
  const input: DocumentInput = {
    file_name: file.name,
    mime_type: file.type || "application/octet-stream",
    extension: normalizeExtension(file.name),
    size_bytes: file.size,
    source_type: "upload",
    purpose,
  };
  return { parsed: await parseDocument({ input, bytes }) };
}

async function parseJson(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const text = typeof body.text === "string" ? body.text : "";
  const fileName = typeof body.fileName === "string" ? body.fileName : "pasted-jd.md";
  const purpose = normalizePurpose(body.purpose);
  const input: DocumentInput = {
    file_name: fileName,
    mime_type: "text/plain",
    extension: normalizeExtension(fileName, ".md"),
    size_bytes: Buffer.byteLength(text, "utf8"),
    source_type: "pasted_text",
    purpose,
  };
  return { parsed: await parseDocument({ input, text }) };
}

function normalizePurpose(value: FormDataEntryValue | unknown): DocumentPurpose {
  return value === "resume_baseline" ? "resume_baseline" : "jd";
}
