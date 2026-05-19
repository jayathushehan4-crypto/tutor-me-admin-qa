import * as Sentry from "@sentry/nextjs";

const sentryDsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
const sentryEnvironment =
  process.env.SENTRY_ENVIRONMENT ??
  process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ??
  process.env.VERCEL_ENV ??
  process.env.NODE_ENV;

const isProductionLikeEnvironment =
  sentryEnvironment === "production" ||
  sentryEnvironment === "staging" ||
  sentryEnvironment === "preview";
const isExplicitlyEnabled =
  process.env.SENTRY_ENABLED === "true" ||
  process.env.NEXT_PUBLIC_SENTRY_ENABLED === "true";
const isExplicitlyDisabled =
  process.env.SENTRY_ENABLED === "false" ||
  process.env.NEXT_PUBLIC_SENTRY_ENABLED === "false";

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
