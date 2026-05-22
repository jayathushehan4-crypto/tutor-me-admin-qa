const SENTRY_ENABLED_ENVS = ["production", "staging"];

const readEnv = (value: string | undefined) => value?.trim() ?? "";

export const sentryDsn = readEnv(process.env.NEXT_PUBLIC_SENTRY_DSN);

export const appEnvironment =
  readEnv(process.env.NEXT_PUBLIC_APP_ENV) || "development";

export const sentryRelease =
  readEnv(process.env.NEXT_PUBLIC_SENTRY_RELEASE) ||
  readEnv(process.env.SENTRY_RELEASE) ||
  undefined;

export const isSentryEnabled =
  Boolean(sentryDsn) && SENTRY_ENABLED_ENVS.includes(appEnvironment);

export const sentryBaseConfig = {
  dsn: sentryDsn,
  environment: appEnvironment,
  enabled: isSentryEnabled,
  release: sentryRelease,
  autoSessionTracking: true,
  sendDefaultPii: false,
  tracesSampleRate: appEnvironment === "production" ? 0.1 : 1.0,
};
