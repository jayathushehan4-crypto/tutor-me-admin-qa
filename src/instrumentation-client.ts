import * as Sentry from "@sentry/nextjs";

const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
const sentryEnvironment =
  process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT?.trim() ??
  process.env.VERCEL_ENV?.trim() ??
  process.env.NODE_ENV;

const isProductionLikeEnvironment =
  sentryEnvironment === "production" ||
  sentryEnvironment === "staging" ||
  sentryEnvironment === "preview";
const sentryEnabled = process.env.NEXT_PUBLIC_SENTRY_ENABLED?.trim();
const isExplicitlyEnabled = sentryEnabled === "true";
const isExplicitlyDisabled = sentryEnabled === "false";

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
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1,
    integrations: [
      Sentry.replayIntegration({
        blockAllMedia: true,
        maskAllText: true,
      }),
    ],
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
