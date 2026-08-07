MATCH (rec:Recall {id: $recallId})-[:AFFECTS]->(b:Batch)
MATCH path = (b)-[:PROCESSED_AT|SHIPPED_TO|STORED_AT|DELIVERED_TO|TRANSFERRED_TO*1..5]->(ret:Retailer)
RETURN DISTINCT ret {.id, .name, .city, .banner} AS retailer,
       min(length(path)) AS hops
ORDER BY hops ASC, ret.name;

MATCH (start:Farm {id: $farmId}), (end:Retailer {id: $retailerId})
MATCH path = shortestPath((start)-[*1..8]-(end))
RETURN nodes(path), relationships(path), length(path);

MATCH (r1:Recall {id: $recallIdA})-[:AFFECTS]->(:Batch)-[:PROCESSED_AT|SHIPPED_TO|STORED_AT*1..3]->(fac:Facility)
MATCH (r2:Recall {id: $recallIdB})-[:AFFECTS]->(:Batch)-[:PROCESSED_AT|SHIPPED_TO|STORED_AT*1..3]->(fac)
WHERE r1 <> r2
RETURN DISTINCT fac {.id, .name, .kind, .city} AS facility;

MATCH (ret:Retailer {id: $retailerId})
OPTIONAL MATCH (fac:Facility)-[:DELIVERS_TO]->(ret)
OPTIONAL MATCH path = (b:Batch)-[:PROCESSED_AT|SHIPPED_TO|STORED_AT|DELIVERED_TO*1..4]->(end)
WHERE end = ret OR end = fac
OPTIONAL MATCH (farm:Farm)-[:PRODUCED]->(b)-[:OF_PRODUCT]->(p:Product)
RETURN ret, collect(DISTINCT fac), collect(DISTINCT b), collect(DISTINCT farm);
