import { config } from "dotenv";
import neo4j from "neo4j-driver";

config({ path: ".env.local" });
config();


const uri = process.env.NEO4J_URI;
const user = process.env.NEO4J_USER ?? "cognodb";
const password = process.env.NEO4J_PASSWORD;

if (!uri || !password) {
  console.error("Set NEO4J_URI and NEO4J_PASSWORD before seeding.");
  process.exit(1);
}

const farms = [
  { id: "farm-verde", name: "Verde Valley Farms", region: "Salinas Valley", country: "USA" },
  { id: "farm-rio", name: "Rio Crest Growers", region: "Imperial Valley", country: "USA" },
  { id: "farm-aurora", name: "Aurora Orchards", region: "Yakima Valley", country: "USA" },
  { id: "farm-lakeside", name: "Lakeside Greens", region: "Ontario", country: "Canada" },
  { id: "farm-sierra", name: "Sierra Berry Co-op", region: "Watsonville", country: "USA" },
];

const products = [
  { id: "prod-romaine", name: "Romaine Hearts", category: "Leafy Greens" },
  { id: "prod-spinach", name: "Baby Spinach", category: "Leafy Greens" },
  { id: "prod-apple", name: "Honeycrisp Apples", category: "Fruit" },
  { id: "prod-berry", name: "Strawberries", category: "Fruit" },
  { id: "prod-carrot", name: "Organic Carrots", category: "Root Vegetables" },
];

const facilities = [
  { id: "fac-pack-a", name: "Coastal Pack House", kind: "Packer", city: "Salinas" },
  { id: "fac-pack-b", name: "Valley Cold Pack", kind: "Packer", city: "Bakersfield" },
  { id: "fac-dist-west", name: "Pacific Fresh Distribution", kind: "Distributor", city: "Oakland" },
  { id: "fac-dist-central", name: "Heartland Produce Hub", kind: "Distributor", city: "Chicago" },
  { id: "fac-wh-sea", name: "Puget Sound Cold Storage", kind: "Warehouse", city: "Seattle" },
  { id: "fac-wh-den", name: "Front Range Refrigeration", kind: "Warehouse", city: "Denver" },
  { id: "fac-wh-atl", name: "Peachtree Cold Chain", kind: "Warehouse", city: "Atlanta" },
];

const retailers = [
  { id: "ret-greenmart-sf", name: "GreenMart Mission", city: "San Francisco", banner: "GreenMart" },
  { id: "ret-greenmart-sea", name: "GreenMart Ballard", city: "Seattle", banner: "GreenMart" },
  { id: "ret-freshco-den", name: "FreshCo Highlands", city: "Denver", banner: "FreshCo" },
  { id: "ret-freshco-chi", name: "FreshCo Logan Square", city: "Chicago", banner: "FreshCo" },
  { id: "ret-harbor-atl", name: "Harbor Foods Midtown", city: "Atlanta", banner: "Harbor Foods" },
  { id: "ret-harbor-oak", name: "Harbor Foods Temescal", city: "Oakland", banner: "Harbor Foods" },
  { id: "ret-daily-tor", name: "Daily Basket Annex", city: "Toronto", banner: "Daily Basket" },
];

const batches = [
  { id: "batch-rv-041", lotCode: "RV-0418-A", harvestDate: "2026-03-12", quantityKg: 4200, farmId: "farm-verde", productId: "prod-romaine" },
  { id: "batch-rv-042", lotCode: "RV-0422-B", harvestDate: "2026-03-18", quantityKg: 3800, farmId: "farm-verde", productId: "prod-spinach" },
  { id: "batch-rc-017", lotCode: "RC-0177-C", harvestDate: "2026-03-10", quantityKg: 5100, farmId: "farm-rio", productId: "prod-romaine" },
  { id: "batch-rc-019", lotCode: "RC-0191-D", harvestDate: "2026-03-21", quantityKg: 2600, farmId: "farm-rio", productId: "prod-carrot" },
  { id: "batch-ao-088", lotCode: "AO-0884-E", harvestDate: "2026-03-05", quantityKg: 6400, farmId: "farm-aurora", productId: "prod-apple" },
  { id: "batch-lg-033", lotCode: "LG-0330-F", harvestDate: "2026-03-15", quantityKg: 2900, farmId: "farm-lakeside", productId: "prod-spinach" },
  { id: "batch-sb-055", lotCode: "SB-0552-G", harvestDate: "2026-03-20", quantityKg: 1800, farmId: "farm-sierra", productId: "prod-berry" },
  { id: "batch-sb-056", lotCode: "SB-0561-H", harvestDate: "2026-03-22", quantityKg: 2100, farmId: "farm-sierra", productId: "prod-berry" },
];

const recalls = [
  {
    id: "recall-ecoli-01",
    title: "E. coli advisory - romaine lots",
    pathogen: "E. coli O157:H7",
    detectedAt: "2026-03-25",
    severity: "high",
    batchIds: ["batch-rv-041", "batch-rc-017"],
  },
  {
    id: "recall-listeria-02",
    title: "Listeria hold - berry pack line",
    pathogen: "Listeria monocytogenes",
    detectedAt: "2026-03-27",
    severity: "critical",
    batchIds: ["batch-sb-055"],
  },
];

const movements: Array<{
  fromBatch: string;
  steps: Array<{ facilityId: string; rel: "PROCESSED_AT" | "SHIPPED_TO" | "STORED_AT"; on: string }>;
  retailers?: Array<{ retailerId: string; on: string }>;
}> = [
  {
    fromBatch: "batch-rv-041",
    steps: [
      { facilityId: "fac-pack-a", rel: "PROCESSED_AT", on: "2026-03-13" },
      { facilityId: "fac-dist-west", rel: "SHIPPED_TO", on: "2026-03-15" },
      { facilityId: "fac-wh-sea", rel: "STORED_AT", on: "2026-03-17" },
    ],
    retailers: [
      { retailerId: "ret-greenmart-sf", on: "2026-03-16" },
      { retailerId: "ret-greenmart-sea", on: "2026-03-18" },
      { retailerId: "ret-harbor-oak", on: "2026-03-16" },
    ],
  },
  {
    fromBatch: "batch-rv-042",
    steps: [
      { facilityId: "fac-pack-a", rel: "PROCESSED_AT", on: "2026-03-19" },
      { facilityId: "fac-dist-west", rel: "SHIPPED_TO", on: "2026-03-20" },
    ],
    retailers: [{ retailerId: "ret-harbor-oak", on: "2026-03-21" }],
  },
  {
    fromBatch: "batch-rc-017",
    steps: [
      { facilityId: "fac-pack-b", rel: "PROCESSED_AT", on: "2026-03-11" },
      { facilityId: "fac-dist-central", rel: "SHIPPED_TO", on: "2026-03-13" },
      { facilityId: "fac-wh-den", rel: "STORED_AT", on: "2026-03-15" },
      { facilityId: "fac-wh-atl", rel: "STORED_AT", on: "2026-03-17" },
    ],
    retailers: [
      { retailerId: "ret-freshco-den", on: "2026-03-16" },
      { retailerId: "ret-freshco-chi", on: "2026-03-14" },
      { retailerId: "ret-harbor-atl", on: "2026-03-18" },
    ],
  },
  {
    fromBatch: "batch-rc-019",
    steps: [
      { facilityId: "fac-pack-b", rel: "PROCESSED_AT", on: "2026-03-22" },
      { facilityId: "fac-dist-central", rel: "SHIPPED_TO", on: "2026-03-23" },
    ],
    retailers: [{ retailerId: "ret-freshco-chi", on: "2026-03-24" }],
  },
  {
    fromBatch: "batch-ao-088",
    steps: [
      { facilityId: "fac-dist-west", rel: "SHIPPED_TO", on: "2026-03-08" },
      { facilityId: "fac-wh-sea", rel: "STORED_AT", on: "2026-03-10" },
    ],
    retailers: [
      { retailerId: "ret-greenmart-sea", on: "2026-03-11" },
      { retailerId: "ret-greenmart-sf", on: "2026-03-12" },
    ],
  },
  {
    fromBatch: "batch-lg-033",
    steps: [
      { facilityId: "fac-dist-central", rel: "SHIPPED_TO", on: "2026-03-16" },
    ],
    retailers: [
      { retailerId: "ret-daily-tor", on: "2026-03-18" },
      { retailerId: "ret-freshco-chi", on: "2026-03-17" },
    ],
  },
  {
    fromBatch: "batch-sb-055",
    steps: [
      { facilityId: "fac-pack-a", rel: "PROCESSED_AT", on: "2026-03-21" },
      { facilityId: "fac-dist-west", rel: "SHIPPED_TO", on: "2026-03-22" },
      { facilityId: "fac-wh-sea", rel: "STORED_AT", on: "2026-03-23" },
    ],
    retailers: [
      { retailerId: "ret-greenmart-sf", on: "2026-03-23" },
      { retailerId: "ret-greenmart-sea", on: "2026-03-24" },
      { retailerId: "ret-harbor-oak", on: "2026-03-23" },
    ],
  },
  {
    fromBatch: "batch-sb-056",
    steps: [
      { facilityId: "fac-pack-a", rel: "PROCESSED_AT", on: "2026-03-23" },
      { facilityId: "fac-dist-west", rel: "SHIPPED_TO", on: "2026-03-24" },
    ],
    retailers: [{ retailerId: "ret-harbor-oak", on: "2026-03-25" }],
  },
];

const transfers = [
  { from: "fac-dist-west", to: "fac-wh-sea", on: "2026-03-17" },
  { from: "fac-dist-central", to: "fac-wh-den", on: "2026-03-15" },
  { from: "fac-dist-central", to: "fac-wh-atl", on: "2026-03-17" },
  { from: "fac-pack-a", to: "fac-dist-west", on: "2026-03-15" },
  { from: "fac-pack-b", to: "fac-dist-central", on: "2026-03-13" },
];

async function main() {
  const driver = neo4j.driver(uri!, neo4j.auth.basic(user, password!));
  const session = driver.session();

  try {
    console.log("Clearing previous Cascade data...");
    await session.run(`
MATCH (n)
WHERE n:Farm OR n:Product OR n:Batch OR n:Facility OR n:Retailer OR n:Recall
DETACH DELETE n
`);

    console.log("Creating constraints...");
    const constraints = [
      "CREATE CONSTRAINT farm_id IF NOT EXISTS FOR (n:Farm) REQUIRE n.id IS UNIQUE",
      "CREATE CONSTRAINT product_id IF NOT EXISTS FOR (n:Product) REQUIRE n.id IS UNIQUE",
      "CREATE CONSTRAINT batch_id IF NOT EXISTS FOR (n:Batch) REQUIRE n.id IS UNIQUE",
      "CREATE CONSTRAINT facility_id IF NOT EXISTS FOR (n:Facility) REQUIRE n.id IS UNIQUE",
      "CREATE CONSTRAINT retailer_id IF NOT EXISTS FOR (n:Retailer) REQUIRE n.id IS UNIQUE",
      "CREATE CONSTRAINT recall_id IF NOT EXISTS FOR (n:Recall) REQUIRE n.id IS UNIQUE",
    ];
    for (const cypher of constraints) {
      try {
        await session.run(cypher);
      } catch {
        console.warn("Constraint skipped:", cypher);
      }
    }

    console.log("Seeding nodes...");
    await session.run(
      `
UNWIND $farms AS row
MERGE (f:Farm {id: row.id})
SET f.name = row.name, f.region = row.region, f.country = row.country
`,
      { farms },
    );

    await session.run(
      `
UNWIND $products AS row
MERGE (p:Product {id: row.id})
SET p.name = row.name, p.category = row.category
`,
      { products },
    );

    await session.run(
      `
UNWIND $facilities AS row
MERGE (f:Facility {id: row.id})
SET f.name = row.name, f.kind = row.kind, f.city = row.city
`,
      { facilities },
    );

    await session.run(
      `
UNWIND $retailers AS row
MERGE (r:Retailer {id: row.id})
SET r.name = row.name, r.city = row.city, r.banner = row.banner
`,
      { retailers },
    );

    await session.run(
      `
UNWIND $batches AS row
MERGE (b:Batch {id: row.id})
SET b.lotCode = row.lotCode,
    b.harvestDate = row.harvestDate,
    b.quantityKg = row.quantityKg
WITH b, row
MATCH (farm:Farm {id: row.farmId})
MATCH (product:Product {id: row.productId})
MERGE (farm)-[:PRODUCED]->(b)
MERGE (b)-[:OF_PRODUCT]->(product)
`,
      { batches },
    );

    console.log("Seeding movements...");
    for (const movement of movements) {
      for (const step of movement.steps) {
        const rel = step.rel;
        await session.run(
          `
MATCH (b:Batch {id: $batchId})
MATCH (f:Facility {id: $facilityId})
MERGE (b)-[r:${rel}]->(f)
SET r.on = $on
`,
          {
            batchId: movement.fromBatch,
            facilityId: step.facilityId,
            on: step.on,
          },
        );
      }

      for (const delivery of movement.retailers ?? []) {
        const lastFacility =
          movement.steps[movement.steps.length - 1]?.facilityId;
        await session.run(
          `
MATCH (b:Batch {id: $batchId})
MATCH (r:Retailer {id: $retailerId})
MERGE (b)-[d:DELIVERED_TO]->(r)
SET d.on = $on
`,
          {
            batchId: movement.fromBatch,
            retailerId: delivery.retailerId,
            on: delivery.on,
          },
        );
        if (lastFacility) {
          await session.run(
            `
MATCH (f:Facility {id: $facilityId})
MATCH (r:Retailer {id: $retailerId})
MERGE (f)-[d:DELIVERS_TO]->(r)
SET d.on = $on
`,
            {
              facilityId: lastFacility,
              retailerId: delivery.retailerId,
              on: delivery.on,
            },
          );
        }
      }
    }

    for (const transfer of transfers) {
      await session.run(
        `
MATCH (a:Facility {id: $from})
MATCH (b:Facility {id: $to})
MERGE (a)-[t:TRANSFERRED_TO]->(b)
SET t.on = $on
`,
        transfer,
      );
    }

    console.log("Seeding recalls...");
    for (const recall of recalls) {
      await session.run(
        `
MERGE (r:Recall {id: $id})
SET r.title = $title,
    r.pathogen = $pathogen,
    r.detectedAt = $detectedAt,
    r.severity = $severity
WITH r
UNWIND $batchIds AS batchId
MATCH (b:Batch {id: batchId})
MERGE (r)-[:AFFECTS]->(b)
`,
        {
          id: recall.id,
          title: recall.title,
          pathogen: recall.pathogen,
          detectedAt: recall.detectedAt,
          severity: recall.severity,
          batchIds: recall.batchIds,
        },
      );
    }

    const counts = await session.run(`
MATCH (n)
WITH count(n) AS nodes
OPTIONAL MATCH ()-[r]->()
RETURN nodes, count(r) AS relationships
`);
    const record = counts.records[0];
    console.log(
      `Seed complete: ${record.get("nodes")} nodes, ${record.get("relationships")} relationships.`,
    );
  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
