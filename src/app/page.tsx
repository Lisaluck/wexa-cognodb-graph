"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ApiClientError, apiGet } from "@/lib/client";
import type { OverviewStats, Recall } from "@/lib/types";
import { StatGrid } from "@/components/StatGrid";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";

type RecallRow = Recall & { batchCount: number };

export default function HomePage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [recalls, setRecalls] = useState<RecallRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [overview, recallPayload] = await Promise.all([
        apiGet<OverviewStats>("/api/overview"),
        apiGet<{ recalls: RecallRow[] }>("/api/recalls"),
      ]);
      setStats(overview);
      setRecalls(recallPayload.recalls);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Could not load overview.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main>
      <section className="hero">
        <h1>Cascade</h1>
        <p className="lede">
          Trace a contaminated lot from farm to store shelf — through packers,
          distributors, and warehouses — in a few hops.
        </p>
      </section>

      {loading ? <LoadingState label="Loading supply graph…" /> : null}
      {error ? (
        <ErrorState
          title="Database unreachable"
          body={error}
          onRetry={() => void load()}
        />
      ) : null}

      {!loading && !error && stats ? (
        <>
          {stats.farms === 0 ? (
            <EmptyState
              title="No graph data yet"
              body="Run npm run seed after configuring your CognoDB credentials in .env.local."
            />
          ) : (
            <StatGrid stats={stats} />
          )}

          <div className="grid-2">
            <section className="panel">
              <div className="panel-head">
                <h2>Active recalls</h2>
                <span className="count">{recalls.length}</span>
              </div>
              {recalls.length === 0 ? (
                <p className="muted">No recalls seeded.</p>
              ) : (
                <ul className="plain-list">
                  {recalls.map((recall) => (
                    <li key={recall.id}>
                      <Link href={`/recall?id=${recall.id}`} className="recall-card">
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "0.75rem",
                          }}
                        >
                          <strong>{recall.title}</strong>
                          <span className={`severity ${recall.severity}`}>
                            {recall.severity}
                          </span>
                        </div>
                        <span className="muted">
                          {recall.pathogen} · {recall.detectedAt} ·{" "}
                          {recall.batchCount} batches
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="panel">
              <h2>Explore</h2>
              <p className="muted" style={{ margin: "0.6rem 0 1rem" }}>
                Pick a starting point. Every view answers a connection question
                the graph is built for.
              </p>
              <ul className="plain-list">
                <li>
                  <Link href="/recall" className="recall-card">
                    <strong>Recall Trace</strong>
                    <span className="muted">
                      Blast radius from pathogen event to retailers
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/upstream" className="recall-card">
                    <strong>Store Upstream</strong>
                    <span className="muted">
                      Which farms and lots feed a store
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/path" className="recall-card">
                    <strong>Farm → Store</strong>
                    <span className="muted">
                      Shortest path across the cold chain
                    </span>
                  </Link>
                </li>
              </ul>
            </section>
          </div>
        </>
      ) : null}
    </main>
  );
}
