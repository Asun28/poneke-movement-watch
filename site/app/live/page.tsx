import LiveOperationsClient from "../components/LiveOperationsClient";
import OperatorShell from "../components/OperatorShell";

export default function LiveOperationsPage() {
  return (
    <OperatorShell
      active="/live"
      title="Live Operations"
      modeLabel="Live"
    >
      <LiveOperationsClient />
    </OperatorShell>
  );
}
