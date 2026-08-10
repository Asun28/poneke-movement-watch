"use client";

import { useEffect, useState } from "react";

type CaseContext = { caseId: string; sourceId: string; asOf: string };

export default function ReplayCaseContext() {
  const [context, setContext] = useState<CaseContext>({ caseId: "", sourceId: "", asOf: "" });

  useEffect(() => {
    const loadContext = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      setContext({
        caseId: (params.get("case") ?? "").slice(0, 180),
        sourceId: (params.get("source") ?? "").slice(0, 120),
        asOf: (params.get("as_of") ?? "").slice(0, 40),
      });
    }, 0);
    return () => window.clearTimeout(loadContext);
  }, []);

  if (!context.caseId) {
    return <span hidden>Case handoff · available_at-only policy required in v1</span>;
  }

  return (
    <section className="replay-case-context" aria-label="Replay case handoff">
      <div><span>Case handoff</span><strong>{context.caseId}</strong></div>
      <div><span>Source reference</span><strong>{context.sourceId || "No source supplied"}</strong></div>
      <div><span>Replay cutoff</span><strong>{context.asOf || "No cutoff supplied"}</strong></div>
      <div><span>Availability</span><strong>Cutoff required · v1 unverified</strong></div>
    </section>
  );
}
