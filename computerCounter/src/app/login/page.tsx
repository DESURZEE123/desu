"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, UserCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function authenticate(form: HTMLFormElement | null, mode: "signin" | "signup") {
    if (!form) return;

    setMessage("");
    setIsPending(true);

    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const supabase = createClient();

    try {
      const { error } =
        mode === "signin"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password });

      if (error) {
        setMessage(error.message);
        return;
      }

      if (mode === "signup") {
        setMessage("注册成功。如果 Supabase 开启了邮箱验证，请先去邮箱完成确认。");
      }

      router.replace("/");
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface px-6 py-10 text-on-surface">
      <section className="w-full max-w-md space-y-8">
        <div className="space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
            <UserCircle className="h-8 w-8" />
          </div>
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-outline">
              工作记录追踪器
            </p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-primary">
              登录后开始记录收益
            </h1>
          </div>
        </div>

        <form
          className="space-y-4 rounded-xl bg-surface-container-lowest p-5 shadow-sm"
          onSubmit={(event) => {
            event.preventDefault();
            authenticate(event.currentTarget, "signin");
          }}
        >
          <div>
            <label className="mb-2 ml-1 block text-sm font-medium text-outline" htmlFor="email">
              邮箱
            </label>
            <input
              className="w-full rounded-lg border-none bg-surface-container-low px-4 py-3.5 text-on-surface"
              id="email"
              name="email"
              placeholder="you@example.com"
              required
              type="email"
            />
          </div>

          <div>
            <label className="mb-2 ml-1 block text-sm font-medium text-outline" htmlFor="password">
              密码
            </label>
            <input
              className="w-full rounded-lg border-none bg-surface-container-low px-4 py-3.5 text-on-surface"
              id="password"
              minLength={6}
              name="password"
              placeholder="至少 6 位"
              required
              type="password"
            />
          </div>

          {message ? (
            <p className="rounded-lg bg-surface-container-low px-3 py-2 text-sm text-on-surface-variant">
              {message}
            </p>
          ) : null}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 font-bold text-on-primary transition-all active:scale-95 disabled:opacity-60"
              disabled={isPending}
              onClick={(event) => authenticate(event.currentTarget.form, "signin")}
              type="button"
            >
              <LockKeyhole className="h-4 w-4" />
              登录
            </button>
            <button
              className="rounded-xl bg-surface-container-high px-4 py-3.5 font-bold text-on-surface-variant transition-all active:scale-95 disabled:opacity-60"
              disabled={isPending}
              onClick={(event) => authenticate(event.currentTarget.form, "signup")}
              type="button"
            >
              注册
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
