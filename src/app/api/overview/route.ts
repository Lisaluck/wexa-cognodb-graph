import { withSession } from "@/lib/neo4j";
import { CYPHER } from "@/lib/queries";
import { handleRouteError, jsonOk, toNumber } from "@/lib/api";
import type { OverviewStats } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await withSession(async (session) => {
      const result = await session.run(CYPHER.overview);
      const record = result.records[0];
      if (!record) {
        return {
          farms: 0,
          batches: 0,
          facilities: 0,
          retailers: 0,
          recalls: 0,
          relationships: 0,
        } satisfies OverviewStats;
      }
      return {
        farms: toNumber(record.get("farms")),
        batches: toNumber(record.get("batches")),
        facilities: toNumber(record.get("facilities")),
        retailers: toNumber(record.get("retailers")),
        recalls: toNumber(record.get("recalls")),
        relationships: toNumber(record.get("relationships")),
      } satisfies OverviewStats;
    });
    return jsonOk(stats);
  } catch (error) {
    return handleRouteError(error);
  }
}
