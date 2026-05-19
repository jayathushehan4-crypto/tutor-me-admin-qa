import * as Sentry from "@sentry/nextjs";

const sentryDsn =
  process.env.SENTRY_DSN?.trim() ?? process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
const sentryEnvironment =
  process.env.SENTRY_ENVIRONMENT?.trim() ??
  process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT?.trim() ??
  process.env.VERCEL_ENV?.trim() ??
  process.env.NODE_ENV;

const isProductionLikeEnvironment =
  sentryEnvironment === "production" ||
  sentryEnvironment === "staging" ||
  sentryEnvironment === "preview";
const isExplicitlyEnabled =
  process.env.SENTRY_ENABLED?.trim() === "true" ||
  process.env.NEXT_PUBLIC_SENTRY_ENABLED?.trim() === "true";
const isExplicitlyDisabled =
  process.env.SENTRY_ENABLED?.trim() === "false" ||
  process.env.NEXT_PUBLIC_SENTRY_ENABLED?.trim() === "false";

if (
  sentryDsn &&
  !isExplicitlyDisabled &&
  (isProductionLikeEnvironment || isExplicitlyEnabled)
) {
  Sentry.init({
    dsn: sentryDsn,
    environment: sentryEnvironment,
    enabled: true,
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
  });
}
