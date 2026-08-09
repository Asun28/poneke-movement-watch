import registry from "../../public/cop/v2/source-registry.json";
import { buildSourceContracts } from "../../lib/dataIntegration.mjs";
import { SOURCE_MANIFEST } from "../../lib/sourceManifest.mjs";
import CityOntologyExplorer from "../CityOntologyExplorer";
import IntegrationRegistry from "../components/IntegrationRegistry";
import OperatorShell from "../components/OperatorShell";
import SourceCapabilityPreview from "../SourceCapabilityPreview";

const contracts = buildSourceContracts(registry, SOURCE_MANIFEST);

export default function IntegrationPage() {
  return (
    <OperatorShell
      active="/integration"
      eyebrow="Shared platform boundary"
      title="Data Integration"
      description="One versioned provider boundary supplies Live Operations, Alert Centre, Replay Analyzer and future Council modules with normalized observations, health, provenance and access state."
      modeLabel="33 registered sources"
    >
      <section className="integration-architecture" aria-label="Data integration architecture">
        <div><span>01</span><strong>Official APIs</strong><small>Real, keyed, paid or permission-gated</small></div>
        <b aria-hidden="true">→</b>
        <div><span>02</span><strong>Provider adapters</strong><small>Validate raw official envelopes</small></div>
        <b aria-hidden="true">→</b>
        <div><span>03</span><strong>Integration API</strong><small>Normalize health, provenance and time</small></div>
        <b aria-hidden="true">→</b>
        <div><span>04</span><strong>Modular consumers</strong><small>Live · Alerts · Replay · future systems</small></div>
      </section>
      <IntegrationRegistry contracts={contracts.sources} />
      <section className="integration-endpoints" aria-labelledby="integration-endpoints-heading">
        <div>
          <p className="eyebrow">Versioned API</p>
          <h2 id="integration-endpoints-heading">The feed is the shared product</h2>
          <p>External dashboards consume the same server-owned contracts. They do not call providers or infer source health independently.</p>
        </div>
        <div className="endpoint-list">
          <a href="/api/integration/v1/contracts"><span>Provider contracts</span><code>/api/integration/v1/contracts</code></a>
          <a href="/api/integration/v1/snapshot"><span>Current normalized snapshot</span><code>/api/integration/v1/snapshot</code></a>
          <a href="/api/alerts/v1/candidates"><span>Review-only alert candidates</span><code>/api/alerts/v1/candidates</code></a>
          <a href="/cop/v2/observations.geojson"><span>Typed replay observations</span><code>/cop/v2/observations.geojson</code></a>
          <a href="/cop/v2/source-registry.json"><span>Source registry</span><code>/cop/v2/source-registry.json</code></a>
          <a href="/cop/v3/city-ontology.json"><span>Wellington City Ontology</span><code>/cop/v3/city-ontology.json</code></a>
        </div>
      </section>
      <CityOntologyExplorer />
      <SourceCapabilityPreview />
    </OperatorShell>
  );
}
