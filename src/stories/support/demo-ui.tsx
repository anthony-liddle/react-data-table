import { type ReactNode, useEffect, useState } from 'react';

/** Small building blocks shared by the demo stories, styled in .storybook/preview.css. */

export const Demo = ({ children }: { children: ReactNode }) => (
  <div className="demo">{children}</div>
);

/** The "what to try" line above each demo; the canvas is all a visitor sees. */
export const Intro = ({ children }: { children: ReactNode }) => (
  <p className="demo-intro">{children}</p>
);

export const Toolbar = ({ children }: { children: ReactNode }) => (
  <div className="demo-toolbar">{children}</div>
);

export const DemoButton = ({ children, onClick }: { children: ReactNode; onClick: () => void }) => (
  <button type="button" onClick={onClick} className="demo-button">
    {children}
  </button>
);

/** A labelled, live-announced readout of demo state. */
export const StatePanel = ({ label, children }: { label: string; children: ReactNode }) => (
  <section aria-label={label} aria-live="polite" className="demo-panel">
    <p className="demo-panel__label">{label}</p>
    {children}
  </section>
);

export const KeyValues = ({ entries }: { entries: [string, ReactNode][] }) => (
  <dl className="demo-keyvalues">
    {entries.map(([key, value]) => (
      <div key={key} className="demo-keyvalues__row">
        <dt className="demo-muted">{key}</dt>
        <dd className="demo-keyvalues__value">{value}</dd>
      </div>
    ))}
  </dl>
);

/**
 * Re-reads a value that changes outside React (the iframe URL after
 * `history.replaceState`, or localStorage) and re-renders when it differs.
 */
export const useLiveValue = <T,>(read: () => T, intervalMs = 250): T => {
  const [value, setValue] = useState(read);
  useEffect(() => {
    const id = window.setInterval(() => {
      const next = read();
      setValue(prev => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [read, intervalMs]);
  return value;
};
