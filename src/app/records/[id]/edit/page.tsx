import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { DeleteRecordButton } from "@/components/DeleteRecordButton";
import { RecordForm } from "@/components/RecordForm";
import { parseYearMonth } from "@/lib/format";
import { AuthRequiredError, getRecordById } from "@/lib/records";

export const dynamic = "force-dynamic";

export default async function EditRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let record;

  try {
    record = await getRecordById(id);
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      notFound();
    }
    throw error;
  }

  if (!record) {
    notFound();
  }

  const ym = parseYearMonth(record.workDate);

  return (
    <div className="flex min-h-dvh flex-col bg-surface text-on-surface">
      <div className="relative">
        <AppHeader backHref={`/month/${ym}`} title="编辑记录" />
        <div className="absolute right-6 top-4 z-[60]">
          <DeleteRecordButton currentYm={ym} id={record.id} returnTo={`/month/${ym}`} />
        </div>
      </div>
      <RecordForm record={record} />
    </div>
  );
}
