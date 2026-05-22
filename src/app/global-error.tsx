"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-12 text-gray-900">
          <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-wide text-brand-500">
              Something went wrong
            </p>
            <h1 className="mt-3 text-2xl font-semibold">
              The dashboard needs a refresh.
            </h1>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              An unexpected error stopped this page from rendering.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-6 rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
