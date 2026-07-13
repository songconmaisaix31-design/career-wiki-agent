import Image from "next/image";
import Link from "next/link";

import type { CareerWikiRouteKey } from "@/components/career-wiki/navigation";
import { careerWikiAdvancedNavGroups, careerWikiPrimaryNavItems } from "@/components/career-wiki/navigation";
import { cn } from "@/lib/utils";

export function CareerWikiSidebarNav({ active }: { active: CareerWikiRouteKey }) {
  return (
    <aside className="no-print hidden w-72 shrink-0 border-r border-line bg-surface-low px-4 py-6 lg:block">
      <Link href="/" className="flex items-center justify-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-mid">
        <Image src="/brand/lujie-mark.svg" alt="" width={38} height={38} className="shrink-0" priority />
        <span>
          <span className="block font-serif text-2xl font-semibold leading-none text-primary">录阶</span>
          <span className="mt-1 block text-[0.62rem] font-medium uppercase tracking-[0.24em] text-muted-foreground">Career Wiki</span>
        </span>
      </Link>

      <nav className="mt-7 space-y-5">
        <div className="space-y-1">
          {careerWikiPrimaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.key === active;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                  isActive ? "bg-surface-high text-primary shadow-[inset_0_0_0_1px_var(--border)]" : "text-foreground/80 hover:bg-surface-mid hover:text-foreground",
                )}
                title={item.description}
              >
                <Icon className="size-4 shrink-0" />
                <span className="min-w-0"><span className="block truncate">{item.label}</span><span className="block truncate text-[0.68rem] font-normal text-muted-foreground">{item.technicalLabel}</span></span>
              </Link>
            );
          })}
        </div>

        <details className="border-t border-line pt-4" open={!careerWikiPrimaryNavItems.some((item) => item.key === active)}>
          <summary className="cursor-pointer list-none rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-surface-mid hover:text-foreground">高级功能</summary>
          <div className="mt-4 space-y-6">
        {careerWikiAdvancedNavGroups.map((group) => (
          <div key={group.label} className="space-y-2">
            <p className="px-3 text-xs font-medium text-muted-foreground">{group.label}</p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = item.key === active || (active === "health" && item.key === "dashboard");
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-surface-high text-primary shadow-[inset_0_0_0_1px_var(--border)]"
                        : "text-foreground/80 hover:bg-surface-mid hover:text-foreground",
                    )}
                    title={item.description}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="min-w-0">
                      <span className="block truncate">{item.label}</span>
                      {item.technicalLabel ? <span className="block truncate text-[0.68rem] font-normal text-muted-foreground">{item.technicalLabel}</span> : null}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
          </div>
        </details>
      </nav>
      <div className="mt-8 border-t border-line pt-5 text-xs leading-5 text-muted-foreground">
        <p>本地优先，不接入自动投递。</p>
        <p>证据校验和审计日志保持开启。</p>
      </div>
    </aside>
  );
}
