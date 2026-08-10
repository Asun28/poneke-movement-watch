import registry from "../../public/cop/v2/source-registry.json";
import ontology from "../../public/cop/v3/city-ontology.json";
import { buildOntologyDashboardModel, buildSourceContracts } from "../../lib/dataIntegration.mjs";
import { SOURCE_MANIFEST } from "../../lib/sourceManifest.mjs";
import CityOntologyExplorer from "../CityOntologyExplorer";
import OntologyDashboard from "../components/OntologyDashboard";
import OperatorShell from "../components/OperatorShell";

const contracts = buildSourceContracts(registry, SOURCE_MANIFEST);
const ontologyDashboard = buildOntologyDashboardModel(contracts, ontology);

export default function OntologyPage() {
  return (
    <OperatorShell
      active="/ontology"
      title="City Ontology"
      modeLabel="33 ontology paths"
    >
      <OntologyDashboard model={ontologyDashboard} />
      <details className="operator-advanced">
        <summary>Machine-readable ontology</summary>
        <CityOntologyExplorer />
      </details>
    </OperatorShell>
  );
}
