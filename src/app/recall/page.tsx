"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiClientError, apiGet } from "@/lib/client";
import type { Recall, RecallTrace, TraceNode } from "@/lib/types";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { NodeList } from "@/components/NodeList";

type RecallRow = Recall & { batchCount: number };

function RecallPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("id") ?? "";

  const [recalls, setRecalls] = useState<RecallRow[]>([]);
  const [trace, setTrace] = useState<RecallTrace | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingTrace, setLoadingTrace] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRecalls = useCallback(async () => {
    setLoadingList(true);
    setError(null);
    try {
      const payload = await apiGet<{ recalls: RecallRow[] }>("/api/recalls");
      setRecalls(payload.recalls);
      if (!selectedId && payload.recalls[0]) {
        router.replace(`/recall?id=${payload.recalls[0].id}`);
      }
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Could not load recalls.",
      );
    } finally {
      setLoadingList(false);
    }
  }, [router, selectedId]);

  const loadTrace = useCallback(async (id: string) => {
    if (!id) {
      setTrace(null);
      return;
    }
    setLoadingTrace(true);
    setError(null);
    try {
      const payload = await apiGet<RecallTrace>(`/api/recalls/${id}`);
      setTrace(payload);
    } catch (err) {
      setTrace(null);
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Could not load recall trace.",
      );
    } finally {
      setLoadingTrace(false);
    }
  }, []);

  useEffect(() => {
    void loadRecalls();
  }, [loadRecalls]);

  useEffect(() => {
    if (selectedId) void loadTrace(selectedId);
  }, [loadTrace, selectedId]);

  const grouped = useMemo(() => {
    if (!trace) {
      return {
        farms: [] as TraceNode[],
        batches: [] as TraceNode[],
        facilities: [] as TraceNode[],
        retailers: [] as TraceNode[],
      };
    }
    return {
      farms: trace.nodes.filter((n) => n.label === "Farm"),
      batches: trace.nodes.filter((n) => n.label === "Batch"),
      facilities: trace.nodes.filter((n) => n.label === "Facility"),
      retailers: trace.nodes.filter((n) => n.label === "Retailer"),
    };
  }, [trace]);

  return (
    <main>
      <section className="hero">
        <h1 className="page-title">Recall Trace</h1>
        <p className="lede">
          Start from a contamination event and walk every hop to stores that may
          still hold affected lots.
        </p>
      </section>

      {loadingList ? <LoadingState /> : null}
      {error && !loadingList ? (
        <ErrorState
          title="Could not load recall data"
          body={error}
          onRetry={() => {
            void loadRecalls();
            if (selectedId) void loadTrace(selectedId);
          }}
        />
      ) : null}

      {!loadingList && !error && recalls.length === 0 ? (
        <EmptyState
          title="No recalls found"
          body="Seed the database to explore contamination traces."
        />
      ) : null}

      {!loadingList && recalls.length > 0 ? (
        <div className="grid-2">
          <section className="panel">
            <div className="panel-head">
              <h2>Events</h2>
              <span className="count">{recalls.length}</span>
            </div>
            <ul className="plain-list">
              {recalls.map((recall) => (
                <li key={recall.id}>
                  <button
                    type="button"
                    className={
                      recall.id === selectedId
                        ? "recall-card active"
                        : "recall-card"
                    }
                    onClick={() => router.push(`/recall?id=${recall.id}`)}
                  >
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
                      {recall.pathogen} · {recall.batchCount} batches
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <div className="grid-stack">
            {loadingTrace ? <LoadingState label="Tracing blast radius…" /> : null}
            {!loadingTrace && trace ? (
              <>
                <section className="panel">
                  <h2>{trace.recall.title}</h2>
                  <p className="muted" style={{ marginTop: "0.5rem" }}>
                    {trace.recall.pathogen} detected {trace.recall.detectedAt}
                  </p>
                  <div className="metric-row">
                    <span className="metric">
                      {trace.contaminatedBatches.length} contaminated lots
                    </span>
                    <span className="metric">
                      {trace.facilities.length} facilities touched
                    </span>
                    <span className="metric">
                      {trace.retailers.length} retailers at risk
                    </span>
                    <span className="metric">up to {trace.hops} hops</span>
                  </div>
                </section>

                <NodeList
                  title="Contaminated lots"
                  nodes={grouped.batches}
                  empty="No batches linked."
                />
                <NodeList
                  title="Facilities in path"
                  nodes={grouped.facilities}
                  empty="No facilities in path."
                />
                <NodeList
                  title="Retailers at risk"
                  nodes={grouped.retailers}
                  empty="No retailers reached."
                />
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default function RecallPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <RecallPageInner />
    </Suspense>
  );
}
