import registry from "../../public/cop/v2/source-registry.json";
import { buildSourceContracts } from "../../lib/dataIntegration.mjs";
import { SOURCE_MANIFEST } from "../../lib/sourceManifest.mjs";
import IntegrationRegistry from "../components/IntegrationRegistry";
import OperatorShell from "../components/OperatorShell";
import SourceCapabilityPreview from "../SourceCapabilityPreview";

const contracts = buildSourceContracts(registry, SOURCE_MANIFEST);

export default function IntegrationPage() {
  return (
    <OperatorShell
      active="/integration"
      title="Data Integration"
      modeLabel="33 registered sources"
    >
      <IntegrationRegistry contracts={contracts.sources} />
      <details className="operator-advanced">
        <summary>Advanced</summary>
        <section className="integration-architecture" aria-label="Data integration architecture">
          <div><span>01</span><strong>Official APIs</strong></div><b aria-hidden="true">→</b>
          <div><span>02</span><strong>Provider adapters</strong></div><b aria-hidden="true">→</b>
          <div><span>03</span><strong>Integration API</strong></div><b aria-hidden="true">→</b>
          <div><span>04</span><strong>Council systems</strong></div>
        </section>
        <section className="integration-endpoints" aria-labelledby="integration-endpoints-heading">
          <h2 id="integration-endpoints-heading">Data links</h2>
          <div className="endpoint-list">
            <a href="/api/integration/v1/contracts"><span>Provider contracts</span><code>/api/integration/v1/contracts</code></a>
            <a href="/api/integration/v1/snapshot"><span>Current snapshot</span><code>/api/integration/v1/snapshot</code></a>
            <a href="/api/alerts/v1/candidates"><span>Alert candidates</span><code>/api/alerts/v1/candidates</code></a>
            <a href="/api/integration/v1/workflow-adapters"><span>Workflow mock adapters</span><code>/api/integration/v1/workflow-adapters</code></a>
            <a href="/cop/v2/observations.geojson"><span>Replay observations</span><code>/cop/v2/observations.geojson</code></a>
            <a href="/cop/v2/source-registry.json"><span>Source registry</span><code>/cop/v2/source-registry.json</code></a>
            <a href="/cop/v3/city-ontology.json"><span>City ontology</span><code>/cop/v3/city-ontology.json</code></a>
          </div>
        </section>
        <SourceCapabilityPreview />
      </details>
    </OperatorShell>
  );
}
