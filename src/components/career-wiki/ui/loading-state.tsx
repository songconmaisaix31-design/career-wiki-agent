import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState({ label = "正在加载数据" }: { label?: string }) {
  return (
    <div className="space-y-3 rounded-lg border border-line bg-surface p-4">
      <p className="text-sm font-medium">{label}</p>
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}
