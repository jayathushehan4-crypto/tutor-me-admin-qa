import * as Sentry from "@sentry/nextjs";
import { appEnvironment } from "@/lib/sentry";
import { NextResponse } from "next/server";

export async function GET() {
  if (appEnvironment === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  Sentry.metrics.count("test_metric", 1);
  await Sentry.flush(2000);

  return NextResponse.json({
    ok: true,
    metric: "test_metric",
    environment: appEnvironment,
  });
}
