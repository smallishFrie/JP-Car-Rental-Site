import { NextResponse } from "next/server";
import { logServerError } from "@/lib/server-error-logger";

type ClientErrorPayload = {
  source?: unknown;
  message?: unknown;
  digest?: unknown;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ClientErrorPayload;
    const source =
      typeof payload.source === "string" && payload.source.trim()
        ? payload.source.trim()
        : "client-boundary";
    const message =
      typeof payload.message === "string" && payload.message.trim()
        ? payload.message.trim()
        : "Client boundary captured an error.";
    const digest = typeof payload.digest === "string" ? payload.digest : undefined;

    const error = new Error(message);
    if (digest) {
      (error as Error & { digest?: string }).digest = digest;
    }

    logServerError(error, {
      source,
      category: "client_boundary",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    logServerError(error, {
      source: "api/log-client-error",
      category: "client_boundary_logging_failure",
    });
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
