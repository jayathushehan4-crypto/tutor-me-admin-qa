import * as Sentry from "@sentry/nextjs";

const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const sentryEnvironment =
  process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ??
  process.env.VERCEL_ENV ??
  process.env.NODE_ENV;

const isProductionLikeEnvironment =
  sentryEnvironment === "production" ||
  sentryEnvironment === "staging" ||
  sentryEnvironment === "preview";
const isExplicitlyEnabled = process.env.NEXT_PUBLIC_SENTRY_ENABLED === "true";
const isExplicitlyDisabled = process.env.NEXT_PUBLIC_SENTRY_ENABLED === "false";

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
