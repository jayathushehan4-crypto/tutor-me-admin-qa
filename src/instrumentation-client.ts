import * as Sentry from "@sentry/nextjs";
import { isSentryEnabled, sentryBaseConfig } from "@/lib/sentry";

if (isSentryEnabled) {
  Sentry.init({
    ...sentryBaseConfig,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1,
    integrations: [
      ...sentryBaseConfig.integrations,
      Sentry.replayIntegration({
        blockAllMedia: true,
        maskAllText: true,
      }),
    ],
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
