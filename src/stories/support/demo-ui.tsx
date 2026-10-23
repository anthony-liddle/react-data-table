import { type ReactNode, useEffect, useState } from 'react';

/** Small, token-styled building blocks shared by the demo stories. */

export const Demo = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-col gap-3">{children}</div>
);

/** The "what to try" line above each demo; the canvas is all a visitor sees. */
export const Intro = ({ children }: { children: ReactNode }) => (
  <p className="max-w-prose text-sm text-muted-foreground">{children}</p>
);

export const Toolbar = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-wrap items-center gap-2 text-sm">{children}</div>
);

export const DemoButton = ({ children, onClick }: { children: ReactNode; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="rounded-md border border-border bg-card px-2.5 py-1 text-sm hover:bg-accent"
  >
    {children}
  </button>
);

/** A labelled, live-announced readout of demo state. */
export const StatePanel = ({ label, children }: { label: string; children: ReactNode }) => (
  <section
    aria-label={label}
    aria-live="polite"
    className="rounded-md border border-border bg-card px-3 py-2 text-sm"
  >
    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {label}
    </p>
    {children}
  </section>
);

export const KeyValues = ({ entries }: { entries: [string, ReactNode][] }) => (
  <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 font-mono text-xs">
    {entries.map(([key, value]) => (
      <div key={key} className="contents">
        <dt className="text-muted-foreground">{key}</dt>
        <dd className="break-all">{value}</dd>
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
