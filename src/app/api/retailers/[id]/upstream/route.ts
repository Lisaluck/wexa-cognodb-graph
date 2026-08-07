import { withSession } from "@/lib/neo4j";
import { CYPHER } from "@/lib/queries";
import { handleRouteError, jsonError, jsonOk, toNumber } from "@/lib/api";
import type { UpstreamChain } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!id) return jsonError("Missing retailer id.", "BAD_REQUEST", 400);

    const chain = await withSession(async (session) => {
      const result = await session.run(CYPHER.retailerUpstreamFixed, {
        retailerId: id,
      });
      const record = result.records[0];
      if (!record) return null;

      const retailer = record.get("retailer");
      if (!retailer?.id) return null;

      const facilities = (record.get("facilities") as UpstreamChain["facilities"]).filter(
        (f) => f?.id,
      );
      const batches = (record.get("batches") as UpstreamChain["batches"])
        .filter((b) => b?.id)
        .map((b) => ({
          ...b,
          quantityKg: toNumber(b.quantityKg),
        }));
      const farms = (record.get("farms") as UpstreamChain["farms"]).filter(
        (f) => f?.id,
      );

      const nodes = [
        {
          id: retailer.id,
          label: "Retailer",
          name: retailer.name,
          meta: retailer.city,
        },
        ...facilities.map((f) => ({
          id: f.id,
          label: "Facility",
          name: f.name,
          meta: f.kind,
        })),
        ...batches.map((b) => ({
          id: b.id,
          label: "Batch",
          name: b.lotCode,
          meta: b.productName,
        })),
        ...farms.map((f) => ({
          id: f.id,
          label: "Farm",
          name: f.name,
          meta: f.region,
        })),
      ];

      return {
        retailer,
        facilities,
        batches,
        farms,
        nodes,
        edges: [],
      } satisfies UpstreamChain;
    });

    if (!chain) return jsonError("Retailer not found.", "NOT_FOUND", 404);
    return jsonOk(chain);
  } catch (error) {
    return handleRouteError(error);
  }
}
