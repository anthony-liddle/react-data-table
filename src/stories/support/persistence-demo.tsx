import { useCallback, useEffect, useMemo, useState } from 'react';

import { DataTable } from '../../components/data-table/data-table.tsx';
import type { TableColumn } from '../../components/data-table/types.ts';
import { usePersistedFilters } from '../../hooks/use-persisted-filters.ts';
import { useTableSort } from '../../hooks/use-table-sort.ts';
import {
  Demo,
  DemoButton,
  Intro,
  KeyValues,
  StatePanel,
  Toolbar,
  useLiveValue,
} from './demo-ui.tsx';
import { type Member, memberColumn, members, sortKeysOf, sortMembers, TEAMS } from './members.tsx';

/**
 * The URL params every persisted piece of state writes to. They are not
 * namespaced by persistKey (that is how the component works), so a demo that
 * means to prove localStorage persistence has to strip them first.
 */
const PERSISTED_PARAMS = ['sort', 'dir', 'cols', 'team'] as const;

const storageKeysFor = (persistKey: string) => [
  `datatable:${persistKey}`,
  `tablesort:${persistKey}:key`,
  `tablesort:${persistKey}:dir`,
  `filters:${persistKey}`,
];

const stripPersistedParams = () => {
  const url = new URL(window.location.href);
  for (const param of PERSISTED_PARAMS) {
    url.searchParams.delete(param);
  }
  window.history.replaceState(window.history.state, '', url);
};

const clearPersistedStorage = (persistKey: string) => {
  for (const key of storageKeysFor(persistKey)) {
    try {
      localStorage.removeItem(key);
    } catch {
      // storage unavailable (private mode): nothing to clear
    }
  }
};

const readParams = (): [string, string][] => {
  const params = new URLSearchParams(window.location.search);
  return PERSISTED_PARAMS.filter(p => params.has(p)).map(p => [p, params.get(p) ?? '']);
};

const readStorage = (persistKey: string): [string, string][] =>
  storageKeysFor(persistKey).map(key => {
    try {
      return [key, localStorage.getItem(key) ?? '(not set)'];
    } catch {
      return [key, '(storage unavailable)'];
    }
  });

/** The column-order signature uses a unit-separator control char; make it visible. */
const printable = (value: string) => value.replaceAll('\u001f', '␟');

/**
 * Link to this exact view. Inside the Storybook UI it targets the manager
 * page (`/?path=/story/…`), which forwards unknown query params into the
 * preview iframe; standalone it is just the iframe URL.
 */
const buildShareLink = (storyId: string | undefined) => {
  const params = readParams();
  try {
    if (storyId && window.parent !== window) {
      const manager = new URL(window.parent.location.href);
      const link = new URL(manager.pathname, manager.origin);
      link.searchParams.set('path', `/story/${storyId}`);
      for (const [key, value] of params) {
        link.searchParams.set(key, value);
      }
      return link.toString();
    }
  } catch {
    // parent on another origin: fall through to the iframe URL
  }
  return window.location.href;
};

const columns: TableColumn<Member>[] = [
  memberColumn.name,
  memberColumn.email,
  memberColumn.team,
  memberColumn.role,
  memberColumn.status,
  memberColumn.joined,
  memberColumn.projects,
  { ...memberColumn.location, hideByDefault: true },
  { ...memberColumn.storage, hideByDefault: true },
];
const SORT_KEYS = sortKeysOf(columns);

const TEAM_FILTER = {
  team: {
    param: 'team',
    defaultValue: 'all',
    serialize: (value: string) => (value === 'all' ? null : value),
    deserialize: (raw: string) => ((TEAMS as readonly string[]).includes(raw) ? raw : 'all'),
  },
} as const;

export type PersistenceMechanism = 'url' | 'localStorage';

interface PersistedTableProps {
  mechanism: PersistenceMechanism;
  persistKey: string;
  rowCount: number;
}

const PersistedTable = ({ mechanism, persistKey, rowCount }: PersistedTableProps) => {
  const { sort, direction, handleSort } = useTableSort({ sortableColumns: SORT_KEYS, persistKey });
  const [filters, setFilter] = usePersistedFilters(persistKey, TEAM_FILTER, {
    persistToStorage: mechanism === 'localStorage',
  });
  const team = filters.team as string;

  const rows = useMemo(() => {
    const scoped = members.slice(0, rowCount);
    const filtered = team === 'all' ? scoped : scoped.filter(m => m.team === team);
    return sortMembers(filtered, sort, direction);
  }, [rowCount, team, sort, direction]);

  const selectId = `team-filter-${mechanism}`;
  return (
    <>
      <Toolbar>
        <label htmlFor={selectId}>Team</label>
        <select
          id={selectId}
          className="rounded-md border border-border bg-card px-2 py-1"
          value={team}
          onChange={e => setFilter('team', e.target.value)}
        >
          <option value="all">All teams</option>
          {TEAMS.map(t => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </Toolbar>
      <DataTable
        columns={columns}
        data={rows}
        sort={{ sortKey: sort, direction, handleSort }}
        persistKey={persistKey}
      />
    </>
  );
};

interface IsolatedDemoProps extends PersistedTableProps {
  storyId?: string;
  onRemount: () => void;
}

const IsolatedDemo = ({
  mechanism,
  persistKey,
  rowCount,
  storyId,
  onRemount,
}: IsolatedDemoProps) => {
  // Runs once per mount, during the first render and therefore before the
  // table's lazy state initializers read anything. Removing the other
  // mechanism means whatever the table restores can only have come from the
  // one this story demonstrates.
  useState(() => {
    if (mechanism === 'url') {
      clearPersistedStorage(persistKey);
    } else {
      stripPersistedParams();
    }
    return null;
  });

  // The localStorage story's table still writes URL params (the component
  // always writes both); don't leave them behind for the next story to read.
  useEffect(
    () => () => {
      if (mechanism === 'localStorage') {
        stripPersistedParams();
      }
    },
    [mechanism]
  );

  const readUrl = useCallback(() => readParams(), []);
  const readStore = useCallback(() => readStorage(persistKey), [persistKey]);
  const params = useLiveValue(readUrl);
  const stored = useLiveValue(readStore);
  const shareLink = useLiveValue(useCallback(() => buildShareLink(storyId), [storyId]));

  const resetView = () => {
    clearPersistedStorage(persistKey);
    stripPersistedParams();
    onRemount();
  };

  return (
    <Demo>
      {mechanism === 'url' ? (
        <Intro>
          Sort a column, pick a team, and show, hide, or drag columns in the gear menu. Every change
          is written to the URL. To check it, use <strong>Reload table from URL</strong>, or open
          the link in the panel below in a new tab. This story deletes its localStorage before the
          table mounts, so the view you get back can only have come from the URL.
        </Intro>
      ) : (
        <Intro>
          Sort a column, pick a team, and show, hide, or drag columns in the gear menu, then reload
          the whole page. This story removes <code>sort</code>, <code>dir</code>, <code>cols</code>{' '}
          and <code>team</code> from the URL before the table mounts, so the view that comes back
          can only have come from localStorage.
        </Intro>
      )}
      {mechanism === 'url' ? (
        <StatePanel label="Persisted in the URL">
          <KeyValues
            entries={
              params.length > 0
                ? params.map(([key, value]) => [key, printable(value)])
                : [['(none)', 'change something in the table below']]
            }
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <DemoButton
              onClick={() => {
                clearPersistedStorage(persistKey);
                onRemount();
              }}
            >
              Reload table from URL
            </DemoButton>
            <DemoButton onClick={resetView}>Reset view</DemoButton>
            <a
              href={shareLink}
              target="_blank"
              rel="noopener"
              className="underline underline-offset-2"
            >
              Open this view in a new tab
            </a>
          </div>
          <label className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
            Shareable link
            <input
              readOnly
              value={shareLink}
              onFocus={e => e.currentTarget.select()}
              className="w-full rounded-md border border-border bg-background px-2 py-1 font-mono text-foreground"
            />
          </label>
        </StatePanel>
      ) : (
        <StatePanel label="Persisted in localStorage">
          <KeyValues entries={stored.map(([key, value]) => [key, printable(value)])} />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <DemoButton
              onClick={() => {
                stripPersistedParams();
                onRemount();
              }}
            >
              Reload table from localStorage
            </DemoButton>
            <DemoButton onClick={resetView}>Reset view</DemoButton>
          </div>
        </StatePanel>
      )}
      <PersistedTable mechanism={mechanism} persistKey={persistKey} rowCount={rowCount} />
    </Demo>
  );
};

export interface PersistenceDemoProps {
  mechanism: PersistenceMechanism;
  /** Namespace for the localStorage keys (URL params are shared regardless). */
  persistKey: string;
  rowCount: number;
  /** Supplied by the story's render function; used to build the share link. */
  storyId?: string;
}

export const PersistenceDemo = (props: PersistenceDemoProps) => {
  const [generation, setGeneration] = useState(0);
  return (
    <IsolatedDemo
      key={`${props.mechanism}:${props.persistKey}:${props.rowCount}:${generation}`}
      {...props}
      onRemount={() => setGeneration(g => g + 1)}
    />
  );
};
