import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { RecordForm } from "@/components/RecordForm";
import { AuthRequiredError, getCurrentUser } from "@/lib/records";

export const dynamic = "force-dynamic";

export default async function NewRecordPage() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      redirect("/login");
    }
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      redirect("/login");
    }
    throw error;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface text-on-surface">
      <AppHeader backHref="/" title="新建记录" />
      <RecordForm />
    </div>
  );
}
