import { withSession } from "@/lib/neo4j";
import { CYPHER } from "@/lib/queries";
import { handleRouteError, jsonOk, toNumber } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const recalls = await withSession(async (session) => {
      const result = await session.run(CYPHER.listRecalls);
      return result.records.map((record) => {
        const recall = record.get("recall");
        return {
          ...recall,
          batchCount: toNumber(record.get("batchCount")),
        };
      });
    });
    return jsonOk({ recalls });
  } catch (error) {
    return handleRouteError(error);
  }
}
