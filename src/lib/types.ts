export type Farm = {
  id: string;
  name: string;
  region: string;
  country: string;
};

export type Product = {
  id: string;
  name: string;
  category: string;
};

export type Batch = {
  id: string;
  lotCode: string;
  harvestDate: string;
  quantityKg: number;
};

export type Facility = {
  id: string;
  name: string;
  kind: string;
  city: string;
};

export type Retailer = {
  id: string;
  name: string;
  city: string;
  banner: string;
};

export type Recall = {
  id: string;
  title: string;
  pathogen: string;
  detectedAt: string;
  severity: string;
};

export type OverviewStats = {
  farms: number;
  batches: number;
  facilities: number;
  retailers: number;
  recalls: number;
  relationships: number;
};

export type TraceNode = {
  id: string;
  label: string;
  name: string;
  meta?: string;
};

export type TraceEdge = {
  from: string;
  to: string;
  type: string;
};

export type RecallTrace = {
  recall: Recall;
  contaminatedBatches: Array<Batch & { productName: string; farmName: string }>;
  facilities: Facility[];
  retailers: Retailer[];
  hops: number;
  nodes: TraceNode[];
  edges: TraceEdge[];
};

export type UpstreamChain = {
  retailer: Retailer;
  facilities: Facility[];
  batches: Array<Batch & { productName: string; farmName: string }>;
  farms: Farm[];
  nodes: TraceNode[];
  edges: TraceEdge[];
};

export type PathHop = {
  id: string;
  label: string;
  name: string;
  relationship?: string;
};

export type ConnectionPath = {
  found: boolean;
  length: number;
  hops: PathHop[];
};

export type ApiErrorBody = {
  error: string;
  code: "DB_UNREACHABLE" | "NOT_FOUND" | "BAD_REQUEST" | "INTERNAL";
};
