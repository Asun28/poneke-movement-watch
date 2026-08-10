import AlertCentreClient from "../components/AlertCentreClient";
import OperatorShell from "../components/OperatorShell";

export default function AlertCentrePage() {
  return (
    <OperatorShell
      active="/alerts"
      eyebrow="Evidence-gated investigation"
      title="Alert Centre"
      description="Select a candidate and check its evidence. Models can propose and explain; authorised staff decide."
      modeLabel="Review queue"
    >
      <AlertCentreClient />
    </OperatorShell>
  );
}
