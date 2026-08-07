import { withSession } from "@/lib/neo4j";
import { CYPHER } from "@/lib/queries";
import { handleRouteError, jsonOk } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const retailers = await withSession(async (session) => {
      const result = await session.run(CYPHER.listRetailers);
      return result.records.map((record) => record.get("retailer"));
    });
    return jsonOk({ retailers });
  } catch (error) {
    return handleRouteError(error);
  }
}
