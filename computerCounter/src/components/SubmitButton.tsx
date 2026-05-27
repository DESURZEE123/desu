"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ idleText, pendingText }: { idleText: string; pendingText: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="w-full rounded-xl bg-primary-container py-4 font-headline font-bold text-on-primary-container shadow-lg transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? pendingText : idleText}
    </button>
  );
}
