import Link from "next/link";

import { signOut } from "@/actions/auth";
import { getCurrentUser } from "@/lib/auth";

export async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="fixed top-0 z-50 h-16 w-full border-b border-default bg-surface">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        <Link href="/" className="text-base font-semibold text-text-primary">
          JobPilot
        </Link>

        {user ? (
          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/dashboard"
              className="text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              Dashboard
            </Link>
          </nav>
        ) : null}

        <div className="flex items-center gap-3">
          <Link
            href={user ? "/dashboard" : "/login"}
            className="h-9 rounded-xl bg-accent-primary px-4 py-2 text-sm font-medium text-bg-base transition-colors hover:bg-accent-hover hover:shadow-accent"
          >
            {user ? "Find Jobs" : "Login"}
          </Link>

          {user ? (
            <form action={signOut}>
              <button
                type="submit"
                className="h-9 rounded-xl border border-default bg-elevated px-4 text-sm font-medium text-text-secondary transition-colors hover:border-subtle hover:bg-subtle hover:text-text-primary"
              >
                Sign out
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </header>
  );
}
