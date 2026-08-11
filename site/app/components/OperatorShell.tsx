import type { ReactNode } from "react";
import NowClock from "./NowClock";
import OperatorNavigation from "./OperatorNavigation";

type Props = {
  active: "/live" | "/alerts" | "/replay" | "/integration" | "/ontology" | "/setup";
  title: string;
  modeLabel: string;
  children: ReactNode;
};

export default function OperatorShell({ active, title, modeLabel, children }: Props) {
  return (
    <div className="operator-console" data-operator-type-floor="13px">
      <OperatorNavigation active={active} />
      <div className="operator-main-column">
        <main id="main-content" className="operator-content" tabIndex={-1}>
          <header className="operator-title-bar" aria-label="Page title and status">
            <div>
              <h1>{title}</h1>
              <span className="operator-mode-label">{modeLabel}</span>
            </div>
            <NowClock />
          </header>
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
