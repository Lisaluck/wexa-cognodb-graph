"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiClientError, apiGet } from "@/lib/client";
import type { Retailer, TraceNode, UpstreamChain } from "@/lib/types";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { NodeList } from "@/components/NodeList";

export default function UpstreamPage() {
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [chain, setChain] = useState<UpstreamChain | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChain, setLoadingChain] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRetailers = useCallback(async () => {
    setLoadingList(true);
    setError(null);
    try {
      const payload = await apiGet<{ retailers: Retailer[] }>("/api/retailers");
      setRetailers(payload.retailers);
      if (payload.retailers[0]) setSelectedId(payload.retailers[0].id);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Could not load retailers.",
      );
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadChain = useCallback(async (id: string) => {
    if (!id) return;
    setLoadingChain(true);
    setError(null);
    try {
      const payload = await apiGet<UpstreamChain>(
        `/api/retailers/${id}/upstream`,
      );
      setChain(payload);
    } catch (err) {
      setChain(null);
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Could not load upstream chain.",
      );
    } finally {
      setLoadingChain(false);
    }
  }, []);

  useEffect(() => {
    void loadRetailers();
  }, [loadRetailers]);

  useEffect(() => {
    if (selectedId) void loadChain(selectedId);
  }, [loadChain, selectedId]);

  const nodes = useMemo(() => {
    if (!chain) {
      return {
        farms: [] as TraceNode[],
        batches: [] as TraceNode[],
        facilities: [] as TraceNode[],
      };
    }
    return {
      farms: chain.farms.map((f) => ({
        id: f.id,
        label: "Farm",
        name: f.name,
        meta: f.region,
      })),
      batches: chain.batches.map((b) => ({
        id: b.id,
        label: "Batch",
        name: b.lotCode,
        meta: `${b.productName} · ${b.farmName}`,
      })),
      facilities: chain.facilities.map((f) => ({
        id: f.id,
        label: "Facility",
        name: f.name,
        meta: `${f.kind} · ${f.city}`,
      })),
    };
  }, [chain]);

  return (
    <main>
      <section className="hero">
        <h1 className="page-title">Store Upstream</h1>
        <p className="lede">
          Ask a store which farms, lots, and facilities sit behind its produce
          aisle.
        </p>
      </section>

      {loadingList ? <LoadingState /> : null}
      {error && !loadingList ? (
        <ErrorState
          title="Upstream lookup failed"
          body={error}
          onRetry={() => {
            void loadRetailers();
            if (selectedId) void loadChain(selectedId);
          }}
        />
      ) : null}

      {!loadingList && retailers.length === 0 ? (
        <EmptyState
          title="No retailers found"
          body="Seed the database to explore store upstream chains."
        />
      ) : null}

      {!loadingList && retailers.length > 0 ? (
        <>
          <div className="selector">
            <label>
              Retailer
              <select
                value={selectedId}
                onChange={(event) => setSelectedId(event.target.value)}
              >
                {retailers.map((retailer) => (
                  <option key={retailer.id} value={retailer.id}>
                    {retailer.name} · {retailer.city}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {loadingChain ? <LoadingState label="Walking upstream…" /> : null}

          {!loadingChain && chain ? (
            <div className="grid-stack">
              <section className="panel">
                <h2>{chain.retailer.name}</h2>
                <p className="muted" style={{ marginTop: "0.5rem" }}>
                  {chain.retailer.banner} · {chain.retailer.city}
                </p>
                <div className="metric-row">
                  <span className="metric">{chain.farms.length} farms</span>
                  <span className="metric">{chain.batches.length} lots</span>
                  <span className="metric">
                    {chain.facilities.length} facilities
                  </span>
                </div>
              </section>
              <div className="grid-2">
                <NodeList
                  title="Source farms"
                  nodes={nodes.farms}
                  empty="No farms found upstream."
                />
                <NodeList
                  title="Lots received"
                  nodes={nodes.batches}
                  empty="No lots found."
                />
              </div>
              <NodeList
                title="Facilities feeding this store"
                nodes={nodes.facilities}
                empty="No facilities linked."
              />
            </div>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
