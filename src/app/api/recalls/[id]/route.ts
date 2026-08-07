import { withSession } from "@/lib/neo4j";
import { CYPHER } from "@/lib/queries";
import { handleRouteError, jsonError, jsonOk, toNumber } from "@/lib/api";
import type { RecallTrace, TraceEdge, TraceNode } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanNodes(nodes: TraceNode[]): TraceNode[] {
  const map = new Map<string, TraceNode>();
  for (const node of nodes) {
    if (!node?.id || !node.name) continue;
    map.set(node.id, node);
  }
  return Array.from(map.values());
}

function cleanEdges(edges: TraceEdge[]): TraceEdge[] {
  return edges.filter(
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
      const [detailResult, graphResult, riskResult] = await Promise.all([
        session.run(CYPHER.recallTrace, { recallId: id }),
        session.run(CYPHER.recallGraph, { recallId: id }),
        session.run(CYPHER.retailersAtRisk, { recallId: id }),
      ]);

      const detail = detailResult.records[0];
      if (!detail) return null;

      const recall = detail.get("recall");
      const batchRows = (detail.get("batchRows") as Array<{
        batch: {
          id: string;
          lotCode: string;
          harvestDate: string;
          quantityKg: number | { toNumber: () => number };
        };
        product: { name: string } | null;
        farm: { name: string } | null;
      }>).filter((row) => row?.batch?.id);

      const facilities = (detail.get("facilities") as Array<{
        id: string;
        name: string;
        kind: string;
        city: string;
      }>).filter((f) => f?.id);

      const retailersFromDetail = (detail.get("retailers") as Array<{
        id: string;
        name: string;
        city: string;
        banner: string;
      }>).filter((r) => r?.id);

      const retailersFromRisk = riskResult.records.map((record) => ({
        ...record.get("retailer"),
        hops: toNumber(record.get("hops")),
      }));

      const retailerMap = new Map<string, (typeof retailersFromRisk)[number]>();
      for (const retailer of retailersFromDetail) {
        retailerMap.set(retailer.id, { ...retailer, hops: 0 });
      }
      for (const retailer of retailersFromRisk) {
        retailerMap.set(retailer.id, retailer);
      }

      const graph = graphResult.records[0];
      const nodes = cleanNodes((graph?.get("nodes") as TraceNode[]) ?? []);
      const edges = cleanEdges((graph?.get("edges") as TraceEdge[]) ?? []);

      const contaminatedBatches = batchRows.map((row) => ({
        id: row.batch.id,
        lotCode: row.batch.lotCode,
        harvestDate: row.batch.harvestDate,
        quantityKg: toNumber(row.batch.quantityKg),
        productName: row.product?.name ?? "Unknown",
        farmName: row.farm?.name ?? "Unknown",
      }));

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
