import { withSession } from "@/lib/neo4j";
import { CYPHER } from "@/lib/queries";
import { handleRouteError, jsonError, jsonOk, toNumber } from "@/lib/api";
import type { ConnectionPath, PathHop } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const farmId = searchParams.get("farmId");
    const retailerId = searchParams.get("retailerId");

    if (!farmId || !retailerId) {
      return jsonError(
        "Query params farmId and retailerId are required.",
        "BAD_REQUEST",
        400,
      );
    }

    const path = await withSession(async (session) => {
      const result = await session.run(CYPHER.shortestPath, {
        farmId,
        retailerId,
      });
      const record = result.records[0];
      if (!record) {
        return { found: false, length: 0, hops: [] } satisfies ConnectionPath;
      }

      const nodeHops = record.get("nodeHops") as Array<{
        id: string;
        label: string;
        name: string;
      }>;
      const relTypes = record.get("relTypes") as string[];
      const pathLength = toNumber(record.get("pathLength"));

      const hops: PathHop[] = nodeHops.map((node, index) => ({
        id: node.id,
        label: node.label,
        name: node.name,
        relationship: index === 0 ? undefined : relTypes[index - 1],
      }));

      return {
        found: hops.length > 0,
        length: pathLength,
        hops,
      } satisfies ConnectionPath;
    });

    return jsonOk(path);
  } catch (error) {
    return handleRouteError(error);
  }
}
