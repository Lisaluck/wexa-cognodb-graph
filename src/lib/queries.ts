export const CYPHER = {
  overview: `
MATCH (n)
WITH count(n) AS nodes
OPTIONAL MATCH ()-[r]->()
WITH nodes, count(r) AS relationships
OPTIONAL MATCH (f:Farm)
WITH nodes, relationships, count(f) AS farms
OPTIONAL MATCH (b:Batch)
WITH nodes, relationships, farms, count(b) AS batches
OPTIONAL MATCH (fac:Facility)
WITH nodes, relationships, farms, batches, count(fac) AS facilities
OPTIONAL MATCH (ret:Retailer)
WITH nodes, relationships, farms, batches, facilities, count(ret) AS retailers
OPTIONAL MATCH (rec:Recall)
RETURN farms, batches, facilities, retailers, count(rec) AS recalls, relationships
`,

  listRecalls: `
MATCH (r:Recall)
OPTIONAL MATCH (r)-[:AFFECTS]->(b:Batch)
RETURN r {
  .id, .title, .pathogen, .detectedAt, .severity
} AS recall, count(b) AS batchCount
ORDER BY r.detectedAt DESC
`,

  listRetailers: `
MATCH (r:Retailer)
RETURN r {
  .id, .name, .city, .banner
} AS retailer
ORDER BY r.name
`,

  listFarms: `
MATCH (f:Farm)
RETURN f {
  .id, .name, .region, .country
} AS farm
ORDER BY f.name
`,

  recallTrace: `
MATCH (rec:Recall {id: $recallId})-[:AFFECTS]->(b:Batch)
OPTIONAL MATCH (farm:Farm)-[:PRODUCED]->(b)-[:OF_PRODUCT]->(p:Product)
OPTIONAL MATCH path = (b)-[:PROCESSED_AT|SHIPPED_TO|STORED_AT*1..4]->(fac:Facility)
OPTIONAL MATCH (fac)-[:DELIVERS_TO]->(ret:Retailer)
OPTIONAL MATCH (b)-[:DELIVERED_TO]->(direct:Retailer)
WITH rec, collect(DISTINCT b) AS batches,
     collect(DISTINCT {batch: b, product: p, farm: farm}) AS batchRows,
     collect(DISTINCT fac) AS facilities,
     collect(DISTINCT ret) + collect(DISTINCT direct) AS retailers
RETURN rec {
  .id, .title, .pathogen, .detectedAt, .severity
} AS recall,
batchRows,
[f IN facilities WHERE f IS NOT NULL | f {.id, .name, .kind, .city}] AS facilities,
[r IN retailers WHERE r IS NOT NULL | r {.id, .name, .city, .banner}] AS retailers
`,

  recallGraph: `
MATCH (rec:Recall {id: $recallId})-[:AFFECTS]->(b:Batch)
OPTIONAL MATCH (farm:Farm)-[:PRODUCED]->(b)-[:OF_PRODUCT]->(p:Product)
OPTIONAL MATCH (b)-[r1:PROCESSED_AT|SHIPPED_TO|STORED_AT]->(fac:Facility)
OPTIONAL MATCH (fac)-[r2:DELIVERS_TO]->(ret:Retailer)
OPTIONAL MATCH (b)-[r3:DELIVERED_TO]->(direct:Retailer)
OPTIONAL MATCH (fac)-[r4:TRANSFERRED_TO]->(fac2:Facility)
RETURN
  collect(DISTINCT {id: rec.id, label: 'Recall', name: rec.title, meta: rec.pathogen}) +
  collect(DISTINCT {id: b.id, label: 'Batch', name: b.lotCode, meta: p.name}) +
  collect(DISTINCT {id: farm.id, label: 'Farm', name: farm.name, meta: farm.region}) +
  collect(DISTINCT {id: fac.id, label: 'Facility', name: fac.name, meta: fac.kind}) +
  collect(DISTINCT {id: fac2.id, label: 'Facility', name: fac2.name, meta: fac2.kind}) +
  collect(DISTINCT {id: ret.id, label: 'Retailer', name: ret.name, meta: ret.city}) +
  collect(DISTINCT {id: direct.id, label: 'Retailer', name: direct.name, meta: direct.city})
  AS nodes,
  collect(DISTINCT {from: rec.id, to: b.id, type: 'AFFECTS'}) +
  collect(DISTINCT {from: farm.id, to: b.id, type: 'PRODUCED'}) +
  collect(DISTINCT {from: b.id, to: fac.id, type: type(r1)}) +
  collect(DISTINCT {from: fac.id, to: ret.id, type: 'DELIVERS_TO'}) +
  collect(DISTINCT {from: b.id, to: direct.id, type: 'DELIVERED_TO'}) +
  collect(DISTINCT {from: fac.id, to: fac2.id, type: 'TRANSFERRED_TO'})
  AS edges
`,

  retailerUpstreamFixed: `
MATCH (ret:Retailer {id: $retailerId})
OPTIONAL MATCH (fac:Facility)-[:DELIVERS_TO]->(ret)
OPTIONAL MATCH path = (b:Batch)-[:PROCESSED_AT|SHIPPED_TO|STORED_AT|DELIVERED_TO*1..4]->(end)
WHERE end = ret OR end = fac
OPTIONAL MATCH (farm:Farm)-[:PRODUCED]->(b)-[:OF_PRODUCT]->(p:Product)
WITH ret,
     collect(DISTINCT fac) AS facilities,
     collect(DISTINCT {
       id: b.id,
       lotCode: b.lotCode,
       harvestDate: b.harvestDate,
       quantityKg: toInteger(b.quantityKg),
       productName: p.name,
       farmName: farm.name
     }) AS batchRows,
     collect(DISTINCT farm {.id, .name, .region, .country}) AS farms
RETURN ret {.id, .name, .city, .banner} AS retailer,
       [f IN facilities WHERE f IS NOT NULL | f {.id, .name, .kind, .city}] AS facilities,
       [b IN batchRows WHERE b.id IS NOT NULL | b] AS batches,
       [f IN farms WHERE f.id IS NOT NULL | f] AS farms
`,

  shortestPath: `
MATCH (start:Farm {id: $farmId}), (end:Retailer {id: $retailerId})
MATCH path = shortestPath((start)-[*1..8]-(end))
RETURN [n IN nodes(path) | {
  id: coalesce(n.id, elementId(n)),
  label: head(labels(n)),
  name: coalesce(n.name, n.lotCode, n.title, n.id)
}] AS nodeHops,
[r IN relationships(path) | type(r)] AS relTypes,
length(path) AS pathLength
`,

  sharedFacilitiesBetweenRecalls: `
MATCH (r1:Recall {id: $recallIdA})-[:AFFECTS]->(:Batch)-[:PROCESSED_AT|SHIPPED_TO|STORED_AT*1..3]->(fac:Facility)
MATCH (r2:Recall {id: $recallIdB})-[:AFFECTS]->(:Batch)-[:PROCESSED_AT|SHIPPED_TO|STORED_AT*1..3]->(fac)
WHERE r1 <> r2
RETURN DISTINCT fac {.id, .name, .kind, .city} AS facility
ORDER BY fac.name
`,

  retailersAtRisk: `
MATCH (rec:Recall {id: $recallId})-[:AFFECTS]->(b:Batch)
MATCH path = (b)-[:PROCESSED_AT|SHIPPED_TO|STORED_AT|DELIVERED_TO|TRANSFERRED_TO*1..5]->(ret:Retailer)
RETURN DISTINCT ret {.id, .name, .city, .banner} AS retailer,
       min(length(path)) AS hops
ORDER BY hops ASC, ret.name
`,
} as const;
