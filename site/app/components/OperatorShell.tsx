import type { ReactNode } from "react";
import NowClock from "./NowClock";
import OperatorNavigation from "./OperatorNavigation";

type Props = {
  active: "/live" | "/alerts" | "/replay" | "/integration" | "/setup";
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
            <span>WCC prototype environment</span>
            <NowClock />
          </div>
        </header>
        <main id="main-content" className="operator-content" tabIndex={-1}>
          <section className="operator-module-heading">
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p>{description}</p>
          </section>
          {children}
        </main>
        <footer className="operator-footer">
          <strong>Not an emergency dispatch system.</strong> Call 111 for immediate danger.
          Every candidate remains an inference until an authorised human reviews it.
        </footer>
      </div>
    </div>
  );
}
