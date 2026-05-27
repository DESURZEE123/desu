"use client";

import { Trash2 } from "lucide-react";
import { deleteRecordAction } from "@/app/actions";

type DeleteRecordButtonProps = {
  id: string;
  returnTo: string;
  currentYm?: string;
  variant?: "icon" | "full";
};

export function DeleteRecordButton({
  id,
  returnTo,
  currentYm = "",
  variant = "icon"
}: DeleteRecordButtonProps) {
  return (
    <form
      action={deleteRecordAction}
      onSubmit={(event) => {
        if (!window.confirm("确定要删除这条记录吗？此操作无法撤销。")) {
          event.preventDefault();
        }
      }}
    >
      <input name="id" type="hidden" value={id} />
      <input name="returnTo" type="hidden" value={returnTo} />
      <input name="currentYm" type="hidden" value={currentYm} />
      <button
        aria-label="删除记录"
        className={
          variant === "full"
            ? "flex w-full items-center justify-center gap-2 rounded-xl bg-error px-4 py-3.5 font-bold text-on-error transition-all active:scale-95"
            : "flex h-8 w-8 items-center justify-center rounded-lg text-error transition-colors hover:bg-error-container/30"
        }
        type="submit"
      >
        <Trash2 className="h-4 w-4" />
        {variant === "full" ? <span>删除记录</span> : null}
      </button>
    </form>
  );
}
