import { context, trace } from "@opentelemetry/api";
import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { AsyncLocalStorage } from "node:async_hooks";

const requestContext = new AsyncLocalStorage<{ requestId: string }>();

export function getRequestId() {
  return requestContext.getStore()?.requestId;
}

export function runWithRequestId<T>(requestId: string, fn: () => T): T {
  return requestContext.run({ requestId }, fn);
}

export function createTracingMiddleware(serviceName: string) {
  const tracer = trace.getTracer(serviceName);

  return function tracingMiddleware(req: Request, res: Response, next: NextFunction) {
    const requestId =
      (typeof req.headers["x-request-id"] === "string" && req.headers["x-request-id"]) ||
      randomUUID();

    res.setHeader("x-request-id", requestId);

    const span = tracer.startSpan(`${req.method} ${req.path}`, {
      attributes: {
        "http.method": req.method,
        "http.route": req.path,
        "service.name": serviceName,
        "request.id": requestId,
      },
    });

    const startedAt = Date.now();

    runWithRequestId(requestId, () => {
      res.on("finish", () => {
        span.setAttribute("http.status_code", res.statusCode);
        span.end();

        console.log(
          JSON.stringify({
            level: "info",
            service: serviceName,
            requestId,
            method: req.method,
            path: req.path,
            status: res.statusCode,
            durationMs: Date.now() - startedAt,
          }),
        );
      });

      context.with(trace.setSpan(context.active(), span), () => next());
    });
  };
}
