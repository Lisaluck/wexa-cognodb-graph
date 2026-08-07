import neo4j, { Driver, Session } from "neo4j-driver";

let driver: Driver | null = null;

export function getDriver(): Driver {
  if (driver) return driver;

  const uri = process.env.NEO4J_URI;
  const user = process.env.NEO4J_USER ?? "cognodb";
  const password = process.env.NEO4J_PASSWORD;

  if (!uri || !password) {
    throw new Error(
      "Missing NEO4J_URI or NEO4J_PASSWORD. Copy .env.example to .env.local and fill in your CognoDB credentials.",
    );
  }

  driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
    maxConnectionPoolSize: 10,
    connectionAcquisitionTimeout: 10000,
  });

  return driver;
}

export async function withSession<T>(
  work: (session: Session) => Promise<T>,
): Promise<T> {
  const session = getDriver().session();
  try {
    return await work(session);
  } finally {
    await session.close();
  }
}

export async function verifyConnectivity(): Promise<void> {
  await getDriver().verifyConnectivity();
}

export function isDbError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; name?: string; message?: string };
  if (typeof e.code === "string" && e.code.startsWith("ServiceUnavailable")) {
    return true;
  }
  if (e.name === "Neo4jError" && typeof e.message === "string") {
    return (
      e.message.includes("Failed to connect") ||
      e.message.includes("No routing servers") ||
      e.message.includes("Connection refused") ||
      e.message.includes("ECONNREFUSED") ||
      e.message.includes("ENOTFOUND") ||
      e.message.includes("certificate")
    );
  }
  if (error instanceof Error) {
    return (
      error.message.includes("NEO4J_") ||
      error.message.includes("Failed to connect") ||
      error.message.includes("ECONNREFUSED") ||
      error.message.includes("ENOTFOUND")
    );
  }
  return false;
}
