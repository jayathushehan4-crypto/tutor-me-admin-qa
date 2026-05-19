import { SentryExampleButton } from "./SentryExampleButton";

export default function SentryExamplePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-12 text-gray-900 dark:bg-gray-900 dark:text-white">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-500">
          Sentry verification
        </p>
        <h1 className="mt-3 text-2xl font-semibold">Send a sample error</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
          Use this page after adding the Sentry DSN in your environment. This
          sends an error event without crashing the page.
        </p>
        <div className="mt-6">
          <SentryExampleButton />
        </div>
      </div>
    </main>
  );
}
