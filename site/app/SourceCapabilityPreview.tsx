import registryData from "../public/cop/v2/source-registry.json";

type Preview = {
  label: string;
  summary: string;
  is_synthetic: boolean;
  evidence_weight: number;
};

type PreviewSource = {
  id: string;
  name: string;
  demo_data_status: "real_replay" | "mock_preview" | "registered_only";
  access_status: string;
  capability_preview?: Preview;
};

const sources = (registryData.sources as PreviewSource[]).filter(
  (source) => source.capability_preview,
);

const accessLabels: Record<string, string> = {
  public_free: "PUBLIC SOURCE",
  council_input_required: "COUNCIL INPUT",
  permission_required: "NEEDS PERMISSION",
  publisher_clearance_required: "NEEDS CLEARANCE",
  paid_key_required: "PAID API",
};

export default function SourceCapabilityPreview() {
  const realCount = registryData.sources.filter(
    (source) => source.demo_data_status === "real_replay",
  ).length;
  const mockCount = registryData.sources.filter(
    (source) => source.demo_data_status === "mock_preview",
  ).length;
  const registeredCount = registryData.sources.filter(
    (source) => source.demo_data_status === "registered_only",
  ).length;

  return (
    <section className="source-preview" aria-labelledby="source-preview-heading">
      <header className="source-preview-header">
        <h2 id="source-preview-heading">Source capabilities</h2>
        <dl className="source-totals" aria-label="Source status totals">
          <div><dt>Real replay</dt><dd>{realCount}</dd></div>
          <div><dt>Mock</dt><dd>{mockCount}</dd></div>
          <div><dt>Registered</dt><dd>{registeredCount}</dd></div>
        </dl>
      </header>

      <div className="source-card-grid">
        {sources.map((source) => {
          const preview = source.capability_preview as Preview;
          const isMock = source.demo_data_status === "mock_preview";
          return (
            <article className={`source-card ${isMock ? "is-mock" : "is-real"}`} key={source.id}>
              <div className="source-card-status">
                <span>{isMock ? "MOCK · ZERO WEIGHT" : "REAL REPLAY"}</span>
                <span>{accessLabels[source.access_status] ?? source.access_status}</span>
              </div>
              <h3>{preview.label}</h3>
              <small>{source.name}</small>
            </article>
          );
        })}
      </div>
    </section>
  );
}
