import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-default bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-text-muted md:flex-row md:items-center md:justify-between">
        <p>JobPilot automates the repetitive parts of technical job search.</p>
        <div className="flex items-center gap-5">
          <Link
            href="/dashboard"
            className="transition-colors hover:text-text-secondary"
          >
            Dashboard
          </Link>
          <Link href="/profile" className="transition-colors hover:text-text-secondary">
            Profile
          </Link>
          <Link href="/login" className="transition-colors hover:text-text-secondary">
            Get Started
          </Link>
        </div>
      </div>
    </footer>
  );
}
