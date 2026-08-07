"use client";

import { useEffect, useState } from "react";
import { ApiClientError, apiGet } from "@/lib/client";

export function DbBanner() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<{ ok: boolean }>("/api/health")
      .then(() => {
        if (!cancelled) setMessage(null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiClientError) {
          setMessage(error.message);
        } else {
          setMessage("Unable to reach the API.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!message) return null;

  return (
    <div className="db-banner" role="status">
      <strong>Database offline.</strong> {message}
    </div>
  );
}
