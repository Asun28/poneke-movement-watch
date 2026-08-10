import LiveOperationsClient from "../components/LiveOperationsClient";
import OperatorShell from "../components/OperatorShell";

export default function LiveOperationsPage() {
  return (
    <OperatorShell
      active="/live"
      eyebrow="Current operating picture"
      title="Live Operations"
      description="Choose source layers, then select a map marker. Empty is not an all-clear."
      modeLabel="Live"
    >
      <LiveOperationsClient />
    </OperatorShell>
  );
}
