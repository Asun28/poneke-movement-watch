import type { ReactNode } from "react";
import NowClock from "./NowClock";
import OperatorNavigation from "./OperatorNavigation";

type Props = {
  active: "/live" | "/alerts" | "/replay" | "/integration" | "/ontology" | "/setup";
  eyebrow: string;
  title: string;
  description: string;
  modeLabel: string;
  children: ReactNode;
};

export default function OperatorShell({ active, eyebrow, title, description, modeLabel, children }: Props) {
  return (
    <div className="operator-console">
      <OperatorNavigation active={active} />
      <div className="operator-main-column">
        <header className="operator-global-header">
          <div>
            <span className="status-beacon" aria-hidden="true" />
            <strong>{modeLabel}</strong>
          </div>
          <div className="operator-header-meta">
            <span>WCC demo</span>
            <NowClock />
            <details className="operator-help">
              <summary>Help</summary>
              <div>
                <p>{description}</p>
                <strong>Human review required</strong>
              </div>
            </details>
          </div>
        </header>
        <main id="main-content" className="operator-content" tabIndex={-1}>
          <section className="operator-module-heading">
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
          </section>
          {children}
        </main>
        <footer className="operator-footer">
          <strong>Decision support</strong>
          <span>Call 111 for immediate danger.</span>
        </footer>
      </div>
    </div>
  );
}
