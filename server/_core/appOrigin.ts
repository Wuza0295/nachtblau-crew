import type { Request } from "express";
import { ENV } from "./env";

function headerValue(req: Request, name: string): string {
  const value = req.headers[name];
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

/** Basis-URL für Bestätigungslinks. APP_BASE_URL hat Vorrang vor dem Request. */
export function resolveAppOrigin(req: Request): string {
  const configured = ENV.appBaseUrl.trim();
  if (configured) return configured.replace(/\/$/, "");

  const forwardedProto = headerValue(req, "x-forwarded-proto").split(",")[0]?.trim();
  const proto = forwardedProto || req.protocol || "http";
  const forwardedHost = headerValue(req, "x-forwarded-host").split(",")[0]?.trim();
  const host = forwardedHost || headerValue(req, "host");
  if (!host) return "http://localhost:3000";
  return `${proto}://${host}`;
}
