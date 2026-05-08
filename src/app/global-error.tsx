"use client";

import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    void fetch("/api/log-client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "app/global-error-boundary",
        message: error.message,
        digest: error.digest,
      }),
    }).catch(() => undefined);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-white text-black dark:bg-black dark:text-white">
        <main className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 px-6 py-16 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Unexpected application error</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Please refresh or try again in a few moments.
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
          >
            Reload
          </button>
        </main>
      </body>
    </html>
  );
}
