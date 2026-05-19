"use client";

export const SentryExampleButton = () => {
  const handleClick = () => {
    throw new Error("Sentry example page test error");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
    >
      Trigger test error
    </button>
  );
};
