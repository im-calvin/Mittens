import Sentry from "@sentry/node";
import { ProfilingIntegration } from "@sentry/profiling-node";

export function init(): void {
  // inits Sentry
  Sentry.init({
    dsn: "https://c9c992d5a347411db99537a0ed2c0094@o4505106964742144.ingest.sentry.io/4505106967691264",
    integrations: [
      new ProfilingIntegration(),
      new Sentry.Integrations.Http({ tracing: true }),
      ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
    ],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
  });
}
