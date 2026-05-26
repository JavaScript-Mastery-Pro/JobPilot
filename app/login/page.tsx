import { startOAuth } from "@/actions/auth";
import { Navbar } from "@/components/layout/Navbar";

type Props = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  callback_failed: "We could not finish signing you in. Try again.",
  exchange_failed: "The OAuth session expired. Start sign in again.",
  missing_verifier: "The OAuth verifier was missing. Start sign in again.",
  oauth_failed: "The OAuth provider returned an error. Try again.",
  oauth_init_failed:
    "We could not start OAuth because the backend auth configuration is unavailable.",
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const errorMessage = params.error ? errorMessages[params.error] : undefined;
  const nextPath = params.next?.startsWith("/") ? params.next : "/dashboard";
  const googleAction = startOAuth.bind(null, "google");
  const githubAction = startOAuth.bind(null, "github");

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-base px-6 pt-16">
        <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center py-16">
          <div className="w-full max-w-md rounded-2xl border border-default bg-surface p-6 shadow-card">
            <div className="mb-6">
              <p className="text-sm font-medium text-accent-text">JobPilot</p>
              <h1 className="mt-2 text-3xl font-semibold text-text-primary">
                Sign in to continue
              </h1>
              <p className="mt-3 text-sm leading-6 text-text-secondary">
                Connect with Google or GitHub to start setting up your automated
                job search workspace.
              </p>
            </div>

            {errorMessage ? (
              <div className="mb-4 rounded-xl border border-state-error/20 bg-state-error-dim px-3 py-2 text-sm text-state-error">
                {errorMessage}
              </div>
            ) : null}

            <div className="flex flex-col gap-3">
              <form action={googleAction}>
                <input type="hidden" name="next" value={nextPath} />
                <button
                  type="submit"
                  className="h-10 w-full rounded-xl bg-accent-primary px-4 text-sm font-medium text-bg-base transition-colors hover:bg-accent-hover hover:shadow-accent"
                >
                  Continue with Google
                </button>
              </form>

              <form action={githubAction}>
                <input type="hidden" name="next" value={nextPath} />
                <button
                  type="submit"
                  className="h-10 w-full rounded-xl border border-default bg-elevated px-4 text-sm font-medium text-text-secondary transition-colors hover:border-subtle hover:bg-subtle hover:text-text-primary"
                >
                  Continue with GitHub
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
