import Link from "next/link";
import { GeistPixelSquare } from "geist/font/pixel";
import { HeroTerminal } from "@/components/hero-terminal";

export default function LandingPage() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pb-20 pt-16 sm:pt-24">
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl dark:text-neutral-50">
          Test agents and software against stateful API and database clones
        </h1>
        <p className="mb-8 max-w-xl text-base text-neutral-600 dark:text-neutral-400">
          Run production-shaped services locally: GitHub, Stripe, Slack, Postgres, MySQL, SQLite, DuckDB, warehouses,
          data lakes, and 180+ more. Same APIs, familiar errors, deterministic state, no real credentials.
        </p>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Link
            href="/docs"
            className="inline-flex h-9 items-center rounded-md bg-neutral-900 px-4 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Get started
          </Link>
          <a
            href="https://github.com/jsj/api-emulator"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-neutral-200 px-4 text-sm text-neutral-700 hover:border-neutral-300 dark:border-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-700"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            Source
          </a>
        </div>

        {/* Terminal */}
        <HeroTerminal pixelFont={GeistPixelSquare.className} />
      </section>

      {/* What you get */}
      <section className="border-t border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
          <h2 className="mb-6 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Move integration failures earlier
          </h2>
          <div className="grid gap-x-12 gap-y-6 sm:grid-cols-2">
            <div>
              <h3 className="mb-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                Write against real surfaces
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                REST, OAuth, SDK-compatible routes, SQL workflows, queues, webhooks, object storage, and provider-shaped
                errors.
              </p>
            </div>
            <div>
              <h3 className="mb-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                Run against stateful clones
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Create a GitHub repo, push commits, send mail, charge a card, mutate rows, then reset cleanly between
                scenarios.
              </p>
            </div>
            <div>
              <h3 className="mb-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                Cover API and database paths
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Test Postgres, MySQL, SQLite, DuckDB, warehouse, and lakehouse workflows without Docker or cloud
                accounts.
              </p>
            </div>
            <div>
              <h3 className="mb-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                Fail in CI before production
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Catch bad agent actions, SDK regressions, auth bugs, and schema assumptions before they reach users.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Code example */}
      <section className="border-t border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
          <h2 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Point your SDK at localhost
          </h2>
          <p className="mb-6 text-sm text-neutral-600 dark:text-neutral-400">
            Your existing code stays the same. Just change the host.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col">
              <div className="mb-2 text-xs font-medium text-neutral-500 dark:text-neutral-500">Before</div>
              <div className="flex-1 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-950 dark:border-neutral-800">
                <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-neutral-400 font-mono">
                  <code>{`const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY
)

// needs network
// needs a test-mode account
// rate-limited`}</code>
                </pre>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="mb-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">With api-emulator</div>
              <div className="flex-1 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-950 dark:border-neutral-800">
                <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-neutral-400 font-mono">
                  <code>
                    <span>{`const stripe = new Stripe("anything")
stripe.config.host = `}</span>
                    <span className="text-emerald-400">{`"localhost"`}</span>
                    {`\nstripe.config.port = `}
                    <span className="text-emerald-400">{`4010`}</span>
                    {`\nstripe.config.protocol = `}
                    <span className="text-emerald-400">{`"http"`}</span>
                    {`\n\n// offline, instant, stateful`}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Usage modes */}
      <section className="border-t border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
          <h2 className="mb-6 text-lg font-semibold text-neutral-900 dark:text-neutral-100">Use it your way</h2>
          <div className="space-y-4">
            <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
              <div className="mb-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">CLI</div>
              <p className="mb-3 text-sm text-neutral-600 dark:text-neutral-400">
                Run alongside your dev server. Pick which services you need.
              </p>
              <div className="overflow-x-auto rounded-md bg-neutral-100 px-3 py-2 font-mono text-xs text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
                npx -p api-emulator api --service github,stripe
              </div>
            </div>
            <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
              <div className="mb-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">Programmatic API</div>
              <p className="mb-3 text-sm text-neutral-600 dark:text-neutral-400">
                Import into Vitest or Jest. Start per-suite, reset or replay fixtures between tests.
              </p>
              <div className="overflow-hidden rounded-md bg-neutral-100 dark:bg-neutral-900">
                <pre className="overflow-x-auto px-3 py-2 font-mono text-xs text-neutral-700 dark:text-neutral-300">
                  <code>{`import { createEmulator } from "api-emulator"

const github = await createEmulator({ service: "github", port: 4001 })
afterEach(() => github.reset())
afterAll(() => github.close())`}</code>
                </pre>
              </div>
            </div>
            <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
              <div className="mb-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">Next.js adapter</div>
              <p className="mb-3 text-sm text-neutral-600 dark:text-neutral-400">
                Embed in your app. Same origin, no CORS issues, works on Vercel preview deployments.
              </p>
              <div className="overflow-x-auto rounded-md bg-neutral-100 px-3 py-2 font-mono text-xs text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
                npm install @api-emulator/adapter-next @api-emulator/core
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <Link href="/" className="hover:text-neutral-900 dark:hover:text-neutral-300 transition-colors">
              <span aria-hidden="true">🧩</span>
            </Link>
            <span className="dark:text-neutral-500">api-emulator</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-neutral-500">
            <Link href="/docs" className="hover:text-neutral-900 dark:hover:text-neutral-300 transition-colors">
              Docs
            </Link>
            <a
              href="https://github.com/jsj/api-emulator"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-neutral-900 dark:hover:text-neutral-300 transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://www.npmjs.com/package/api-emulator"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-neutral-900 dark:hover:text-neutral-300 transition-colors"
            >
              npm
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
