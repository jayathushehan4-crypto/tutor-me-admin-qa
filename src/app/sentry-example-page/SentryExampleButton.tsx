"use client";

import * as Sentry from "@sentry/nextjs";
import { useState } from "react";

type SentEvent = {
  id: string;
  sentAt: string;
};

export const SentryExampleButton = () => {
  const [status, setStatus] = useState<string | null>(null);
  const [sentEvents, setSentEvents] = useState<SentEvent[]>([]);

  const handleClick = async () => {
    const client = Sentry.getClient();

    if (!client) {
      setStatus("Sentry is not initialized in this browser session.");
      return;
    }

    const sentAt = new Date().toISOString();
    const eventId = Sentry.captureException(new Error(`Sentry smoke test ${sentAt}`), {
      tags: {
        smoke_test: "sentry-example-page",
      },
      extra: {
        sentAt,
      },
    });

    await Sentry.flush(3000);
    setStatus(`Sentry test event sent. Event ID: ${eventId}`);
    setSentEvents((events) => [{ id: eventId, sentAt }, ...events].slice(0, 5));
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleClick}
        className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
      >
        Send test error
      </button>
      {status ? (
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {status}
        </p>
      ) : null}
      {sentEvents.length > 0 ? (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
          <p className="font-medium text-gray-800 dark:text-white">Recent test events</p>
          <ul className="mt-2 space-y-1">
            {sentEvents.map((event) => (
              <li key={event.id}>
                <span className="font-mono">{event.id}</span>
                <span className="ml-2">{event.sentAt}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
};
