import { withSession } from "@/lib/neo4j";
import { CYPHER } from "@/lib/queries";
import { handleRouteError, jsonOk } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const farms = await withSession(async (session) => {
      const result = await session.run(CYPHER.listFarms);
      return result.records.map((record) => record.get("farm"));
    });
    return jsonOk({ farms });
  } catch (error) {
    return handleRouteError(error);
  }
}
