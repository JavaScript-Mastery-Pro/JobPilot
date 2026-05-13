import Link from "next/link";

export function Navbar() {
  return (
    <nav className="fixed top-0 z-50 h-16 w-full bg-surface border-b border-border-default">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        <Link
          href="/"
          className="text-primary font-semibold text-base tracking-tight"
        >
          JobPilot
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-sm text-muted hover:text-secondary transition-colors duration-150"
          >
            Dashboard
          </Link>
          <Link
            href="/profile"
            className="text-sm text-muted hover:text-secondary transition-colors duration-150"
          >
            Profile
          </Link>
          <Link
            href="/login"
            className="h-9 px-4 rounded-xl bg-accent-primary hover:bg-accent-hover text-bg-base text-sm font-medium transition-colors duration-150 inline-flex items-center"
          >
            Find Jobs
          </Link>
        </div>
      </div>
    </nav>
  );
}
