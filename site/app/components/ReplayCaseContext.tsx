"use client";

import { useEffect, useState } from "react";

type CaseContext = {
  investigationId: string;
  caseId: string;
  sourceId: string;
  startsAt: string;
  asOf: string;
  scope: string;
};

const EMPTY_CONTEXT: CaseContext = {
  investigationId: "",
  caseId: "",
  sourceId: "",
  startsAt: "",
  asOf: "",
  scope: "",
};

export default function ReplayCaseContext() {
  const [context, setContext] = useState<CaseContext>(EMPTY_CONTEXT);

  useEffect(() => {
    const loadContext = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      setContext({
        investigationId: (params.get("investigation") ?? "").slice(0, 180),
        caseId: (params.get("case") ?? "").slice(0, 180),
        sourceId: (params.get("source") ?? "").slice(0, 120),
        startsAt: (params.get("from") ?? "").slice(0, 40),
        asOf: (params.get("as_of") ?? "").slice(0, 40),
        scope: (params.get("scope") ?? "").slice(0, 40),
      });
    }, 0);
    return () => window.clearTimeout(loadContext);
  }, []);

  if (!context.caseId) {
    return <span hidden>Case handoff · available_at-only policy required in v1</span>;
  }

  return (
    <section className="replay-case-context" aria-label="Replay case handoff">
      <div><span>{context.investigationId ? "Investigation" : "Case handoff"}</span><strong>{context.investigationId || context.caseId}</strong></div>
      <div><span>Source</span><strong>{context.sourceId || "No source supplied"}</strong></div>
      <div><span>Start</span><strong>{context.startsAt || "No start supplied"}</strong></div>
      <div><span>Replay cutoff</span><strong>{context.asOf || "No cutoff supplied"}</strong></div>
      <div><span>Status</span><strong>{context.scope === "local_draft" ? "Local draft · not Incident/COP" : "Packaged Replay case"}</strong></div>
      <span hidden>Case handoff · available_at-only policy required in v1</span>
    </section>
  );
}
