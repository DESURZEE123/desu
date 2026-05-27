"use client";

import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { saveRecordAction } from "@/app/actions";
import { formatMoney, todayISODate } from "@/lib/format";
import type { WorkRecord } from "@/lib/types";
import { SubmitButton } from "@/components/SubmitButton";

export function RecordForm({ record }: { record?: WorkRecord | null }) {
  const [quantity, setQuantity] = useState(record?.quantity ? String(record.quantity) : "");
  const [unitPrice, setUnitPrice] = useState(record?.unitPrice ? String(record.unitPrice) : "");

  const subtotal = useMemo(() => {
    const qty = Number(quantity) || 0;
    const price = Number(unitPrice) || 0;
    return qty * price;
  }, [quantity, unitPrice]);

  return (
    <form action={saveRecordAction}>
      <main className="mx-auto w-full max-w-lg flex-grow space-y-6 px-6 py-8 pb-32">
        <input name="id" type="hidden" value={record?.id ?? ""} />

        <div className="group">
          <label className="mb-2 ml-1 block text-sm font-medium text-outline" htmlFor="workDate">
            录入日期
          </label>
          <div className="relative">
            <input
              className="w-full rounded-lg border-none bg-surface-container-low px-4 py-3.5 text-md text-on-surface transition-colors"
              defaultValue={record?.workDate ?? todayISODate()}
              id="workDate"
              name="workDate"
              required
              type="date"
            />
            <CalendarDays className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-outline" />
          </div>
        </div>

        <div className="group">
          <label className="mb-2 ml-1 block text-sm font-medium text-outline" htmlFor="styleName">
            款式名称
          </label>
          <input
            className="w-full rounded-lg border-none bg-surface-container-low px-4 py-3.5 text-md text-on-surface transition-colors"
            defaultValue={record?.styleName ?? ""}
            id="styleName"
            name="styleName"
            placeholder="例如：简约款A型"
            required
            type="text"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="group">
            <label className="mb-2 ml-1 block text-sm font-medium text-outline" htmlFor="quantity">
              件数
            </label>
            <input
              className="w-full rounded-lg border-none bg-surface-container-low px-4 py-3.5 text-md text-on-surface transition-colors"
              id="quantity"
              min="1"
              name="quantity"
              onChange={(event) => setQuantity(event.target.value)}
              placeholder="0"
              required
              type="number"
              value={quantity}
            />
          </div>

          <div className="group">
            <label className="mb-2 ml-1 block text-sm font-medium text-outline" htmlFor="unitPrice">
              单价 (¥)
            </label>
            <input
              className="w-full rounded-lg border-none bg-surface-container-low px-4 py-3.5 text-md text-on-surface transition-colors"
              id="unitPrice"
              min="0"
              name="unitPrice"
              onChange={(event) => setUnitPrice(event.target.value)}
              placeholder="0.00"
              required
              step="0.01"
              type="number"
              value={unitPrice}
            />
          </div>
        </div>

        <div className="group">
          <label className="mb-2 ml-1 block text-sm font-medium text-outline" htmlFor="note">
            特殊说明
          </label>
          <textarea
            className="w-full resize-none rounded-lg border-none bg-surface-container-low px-4 py-3.5 text-md text-on-surface transition-colors"
            defaultValue={record?.note ?? ""}
            id="note"
            name="note"
            placeholder="可填写特殊说明..."
            rows={4}
          />
        </div>

        <div className="rounded-xl border border-primary/10 bg-primary-container/10 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-on-secondary-fixed-variant">本条小计</span>
            <span className="text-lg font-bold text-primary">{formatMoney(subtotal)}</span>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 z-40 w-full bg-slate-50/90 px-6 pb-10 pt-4 backdrop-blur-xl">
        <div className="mx-auto max-w-lg">
          <SubmitButton idleText="保存记录" pendingText="保存中..." />
        </div>
      </div>
    </form>
  );
}
