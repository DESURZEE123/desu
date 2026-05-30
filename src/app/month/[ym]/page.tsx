import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { DayRecordList } from "@/components/DayRecordList";
import { getDayGroups, getGrandTotal } from "@/lib/aggregate";
import { formatMoney, monthLabel } from "@/lib/format";
import { AuthRequiredError, listRecordsByMonth } from "@/lib/records";
import type { WorkRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

function isYearMonth(value: string) {
  return /^\d{4}-\d{2}$/.test(value);
}

export default async function MonthPage({ params }: { params: Promise<{ ym: string }> }) {
  const { ym } = await params;

  if (!isYearMonth(ym)) {
    notFound();
  }

  let records: WorkRecord[];

  try {
    records = await listRecordsByMonth(ym);
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      records = [];
    } else {
      throw error;
    }
  }

  const total = getGrandTotal(records);
  const groups = getDayGroups(records);

  return (
    <div className="flex min-h-dvh flex-col bg-surface text-on-surface">
      <AppHeader addHref="/records/new" backHref="/" title={monthLabel(ym)} />

      <main className="flex-grow space-y-6 px-6 py-6 pb-10">
        <div className="flex items-center justify-between rounded-xl border border-primary/10 bg-primary-container/10 p-4">
          <span className="text-sm font-medium text-outline">当月合计</span>
          <span className="text-xl font-bold text-primary">{formatMoney(total)}</span>
        </div>

        <DayRecordList groups={groups} ym={ym} />
      </main>
    </div>
  );
}
