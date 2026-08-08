import { NextResponse } from "next/server";
import { isDbError } from "./neo4j";
import { toNumber } from "./neo4j-value";
import type { ApiErrorBody } from "./types";

export { toNumber };

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
  const message =
    error instanceof Error ? error.message : "Unexpected server error.";
  return jsonError(message || "Unexpected server error.", "INTERNAL", 500);
}
