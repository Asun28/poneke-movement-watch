"use client";

type Investigation = {
  id: string;
  case_id: string;
  source_id: string;
  starts_at: string;
  as_of: string;
  scope: string;
};

export default function ReplayCaseContext({ investigation }: { investigation?: Investigation }) {
  return (
    <span
      hidden
      data-replay-case={investigation?.case_id ?? ""}
      data-replay-source={investigation?.source_id ?? ""}
      data-replay-from={investigation?.starts_at ?? ""}
      data-replay-as-of={investigation?.as_of ?? ""}
      data-replay-scope={investigation?.scope ?? ""}
    >Case handoff · available_at-only policy required in v1</span>
  );
}
