import { withSession } from "@/lib/neo4j";
import { CYPHER } from "@/lib/queries";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { asString, toNumber } from "@/lib/neo4j-value";
import type { RecallTrace, TraceEdge, TraceNode } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanNodes(nodes: TraceNode[]): TraceNode[] {
  const map = new Map<string, TraceNode>();
  for (const node of nodes ?? []) {
    if (!node?.id || !node.name) continue;
    map.set(node.id, node);
  }
  return Array.from(map.values());
}

function cleanEdges(edges: TraceEdge[]): TraceEdge[] {
  return (edges ?? []).filter(
    (edge) => edge?.from && edge?.to && edge?.type && edge.from !== edge.to,
  );
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!id) return jsonError("Missing recall id.", "BAD_REQUEST", 400);

    const trace = await withSession(async (session) => {
      const detailResult = await session.run(CYPHER.recallTrace, {
        recallId: id,
      });
      const detail = detailResult.records[0];
      if (!detail) return null;

      const graphResult = await session.run(CYPHER.recallGraph, {
        recallId: id,
      });
      const riskResult = await session.run(CYPHER.retailersAtRisk, {
        recallId: id,
      });

      const recall = detail.get("recall") as RecallTrace["recall"];
      const rawBatchRows =
        (detail.get("batchRows") as Array<{
          batchId?: string;
          lotCode?: string;
          harvestDate?: string;
          quantityKg?: unknown;
          productName?: string;
          farmName?: string;
        }>) ?? [];

      const contaminatedBatches = rawBatchRows
        .filter((row) => row?.batchId)
        .map((row) => ({
          id: asString(row.batchId),
          lotCode: asString(row.lotCode),
          harvestDate: asString(row.harvestDate),
          quantityKg: toNumber(row.quantityKg),
          productName: asString(row.productName, "Unknown"),
          farmName: asString(row.farmName, "Unknown"),
        }));

      const facilities = (
        (detail.get("facilities") as RecallTrace["facilities"]) ?? []
      ).filter((f) => f?.id);

      const retailersFromDetail = (
        (detail.get("retailers") as RecallTrace["retailers"]) ?? []
      ).filter((r) => r?.id);

      const retailersFromRisk = riskResult.records.map((record) => {
        const retailer = record.get("retailer") as {
          id: string;
          name: string;
          city: string;
          banner: string;
        };
        return {
          ...retailer,
          hops: toNumber(record.get("hops")),
        };
      });

      const retailerMap = new Map<
        string,
        {
          id: string;
          name: string;
          city: string;
          banner: string;
          hops: number;
        }
      >();
      for (const retailer of retailersFromDetail) {
        retailerMap.set(retailer.id, { ...retailer, hops: 0 });
      }
      for (const retailer of retailersFromRisk) {
        if (retailer?.id) retailerMap.set(retailer.id, retailer);
      }

      const graph = graphResult.records[0];
      const nodes = cleanNodes((graph?.get("nodes") as TraceNode[]) ?? []);
      const edges = cleanEdges((graph?.get("edges") as TraceEdge[]) ?? []);
      const maxHops = retailersFromRisk.reduce(
        (max, item) => Math.max(max, item.hops ?? 0),
        0,
      );

      return {
        recall,
        contaminatedBatches,
        facilities,
        retailers: Array.from(retailerMap.values()),
        hops: maxHops,
        nodes,
        edges,
      } satisfies RecallTrace;
    });

    if (!trace) return jsonError("Recall not found.", "NOT_FOUND", 404);
    return jsonOk(trace);
  } catch (error) {
    return handleRouteError(error);
  }
}
