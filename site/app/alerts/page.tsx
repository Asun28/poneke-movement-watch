import AlertCentreClient from "../components/AlertCentreClient";
import OperatorShell from "../components/OperatorShell";

export default function AlertCentrePage() {
  return (
    <OperatorShell
      active="/alerts"
      title="Alert Centre"
      modeLabel="Review queue"
    >
      <AlertCentreClient />
    </OperatorShell>
  );
}
