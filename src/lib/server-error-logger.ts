type ErrorRecord = {
  name: string;
  message: string;
  stack?: string;
  digest?: string;
};

type LogLevel = "error" | "warn";

type LogContext = {
  source: string;
  [key: string]: unknown;
};

function normalizeError(error: unknown): ErrorRecord {
  if (error instanceof Error) {
    const withDigest = error as Error & { digest?: unknown };
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      digest: typeof withDigest.digest === "string" ? withDigest.digest : undefined,
    };
  }

  if (typeof error === "string") {
    return { name: "Error", message: error };
  }

  return { name: "UnknownError", message: "Unknown error payload." };
}

function writeLog(level: LogLevel, error: unknown, context: LogContext) {
  const normalized = normalizeError(error);
  const payload = {
    level,
    timestamp: new Date().toISOString(),
    source: context.source,
    error: normalized,
    context,
  };

  if (level === "warn") {
    console.warn(JSON.stringify(payload));
    return;
  }

  console.error(JSON.stringify(payload));
}

export function logServerError(error: unknown, context: LogContext) {
  writeLog("error", error, context);
}

export function logServerWarning(error: unknown, context: LogContext) {
  writeLog("warn", error, context);
}
