import { Edit3 } from "lucide-react";
import Link from "next/link";
import { DeleteRecordButton } from "@/components/DeleteRecordButton";
import { formatMoney } from "@/lib/format";
import type { DayGroup } from "@/lib/types";

export function DayRecordList({ groups, ym }: { groups: DayGroup[]; ym: string }) {
  if (!groups.length) {
    return <p className="text-sm text-outline">暂无记录</p>;
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm" key={group.date}>
          <div className="flex items-center justify-between bg-surface-container px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="font-display text-2xl font-extrabold text-primary">
                {group.day}
              </span>
              <span className="text-sm text-outline">日</span>
            </div>
            <span className="text-sm font-bold text-on-surface">{formatMoney(group.total)}</span>
          </div>

          <div className="px-4">
            {group.records.map((record) => (
              <div
                className="flex items-center justify-between border-b border-outline-variant/30 py-3 last:border-0"
                key={record.id}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-on-surface">{record.styleName}</p>
                  <p className="text-sm text-outline">
                    {record.quantity}件 x {formatMoney(record.unitPrice)}
                  </p>
                  {record.note ? (
                    <p className="mt-0.5 truncate text-xs text-outline/70">{record.note}</p>
                  ) : null}
                </div>

                <div className="ml-3 flex shrink-0 items-center gap-2">
                  <span className="font-bold text-primary">
                    {formatMoney(record.quantity * record.unitPrice)}
                  </span>
                  <Link
                    aria-label="编辑记录"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-outline transition-colors hover:bg-surface-container"
                    href={`/records/${record.id}/edit`}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Link>
                  <DeleteRecordButton currentYm={ym} id={record.id} returnTo={`/month/${ym}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
