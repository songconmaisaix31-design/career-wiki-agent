"use client";

import { useState, useTransition } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

export function EvidenceReviewExportButton() {
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function exportReport() {
    startTransition(async () => {
      try {
        const response = await fetch("/api/career-wiki/evidence-review/export", { method: "POST" });
        const payload = (await response.json().catch(() => null)) as { message?: string; files?: string[] } | null;
        if (!response.ok) throw new Error(payload?.message ?? "导出审核报告失败。");
        setMessage(payload?.files?.length ? `已导出 ${payload.files.length} 个文件。` : payload?.message ?? "导出完成。");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "导出审核报告失败。");
      }
    });
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <Button variant="outline" size="sm" onClick={exportReport} disabled={isPending}>
        <Download className="size-4" />
        导出审核报告
      </Button>
      {message ? <span className="max-w-56 text-right text-xs text-muted-foreground">{message}</span> : null}
    </span>
  );
}
