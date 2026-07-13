import type { ReactNode } from "react";

import { CareerWikiBreadcrumbs } from "@/components/career-wiki/breadcrumbs";
import type { CareerWikiRouteKey } from "@/components/career-wiki/navigation";
import { getCareerWikiNavItem } from "@/components/career-wiki/navigation";
import { CareerWikiStatusStrip, type CareerWikiStatusItem } from "@/components/career-wiki/status-strip";

export function CareerWikiPageHeader({
  active,
  title,
  description,
  actions,
  statusItems = [],
}: {
  active: CareerWikiRouteKey;
  title?: string;
  description?: string;
  actions?: ReactNode;
  statusItems?: CareerWikiStatusItem[];
}) {
  const item = getCareerWikiNavItem(active);
  return (
    <header className="space-y-4">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="min-w-0">
          <CareerWikiBreadcrumbs active={active} />
          <h1 className="mt-2 text-2xl font-semibold tracking-tight lg:text-3xl">{title ?? item?.label ?? "Career Wiki"}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description ?? item?.description}</p>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      <CareerWikiStatusStrip items={statusItems} />
    </header>
  );
}
