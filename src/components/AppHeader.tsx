import Link from "next/link";
import { ArrowLeft, LogOut, Plus, UserCircle } from "lucide-react";
import { signOutAction } from "@/app/actions";

type AppHeaderProps = {
  title: string;
  backHref?: string;
  addHref?: string;
  showSignOut?: boolean;
};

export function AppHeader({ title, backHref, addHref, showSignOut = false }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex w-full items-center justify-between bg-slate-50/90 px-6 py-4 shadow-sm backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-3">
        {backHref ? (
          <Link
            aria-label="返回"
            className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-200/50"
            href={backHref}
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
            <UserCircle className="h-5 w-5" />
          </div>
        )}
        <h1 className="truncate text-xl font-bold tracking-tight text-on-surface">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {showSignOut ? (
          <form action={signOutAction}>
            <button
              aria-label="退出登录"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-low text-outline transition-colors hover:bg-surface-container"
              type="submit"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </form>
        ) : null}

        {addHref ? (
          <Link
            aria-label="新增记录"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-on-primary transition-all hover:opacity-80 active:scale-95"
            href={addHref}
          >
            <Plus className="h-5 w-5" />
          </Link>
        ) : null}
      </div>
    </header>
  );
}
