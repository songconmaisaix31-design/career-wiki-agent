"use client";

import Link from "next/link";
import { Printer } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ResumeTemplateId } from "@/lib/career-wiki/resume-templates/templates";

export function ResumePrintPreview({
  versionId,
  template,
  html,
}: {
  versionId: string;
  template: ResumeTemplateId;
  html: string;
}) {
  function printFrame() {
    const frame = document.getElementById("resume-print-frame") as HTMLIFrameElement | null;
    frame?.contentWindow?.focus();
    frame?.contentWindow?.print();
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="no-print sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1 basis-64">
            <h1 className="text-base font-semibold text-slate-950">简历打印预览</h1>
            <p className="max-w-full text-sm text-slate-600 [overflow-wrap:anywhere]">当前模板：{template}。点击打印后选择 Save as PDF。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["modern", "ats", "compact"] as const).map((item) => (
              <Link
                key={item}
                href={`/career-wiki/resume-versions/${versionId}/preview?template=${item}`}
                className={cn(
                  "inline-flex min-h-9 items-center rounded-md border border-slate-300 px-3 text-sm",
                  item === template && "border-slate-950 bg-slate-950 text-white",
                )}
              >
                {item}
              </Link>
            ))}
            <button
              type="button"
              onClick={printFrame}
              className="inline-flex min-h-9 items-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-medium text-white"
            >
              <Printer className="size-4" />
              Print / Save as PDF
            </button>
          </div>
        </div>
      </div>
      <iframe id="resume-print-frame" title="Resume print preview" srcDoc={html} className="h-[calc(100vh-72px)] w-full border-0" />
    </main>
  );
}
