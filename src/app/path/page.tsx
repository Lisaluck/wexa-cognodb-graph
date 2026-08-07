"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiClientError, apiGet } from "@/lib/client";
import type { ConnectionPath, Farm, Retailer } from "@/lib/types";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { PathTrail } from "@/components/PathTrail";

export default function PathPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [farmId, setFarmId] = useState("");
  const [retailerId, setRetailerId] = useState("");
  const [path, setPath] = useState<ConnectionPath | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingPath, setLoadingPath] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMeta = useCallback(async () => {
    setLoadingMeta(true);
    setError(null);
    try {
      const [farmPayload, retailerPayload] = await Promise.all([
        apiGet<{ farms: Farm[] }>("/api/farms"),
        apiGet<{ retailers: Retailer[] }>("/api/retailers"),
      ]);
      setFarms(farmPayload.farms);
      setRetailers(retailerPayload.retailers);
      if (farmPayload.farms[0]) setFarmId(farmPayload.farms[0].id);
      if (retailerPayload.retailers[0]) {
        setRetailerId(retailerPayload.retailers[0].id);
      }
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Could not load farms and retailers.",
      );
    } finally {
      setLoadingMeta(false);
    }
  }, []);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  async function findPath() {
    if (!farmId || !retailerId) return;
    setLoadingPath(true);
    setError(null);
    try {
      const payload = await apiGet<ConnectionPath>(
        `/api/path?farmId=${encodeURIComponent(farmId)}&retailerId=${encodeURIComponent(retailerId)}`,
      );
      setPath(payload);
    } catch (err) {
      setPath(null);
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Could not compute path.",
      );
    } finally {
      setLoadingPath(false);
    }
  }

  return (
    <main>
      <section className="hero">
        <h1 className="page-title">Farm → Store</h1>
        <p className="lede">
          Find the shortest cold-chain path connecting a grower to a retail
          shelf — a classic multi-hop graph question.
        </p>
      </section>

      {loadingMeta ? <LoadingState /> : null}
      {error && !loadingMeta ? (
        <ErrorState
          title="Path finder unavailable"
          body={error}
          onRetry={() => void loadMeta()}
        />
      ) : null}

      {!loadingMeta && (farms.length === 0 || retailers.length === 0) ? (
        <EmptyState
          title="Missing graph endpoints"
          body="Seed farms and retailers before finding paths."
        />
      ) : null}

      {!loadingMeta && farms.length > 0 && retailers.length > 0 ? (
        <>
          <div className="selector">
            <label>
              Farm
              <select
                value={farmId}
                onChange={(event) => setFarmId(event.target.value)}
              >
                {farms.map((farm) => (
                  <option key={farm.id} value={farm.id}>
                    {farm.name} · {farm.region}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Retailer
              <select
                value={retailerId}
                onChange={(event) => setRetailerId(event.target.value)}
              >
                {retailers.map((retailer) => (
                  <option key={retailer.id} value={retailer.id}>
                    {retailer.name} · {retailer.city}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="btn"
              onClick={() => void findPath()}
              disabled={loadingPath}
            >
              {loadingPath ? "Finding path…" : "Find shortest path"}
            </button>
          </div>

          {loadingPath ? <LoadingState label="Searching relationships…" /> : null}

          {!loadingPath && path && !path.found ? (
            <EmptyState
              title="No path found"
              body="These nodes are not connected within eight hops in the seeded graph."
            />
          ) : null}

          {!loadingPath && path?.found ? (
            <section className="panel">
              <div className="panel-head">
                <h2>Shortest path</h2>
                <span className="count">{path.length} hops</span>
              </div>
              <PathTrail hops={path.hops} />
            </section>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
