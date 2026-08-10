import OperatorShell from "../components/OperatorShell";
import SetupClient from "../components/SetupClient";

export default function SetupPage() {
  return (
    <OperatorShell
      active="/setup"
      eyebrow="Integration workspace"
      title="Easy setup"
      description="Prepare a source, system connection or operator preference without exposing credentials or changing the live platform."
      modeLabel="Local setup draft"
    >
      <SetupClient />
    </OperatorShell>
  );
}
