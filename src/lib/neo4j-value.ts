import type { Integer } from "neo4j-driver";

export function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "toNumber" in value) {
    return (value as Integer).toNumber();
  }
  return Number(value ?? 0);
}

export function nodeProps(
  value: unknown,
): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  const maybeNode = value as {
    properties?: Record<string, unknown>;
    id?: unknown;
  };
  if (maybeNode.properties && typeof maybeNode.properties === "object") {
    return maybeNode.properties;
  }
  return maybeNode as Record<string, unknown>;
}

export function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
}
