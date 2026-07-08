import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, Database, Home, Upload } from "lucide-react";

import { CareerWikiPageHeader } from "@/components/career-wiki/page-header";
import { CareerWikiSidebarNav } from "@/components/career-wiki/sidebar-nav";
import type { CareerWikiRouteKey } from "@/components/career-wiki/navigation";
import { careerWikiNavItems, getCareerWikiNavItem } from "@/components/career-wiki/navigation";
import type { CareerWikiStatusItem } from "@/components/career-wiki/status-strip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CareerWikiAppShell({
  active,
  title,
  description,
  actions,
  statusItems = [],
  children,
  className,
}: {
  active: CareerWikiRouteKey;
  title?: string;
  description?: string;
  actions?: ReactNode;
  statusItems?: CareerWikiStatusItem[];
  children: ReactNode;
  className?: string;
}) {
  const activeItem = getCareerWikiNavItem(active);
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <CareerWikiSidebarNav active={active} />
        <section className="min-w-0 flex-1">
          <div className="no-print sticky top-0 z-20 border-b border-line bg-background/95 px-4 py-3 backdrop-blur lg:px-8">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{activeItem?.label ?? "Career Wiki"}</p>
                <p className="truncate text-xs text-muted-foreground">本地 Career OS · 证据优先 · 审计可追踪</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" render={<Link href="/" />}>
                  <Home className="size-3.5" />
                  LuJie
                </Button>
                <Button variant="outline" size="sm" render={<Link href="/career-wiki/jd-import" />}>
                  <Upload className="size-3.5" />
                  导入 JD
                </Button>
                <Button variant="outline" size="sm" render={<Link href="/career-wiki/resume-versions" />}>
                  <Database className="size-3.5" />
                  简历版本
                </Button>
              </div>
            </div>
          </div>

          <div className="lg:hidden">
            <div className="flex gap-2 overflow-x-auto border-b border-line px-4 py-3">
              {careerWikiNavItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "shrink-0 rounded-lg border border-line bg-surface px-3 py-2 text-sm",
                    item.key === active && "border-primary bg-primary text-primary-foreground",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className={cn("mx-auto max-w-7xl space-y-6 px-4 py-6 lg:px-8 lg:py-8", className)}>
            <CareerWikiPageHeader
              active={active}
              title={title}
              description={description}
              actions={
                actions ?? (
                  <Button variant="outline" size="sm" render={<Link href="/career-wiki/workflow" />}>
                    查看流程
                    <ArrowUpRight className="size-3.5" />
                  </Button>
                )
              }
              statusItems={statusItems}
            />
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
