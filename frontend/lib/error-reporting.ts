/**
 * Client-side error reporting hook for the root error boundary.
 * Logs with route context; plug a telemetry backend here if needed.
 */
export function reportAppError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const message =
    error instanceof Response
      ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`
      : error instanceof Error
        ? error.message
        : String(error);
  console.error("[wizz]", message, {
    route: window.location.pathname,
    ...context,
    ...(error instanceof Error && { stack: error.stack }),
  });
}
