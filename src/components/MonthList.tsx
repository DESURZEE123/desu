import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { formatMoney } from "@/lib/format";
import type { MonthSummary } from "@/lib/types";

export function MonthList({ months }: { months: MonthSummary[] }) {
  if (!months.length) {
    return <p className="text-sm text-outline">暂无记录</p>;
  }

  return (
    <div className="space-y-3">
      {months.map((month) => (
        <div className="rounded-xl bg-surface-container-low p-1" key={month.ym}>
          <Link
            className="group flex items-center justify-between rounded-lg bg-surface-container-lowest p-4 transition-all hover:bg-slate-50 active:scale-[0.98]"
            href={`/month/${month.ym}`}
          >
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-surface-container">
                <span className="text-[10px] font-bold uppercase text-outline">
                  {month.ym.split("-")[1]}月
                </span>
                <span className="text-lg font-bold leading-none">
                  {month.ym.split("-")[0].slice(2)}
                </span>
              </div>
              <div className="min-w-0">
                <h4 className="truncate font-bold text-on-surface">{month.label}</h4>
                <p className="text-sm text-outline">{month.quantity} 件</p>
              </div>
            </div>
            <div className="ml-3 flex shrink-0 items-center gap-1 text-right">
              <p className="text-lg font-bold text-primary">{formatMoney(month.total)}</p>
              <ChevronRight className="h-5 w-5 text-outline transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}
