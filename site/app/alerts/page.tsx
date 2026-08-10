import AlertCentreClient from "../components/AlertCentreClient";
import OperatorShell from "../components/OperatorShell";

export default function AlertCentrePage() {
  return (
    <OperatorShell
      active="/alerts"
      title="Signal Review"
      modeLabel="Triage queue"
    >
      <AlertCentreClient />
    </OperatorShell>
  );
}
