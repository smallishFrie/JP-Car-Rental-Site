import { logServerError } from "@/lib/server-error-logger";

type RequestLike = {
  method?: string;
  path?: string;
  headers?: Headers;
};

type ContextLike = {
  routerKind?: string;
  routePath?: string;
  routeType?: string;
  renderSource?: string;
  renderType?: string;
  revalidateReason?: string;
};

export async function register() {
  if (process.env.NODE_ENV === "production") {
    console.info("[instrumentation] Server error instrumentation is active.");
  }
}

export async function onRequestError(error: unknown, request: RequestLike, context: ContextLike) {
  logServerError(error, {
    source: "next/onRequestError",
    method: request.method ?? "unknown",
    path: request.path ?? "unknown",
    routerKind: context.routerKind ?? "unknown",
    routePath: context.routePath ?? "unknown",
    routeType: context.routeType ?? "unknown",
    renderSource: context.renderSource ?? "unknown",
    renderType: context.renderType ?? "unknown",
    revalidateReason: context.revalidateReason ?? "none",
    userAgent: request.headers?.get("user-agent") ?? "unknown",
  });
}
