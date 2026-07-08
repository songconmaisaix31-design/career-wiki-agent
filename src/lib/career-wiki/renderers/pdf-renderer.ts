import type { ResumeRenderSchema } from "../resume-render-schema";
import { renderResumeHtml } from "./html-renderer";

export type PdfRenderFallback = {
  supported: false;
  message: string;
  html: string;
};

export function renderResumePdfFallback(schema: ResumeRenderSchema): PdfRenderFallback {
  return {
    supported: false,
    message: "当前服务端未启用 PDF 渲染器。请导出 HTML 后用浏览器打印为 PDF。",
    html: renderResumeHtml(schema),
  };
}
