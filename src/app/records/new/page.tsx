import { AppHeader } from "@/components/AppHeader";
import { RecordForm } from "@/components/RecordForm";

export const dynamic = "force-dynamic";

export default async function NewRecordPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface text-on-surface">
      <AppHeader backHref="/" title="新建记录" />
      <RecordForm />
    </div>
  );
}
