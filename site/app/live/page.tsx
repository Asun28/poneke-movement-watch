import LiveOperationsClient from "../components/LiveOperationsClient";
import OperatorShell from "../components/OperatorShell";

export default function LiveOperationsPage() {
  return (
    <OperatorShell
      active="/live"
      eyebrow="Current operating picture"
      title="Live Operations"
      description="What is happening now across Wellington? Current official observations, source freshness and connector failures stay visible without turning absence into an all-clear."
      modeLabel="Live source snapshot"
    >
      <LiveOperationsClient />
    </OperatorShell>
  );
}
