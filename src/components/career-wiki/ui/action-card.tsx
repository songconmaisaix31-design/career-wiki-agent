import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

export function ActionCard({
  title,
  description,
  href,
  icon: Icon,
  meta,
  className,
}: {
  title: string;
  description: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  meta?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex min-h-28 items-start justify-between gap-4 rounded-lg border border-line bg-surface p-4 text-left transition-colors hover:bg-surface-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <span className="flex min-w-0 gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-muted text-brand">
          <Icon className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="block font-semibold">{title}</span>
          <span className="mt-1 block text-sm leading-6 text-muted-foreground">{description}</span>
          {meta ? <span className="mt-2 block text-xs text-muted-foreground">{meta}</span> : null}
        </span>
      </span>
      <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
