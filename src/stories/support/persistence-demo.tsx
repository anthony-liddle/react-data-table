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
 * The URL params a table persists to, all in its own namespace
 * (`{persistKey}.sort`, `{persistKey}.team`). A demo that means to prove
 * localStorage persistence has to strip them first.
 */
const isPersistedParam = (persistKey: string, param: string) => param.startsWith(`${persistKey}.`);

const storageKeysFor = (persistKey: string) => [
  `rdt:1:${persistKey}:sort`,
  `rdt:1:${persistKey}:filters`,
  `rdt:1:${persistKey}:columns`,
];

const stripPersistedParams = (persistKey: string) => {
  const url = new URL(window.location.href);
  for (const param of [...url.searchParams.keys()]) {
    if (isPersistedParam(persistKey, param)) {
      url.searchParams.delete(param);
    }
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

const readParams = (persistKey: string): [string, string][] =>
  [...new URLSearchParams(window.location.search)].filter(([param]) =>
    isPersistedParam(persistKey, param)
  );

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
const buildShareLink = (persistKey: string, storyId: string | undefined) => {
  const params = readParams(persistKey);
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
  const sort = useTableSort({ sortableColumns: SORT_KEYS, persistKey });
  const { filters, setFilter } = usePersistedFilters(persistKey, TEAM_FILTER, {
    persistToStorage: mechanism === 'localStorage',
  });
  const team = filters.team as string;

  const rows = useMemo(() => {
    const scoped = members.slice(0, rowCount);
    const filtered = team === 'all' ? scoped : scoped.filter(m => m.team === team);
    return sortMembers(filtered, sort.sortBy);
  }, [rowCount, team, sort.sortBy]);

  const selectId = `team-filter-${persistKey}`;
  return (
    <>
      <Toolbar>
        <label htmlFor={selectId}>Team</label>
        <select
          id={selectId}
          className="demo-select"
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
      <DataTable columns={columns} data={rows} sort={sort} persistKey={persistKey} />
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
      stripPersistedParams(persistKey);
    }
    return null;
  });

  // The localStorage story's table still writes URL params (the component
  // always writes both); don't leave them behind for the next story to read.
  useEffect(
    () => () => {
      if (mechanism === 'localStorage') {
        stripPersistedParams(persistKey);
      }
    },
    [mechanism]
  );

  const readUrl = useCallback(() => readParams(persistKey), [persistKey]);
  const readStore = useCallback(() => readStorage(persistKey), [persistKey]);
  const params = useLiveValue(readUrl);
  const stored = useLiveValue(readStore);
  const shareLink = useLiveValue(
    useCallback(() => buildShareLink(persistKey, storyId), [persistKey, storyId])
  );

  const resetView = () => {
    clearPersistedStorage(persistKey);
    stripPersistedParams(persistKey);
    onRemount();
  };

  return (
    <Demo>
      {mechanism === 'url' ? (
        <Intro>
          Sort a column (Shift+click adds another) and pick a team. Both are written to the URL
          under this table's <code>persistKey</code>. To check it, use{' '}
          <strong>Reload table from URL</strong>, or open the link in the panel below in a new tab.
          This story deletes its localStorage before the table mounts, so the view you get back can
          only have come from the URL. Column visibility and order are saved in localStorage only,
          so they are not part of a link.
        </Intro>
      ) : (
        <Intro>
          Sort a column, pick a team, and show, hide, or drag columns in the gear menu, then reload
          the whole page. This story removes the table's own URL params (
          <code>{persistKey}.sort</code> and <code>{persistKey}.team</code>) before the table
          mounts, so the view that comes back can only have come from localStorage. Restoring it
          writes the sort straight back to the URL.
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
          <div className="demo-actions">
            <DemoButton
              onClick={() => {
                clearPersistedStorage(persistKey);
                onRemount();
              }}
            >
              Reload table from URL
            </DemoButton>
            <DemoButton onClick={resetView}>Reset view</DemoButton>
            <a href={shareLink} target="_blank" rel="noopener" className="demo-link">
              Open this view in a new tab
            </a>
          </div>
          <label className="demo-field">
            Shareable link
            <input
              readOnly
              value={shareLink}
              onFocus={e => e.currentTarget.select()}
              className="demo-input"
            />
          </label>
        </StatePanel>
      ) : (
        <StatePanel label="Persisted in localStorage">
          <KeyValues entries={stored.map(([key, value]) => [key, printable(value)])} />
          <div className="demo-actions">
            <DemoButton
              onClick={() => {
                stripPersistedParams(persistKey);
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

/**
 * Two persisted tables on one page, each under its own `persistKey`. Starts
 * clean, and strips its params on unmount so the next story doesn't read them.
 */
export const TwoPersistedTables = ({ rowCount }: { rowCount: number }) => {
  const keys = ['two-left', 'two-right'];
  const [generation, setGeneration] = useState(0);
  useState(() => {
    for (const key of keys) {
      clearPersistedStorage(key);
      stripPersistedParams(key);
    }
    return null;
  });
  useEffect(
    () => () => {
      for (const key of ['two-left', 'two-right']) {
        stripPersistedParams(key);
      }
    },
    []
  );

  return (
    <Demo>
      <Intro>
        Two tables on one page, each with its own <code>persistKey</code>. Each writes its own URL
        params and storage keys, so neither reads the other's view.
      </Intro>
      <div className="demo-actions">
        <DemoButton onClick={() => setGeneration(g => g + 1)}>Remount tables</DemoButton>
      </div>
      {keys.map(key => (
        <section key={`${key}:${generation}`} aria-label={key}>
          <PersistedTable mechanism="localStorage" persistKey={key} rowCount={rowCount} />
        </section>
      ))}
    </Demo>
  );
};
