"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createRecord,
  deleteRecord,
  normalizeRecordInput,
  updateRecord
} from "@/lib/records";
import { parseYearMonth } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export async function saveRecordAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const input = normalizeRecordInput({
    workDate: String(formData.get("workDate") ?? ""),
    styleName: String(formData.get("styleName") ?? ""),
    quantity: Number(formData.get("quantity")),
    unitPrice: Number(formData.get("unitPrice")),
    note: String(formData.get("note") ?? "")
  });

  const record = id ? await updateRecord(id, input) : await createRecord(input);
  const ym = parseYearMonth(record.workDate);

  revalidatePath("/");
  revalidatePath(`/month/${ym}`);
  redirect(`/month/${ym}`);
}

export async function deleteRecordAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const returnTo = String(formData.get("returnTo") ?? "/").trim() || "/";
  const currentYm = String(formData.get("currentYm") ?? "").trim();

  if (id) {
    await deleteRecord(id);
  }

  revalidatePath("/");
  if (currentYm) {
    revalidatePath(`/month/${currentYm}`);
  }

  redirect(returnTo);
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
