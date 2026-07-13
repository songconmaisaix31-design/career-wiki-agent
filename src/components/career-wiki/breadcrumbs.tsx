import Link from "next/link";
import { ChevronRight } from "lucide-react";

import type { CareerWikiRouteKey } from "@/components/career-wiki/navigation";
import { getCareerWikiNavItem } from "@/components/career-wiki/navigation";

export function CareerWikiBreadcrumbs({ active }: { active: CareerWikiRouteKey }) {
  const item = getCareerWikiNavItem(active);
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground">
      <Link href="/career-wiki/dashboard" className="hover:text-foreground">
        Career Wiki
      </Link>
      <ChevronRight className="size-3.5" />
      <span className="text-foreground">{item?.label ?? "总览"}</span>
    </nav>
  );
}
