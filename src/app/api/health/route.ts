import { verifyConnectivity } from "@/lib/neo4j";
import { handleRouteError, jsonOk } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await verifyConnectivity();
    return jsonOk({ ok: true, database: "cognodb" });
  } catch (error) {
    return handleRouteError(error);
  }
}
