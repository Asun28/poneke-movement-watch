import AlertCentreClient from "../components/AlertCentreClient";
import OperatorShell from "../components/OperatorShell";

export default function AlertCentrePage() {
  return (
    <OperatorShell
      active="/alerts"
      eyebrow="Evidence-gated investigation"
      title="Alert Centre"
      description="Human review queue for fresh, real observations that pass deterministic source, time and ontology gates. Models can propose and explain; authorised staff decide."
      modeLabel="Review-only alerts"
    >
      <AlertCentreClient />
    </OperatorShell>
  );
}
