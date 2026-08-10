import OperatorShell from "../components/OperatorShell";
import SetupClient from "../components/SetupClient";

export default function SetupPage() {
  return (
    <OperatorShell
      active="/setup"
      title="Easy setup"
      modeLabel="Draft"
    >
      <SetupClient />
    </OperatorShell>
  );
}
