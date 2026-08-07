import { NextResponse } from "next/server";
import { isDbError } from "./neo4j";
import type { ApiErrorBody } from "./types";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonError(
  error: string,
  code: ApiErrorBody["code"],
  status: number,
) {
  const body: ApiErrorBody = { error, code };
  return NextResponse.json(body, { status });
}

export function handleRouteError(error: unknown) {
  console.error(error);
  if (isDbError(error)) {
    return jsonError(
      "CognoDB is unreachable. Check your NEO4J_URI, credentials, and that the instance is running.",
      "DB_UNREACHABLE",
      503,
    );
  }
  if (error instanceof Error && error.message.includes("NEO4J_")) {
    return jsonError(error.message, "DB_UNREACHABLE", 503);
  }
  return jsonError("Unexpected server error.", "INTERNAL", 500);
}

export function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value ?? 0);
}
