"use client";

import { FormEvent, useEffect, useState } from "react";

type SetupSection = "source" | "connection" | "settings";
type ConnectionKind = "api" | "mcp" | "a2a";
type SavedDraft = Partial<Record<SetupSection, Record<string, string | boolean>>>;

const STORAGE_KEY = "poneke-setup-draft-v1";

const sections: Array<{ id: SetupSection; number: string; title: string; note: string }> = [
  { id: "source", number: "01", title: "Add data source", note: "Describe the feed" },
  { id: "connection", number: "02", title: "Connect a system", note: "API · MCP · A2A" },
  { id: "settings", number: "03", title: "Operations settings", note: "Safe defaults" },
];

const connectionLabels: Record<ConnectionKind, string> = {
  api: "REST API",
  mcp: "MCP",
  a2a: "A2A",
};

function formValues(form: HTMLFormElement) {
  const values: Record<string, string | boolean> = {};
  for (const [key, value] of new FormData(form).entries()) values[key] = String(value).trim();
  for (const input of form.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')) {
    values[input.name] = input.checked;
  }
  return values;
}

export default function SetupClient() {
  const [active, setActive] = useState<SetupSection>("source");
  const [connectionKind, setConnectionKind] = useState<ConnectionKind>("api");
  const [saved, setSaved] = useState<SavedDraft>({});
  const [notice, setNotice] = useState("Draft not saved");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setSaved(JSON.parse(stored));
          setNotice("Saved on this browser");
        }
      } catch {
        setNotice("Browser storage unavailable");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function save(event: FormEvent<HTMLFormElement>, section: SetupSection) {
    event.preventDefault();
    const next = { ...saved, [section]: formValues(event.currentTarget) };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSaved(next);
      setNotice("Saved on this browser");
    } catch {
      setNotice("Could not save this draft");
    }
  }

  function clearDraft() {
    if (!window.confirm("Clear this browser-only setup draft?")) return;
    window.localStorage.removeItem(STORAGE_KEY);
    setSaved({});
    setNotice("Draft cleared");
  }

  const completed = sections.filter((section) => saved[section.id]).length;

  return (
    <section className="setup-workspace" aria-label="Easy integration setup">
      <div className="setup-status-strip">
        <div><span>Progress</span><strong>{completed}/3</strong></div>
        <div><span>Storage</span><strong>{notice}</strong></div>
        <div><span>Activation</span><strong>Needs server activation</strong></div>
        <button type="button" onClick={clearDraft} disabled={!completed}>Clear draft</button>
      </div>

      <div className="setup-step-nav" aria-label="Setup sections">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            aria-pressed={active === section.id}
            onClick={() => setActive(section.id)}
          >
            <span>{section.number}</span>
            <strong>{section.title}</strong>
            <small>{section.note}</small>
            <b aria-hidden="true">{saved[section.id] ? "Saved" : "Open"}</b>
          </button>
        ))}
      </div>

      <section className="setup-panel" hidden={active !== "source"} aria-labelledby="setup-source-title">
        <form onSubmit={(event) => save(event, "source")}>
          <header>
            <p className="eyebrow">Data source</p>
            <h2 id="setup-source-title">Add data source</h2>
          </header>
          <div className="setup-fields">
            <label><span>Source name</span><input name="sourceName" required placeholder="e.g. Metlink alerts" /></label>
            <label><span>Publisher</span><input name="publisher" required placeholder="Organisation" /></label>
            <label><span>Ontology role</span><select name="ontologyRole" defaultValue="observation"><option value="observation">Observation</option><option value="official_event">Official event</option><option value="lifeline">Lifeline</option><option value="context">Context only</option></select></label>
            <label><span>Update</span><select name="cadence" defaultValue="live"><option value="live">Live</option><option value="5_minutes">5 minutes</option><option value="hourly">Hourly</option><option value="daily">Daily</option><option value="batch">Batch</option></select></label>
            <label><span>Format</span><select name="format" defaultValue="json"><option value="json">JSON</option><option value="geojson">GeoJSON</option><option value="xml">XML / CAP</option><option value="gtfs_rt">GTFS-Realtime</option><option value="csv">CSV / Parquet</option></select></label>
            <label><span>Access</span><select name="access" defaultValue="public"><option value="public">Public</option><option value="api_key">API key</option><option value="paid">Paid</option><option value="permission">Permission</option></select></label>
          </div>
          <details>
            <summary>More source fields</summary>
            <div className="setup-fields">
              <label><span>Record ID field</span><input name="recordIdField" placeholder="id" /></label>
              <label><span>Observed time field</span><input name="observedTimeField" placeholder="observed_at" /></label>
              <label><span>Geometry / CRS</span><input name="geometry" placeholder="Point · WGS84" /></label>
              <label><span>Licence</span><input name="licence" placeholder="e.g. CC BY 4.0" /></label>
              <label className="setup-check"><input type="checkbox" name="alertEligible" /><span>May support alert review</span></label>
            </div>
          </details>
          <button className="setup-primary-action" type="submit">Save source draft</button>
        </form>
        <SetupBoundary />
      </section>

      <section className="setup-panel" hidden={active !== "connection"} aria-labelledby="setup-connection-title">
        <form onSubmit={(event) => save(event, "connection")}>
          <header>
            <p className="eyebrow">External integration</p>
            <h2 id="setup-connection-title">Connect a system</h2>
          </header>
          <div className="setup-choice-row" aria-label="Connection type">
            {(Object.keys(connectionLabels) as ConnectionKind[]).map((kind) => (
              <button key={kind} type="button" aria-pressed={connectionKind === kind} onClick={() => setConnectionKind(kind)}>{connectionLabels[kind]}</button>
            ))}
          </div>
          <input type="hidden" name="connectionKind" value={connectionKind} />
          <div className="setup-fields">
            <label><span>Connection name</span><input name="connectionName" required placeholder="Short name" /></label>
            <label><span>Direction</span><select name="direction" defaultValue="inbound"><option value="inbound">Into this platform</option><option value="outbound">To another system</option><option value="both">Both</option></select></label>
            <label className="setup-wide"><span>{connectionKind === "a2a" ? "Agent Card URL" : "Endpoint URL"}</span><input name="endpoint" type="url" required placeholder={connectionKind === "a2a" ? "https://agent.example/.well-known/agent-card.json" : connectionKind === "mcp" ? "https://service.example/mcp" : "https://api.example/v1"} /></label>
            <label><span>Authentication</span><select name="auth" defaultValue="none"><option value="none">None</option><option value="api_key">API key</option><option value="oauth2">OAuth 2</option><option value="bearer">Bearer token</option><option value="from_agent_card">From Agent Card</option></select></label>
            <label><span>Secret reference</span><input name="secretReference" placeholder="e.g. METLINK_API_KEY" autoComplete="off" /></label>
          </div>
          <div hidden={connectionKind !== "api"} className="setup-protocol-note"><strong>REST API</strong><span>Optional OpenAPI contract can be added during server activation.</span></div>
          <div hidden={connectionKind !== "mcp"} className="setup-protocol-note"><strong>MCP · Streamable HTTP</strong><span>Remote endpoint only. Server validates Origin, auth and capabilities.</span></div>
          <div hidden={connectionKind !== "a2a"} className="setup-protocol-note"><strong>A2A · Agent Card</strong><span>Capabilities, interface and auth come from the Agent Card.</span></div>
          <button className="setup-primary-action" type="submit">Save connection draft</button>
        </form>
        <SetupBoundary />
      </section>

      <section className="setup-panel" hidden={active !== "settings"} aria-labelledby="setup-settings-title">
        <form onSubmit={(event) => save(event, "settings")}>
          <header>
            <p className="eyebrow">Operator defaults</p>
            <h2 id="setup-settings-title">Operations settings</h2>
          </header>
          <div className="setup-fields">
            <label><span>Live refresh</span><select name="refreshSeconds" defaultValue="60"><option value="30">30 seconds</option><option value="60">60 seconds</option><option value="120">2 minutes</option></select></label>
            <label><span>Stale warning</span><select name="staleMinutes" defaultValue="30"><option value="10">10 minutes</option><option value="30">30 minutes</option><option value="60">60 minutes</option></select></label>
            <label><span>Default view</span><select name="defaultView" defaultValue="wellington_city"><option value="wellington_city">Wellington City</option><option value="region">Wellington Region</option><option value="last_view">Last map view</option></select></label>
            <label><span>Time zone</span><input value="Pacific/Auckland" readOnly aria-readonly="true" /></label>
            <label className="setup-check"><input type="checkbox" name="showMock" /><span>Show mock layers</span></label>
            <label className="setup-check is-locked"><input type="checkbox" checked readOnly disabled /><span>Human review required</span></label>
          </div>
          <button className="setup-primary-action" type="submit">Save settings</button>
        </form>
        <SetupBoundary />
      </section>
    </section>
  );
}

function SetupBoundary() {
  return (
    <aside className="setup-boundary" aria-label="Activation boundary">
      <span>Safe draft</span>
      <strong>No secrets stored here</strong>
      <ul>
        <li>Saved on this browser</li>
        <li>Evidence weight stays 0</li>
        <li>Server test required</li>
        <li>Human approval required</li>
      </ul>
    </aside>
  );
}
