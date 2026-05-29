import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { MonthList } from "@/components/MonthList";
import { getGrandTotal, getMonthSummaries } from "@/lib/aggregate";
import { formatMoney } from "@/lib/format";
import { AuthRequiredError, listRecords } from "@/lib/records";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let records;

  try {
    records = await listRecords();
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      redirect("/login");
    }
    throw error;
  }

  const total = getGrandTotal(records);
  const months = getMonthSummaries(records);

  return (
    <div className="flex min-h-dvh flex-col bg-surface text-on-surface">
      <AppHeader addHref="/records/new" showSignOut title="工作记录" />

      <main className="flex-grow space-y-8 px-6 py-6 pb-10">
        <section className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-outline">总累计收益</p>
          <h2 className="font-display text-4xl font-extrabold text-primary">{formatMoney(total)}</h2>
        </section>

        <section className="space-y-4">
          <h3 className="font-headline text-lg font-bold">月度收益</h3>
          <MonthList months={months} />
        </section>
      </main>
    </div>
  );
}
