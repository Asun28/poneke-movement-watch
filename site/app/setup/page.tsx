import OperatorShell from "../components/OperatorShell";
import SetupClient from "../components/SetupClient";

export default function SetupPage() {
  return (
    <OperatorShell
      active="/setup"
      eyebrow="Integration workspace"
      title="Easy setup"
      description="Choose a section, complete the fields, then save the draft. Server activation is separate."
      modeLabel="Draft"
    >
      <SetupClient />
    </OperatorShell>
  );
}
