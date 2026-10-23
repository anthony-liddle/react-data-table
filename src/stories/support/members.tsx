import type { BaseTableRow, SortOrder, TableColumn } from '../../components/data-table/types.ts';
import { at } from '../../test-support/at.ts';

/**
 * Invented demo data: a workspace member directory for a company that does
 * not exist. Generated from a fixed seed so every reload, every visitor, and
 * every test sees the same 120 rows.
 */
export interface Member extends BaseTableRow {
  id: string;
  name: string;
  email: string;
  team: Team;
  role: Role;
  status: Status;
  location: string;
  /** ISO date (YYYY-MM-DD). */
  joined: string;
  /** ISO date, or null for members who never accepted their invite. */
  lastActive: string | null;
  projects: number;
  storageGb: number;
}

export const TEAMS = [
  'Design',
  'Engineering',
  'Product',
  'Marketing',
  'Sales',
  'Support',
  'Finance',
] as const;
export type Team = (typeof TEAMS)[number];

export const ROLES = ['Owner', 'Admin', 'Editor', 'Viewer'] as const;
export type Role = (typeof ROLES)[number];

export const STATUSES = ['Active', 'Invited', 'Suspended'] as const;
export type Status = (typeof STATUSES)[number];

const FIRST_NAMES = [
  'Ada',
  'Bram',
  'Cleo',
  'Dario',
  'Esme',
  'Farah',
  'Gus',
  'Hana',
  'Idris',
  'Juno',
  'Kofi',
  'Lena',
  'Mateo',
  'Nia',
  'Oskar',
  'Priya',
  'Quinn',
  'Rosa',
  'Soren',
  'Talia',
  'Umar',
  'Vera',
  'Wes',
  'Xiu',
  'Yusuf',
  'Zara',
];

const LAST_NAMES = [
  'Abara',
  'Bellweather',
  'Castellanos',
  'Dunmore',
  'Eriksen',
  'Fairley',
  'Galloway',
  'Hartwell',
  'Ishikawa',
  'Jovanovic',
  'Kowalczyk',
  'Lindqvist',
  'Moreau',
  'Nakamura',
  'Okonkwo',
  'Pereira',
  'Quintero',
  'Ramaswamy',
  'Sorensen',
  'Thackeray',
  'Underhill',
  'Valdez',
  'Whitlock',
  'Yilmaz',
  'Zielinski',
];

const LOCATIONS = [
  'Austin',
  'Berlin',
  'Bogotá',
  'Dublin',
  'Lisbon',
  'Melbourne',
  'Nairobi',
  'Osaka',
  'Seoul',
  'Toronto',
];

// mulberry32: a tiny seeded PRNG, so the "random" data is identical everywhere.
const createRandom = (seed: number) => {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const DAY_MS = 24 * 60 * 60 * 1000;
const EARLIEST_JOIN = Date.UTC(2019, 0, 1);
const LATEST_JOIN = Date.UTC(2026, 5, 30);
const AS_OF = Date.UTC(2026, 9, 20);

const toIsoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);

const generateMembers = (count: number): Member[] => {
  const random = createRandom(20261022);
  const pick = <T,>(items: readonly T[]) => at(items, Math.floor(random() * items.length));

  // Shuffle every first/last pairing once, then take the first `count`, so
  // names never repeat.
  const pairs = FIRST_NAMES.flatMap(first => LAST_NAMES.map(last => [first, last] as const));
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pairs[i], pairs[j]] = [at(pairs, j), at(pairs, i)];
  }

  return pairs.slice(0, count).map(([first, last], i) => {
    const roll = random();
    const status: Status = roll < 0.8 ? 'Active' : roll < 0.92 ? 'Invited' : 'Suspended';
    const roleRoll = random();
    const role: Role =
      i === 0 ? 'Owner' : roleRoll < 0.1 ? 'Admin' : roleRoll < 0.6 ? 'Editor' : 'Viewer';
    const joinedMs =
      EARLIEST_JOIN + Math.floor(random() * ((LATEST_JOIN - EARLIEST_JOIN) / DAY_MS)) * DAY_MS;
    const lastActiveMs = joinedMs + Math.floor(random() * ((AS_OF - joinedMs) / DAY_MS)) * DAY_MS;

    return {
      id: `m-${String(i + 1).padStart(3, '0')}`,
      name: `${first} ${last}`,
      email: `${first}.${last}@example.com`.toLowerCase(),
      team: pick(TEAMS),
      role,
      status,
      location: pick(LOCATIONS),
      joined: toIsoDate(joinedMs),
      lastActive: status === 'Invited' ? null : toIsoDate(lastActiveMs),
      projects: status === 'Invited' ? 0 : Math.floor(random() * 25),
      storageGb: status === 'Invited' ? 0 : Math.round(random() * 480) / 10,
    };
  });
};

export const members: Member[] = generateMembers(120);

export const isSuspended = (member: Member) => member.status === 'Suspended';

const dateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});
export const formatDate = (iso: string | null) =>
  iso ? dateFormat.format(new Date(`${iso}T00:00:00Z`)) : 'Never';

const STATUS_DOT: Record<Status, string> = {
  Active: 'bg-emerald-500',
  Invited: 'bg-amber-500',
  Suspended: 'bg-stone-400',
};

export const StatusBadge = ({ status }: { status: Status }) => (
  <span className="inline-flex items-center gap-1.5">
    <span aria-hidden="true" className={`size-1.5 rounded-full ${STATUS_DOT[status]}`} />
    {status}
  </span>
);

/** Every column the demos draw from, keyed by column id. */
export const memberColumn = {
  name: {
    id: 'name',
    header: 'Name',
    sortKey: 'name',
    cell: ({ row }) => <span className="font-medium whitespace-nowrap">{row.name}</span>,
  },
  email: {
    id: 'email',
    header: 'Email',
    cell: ({ row }) => <span className="text-muted-foreground">{row.email}</span>,
  },
  team: { id: 'team', header: 'Team', sortKey: 'team', cell: ({ row }) => row.team },
  role: { id: 'role', header: 'Role', sortKey: 'role', cell: ({ row }) => row.role },
  status: {
    id: 'status',
    header: 'Status',
    sortKey: 'status',
    cell: ({ row }) => <StatusBadge status={row.status} />,
  },
  location: {
    id: 'location',
    header: 'Location',
    sortKey: 'location',
    cell: ({ row }) => row.location,
  },
  joined: {
    id: 'joined',
    header: 'Joined',
    sortKey: 'joined',
    cell: ({ row }) => <span className="whitespace-nowrap">{formatDate(row.joined)}</span>,
  },
  lastActive: {
    id: 'last-active',
    header: 'Last active',
    sortKey: 'lastActive',
    cell: ({ row }) => <span className="whitespace-nowrap">{formatDate(row.lastActive)}</span>,
  },
  projects: {
    id: 'projects',
    header: 'Projects',
    sortKey: 'projects',
    className: 'text-right',
    rowClassName: 'text-right tabular-nums',
    cell: ({ row }) => row.projects,
  },
  storage: {
    id: 'storage',
    header: 'Storage',
    sortKey: 'storageGb',
    className: 'text-right',
    rowClassName: 'text-right tabular-nums whitespace-nowrap',
    cell: ({ row }) => `${row.storageGb.toFixed(1)} GB`,
  },
} satisfies Record<string, TableColumn<Member>>;

/** The default column set most demos show. */
export const defaultColumns: TableColumn<Member>[] = [
  memberColumn.name,
  memberColumn.email,
  memberColumn.team,
  memberColumn.role,
  memberColumn.status,
  memberColumn.joined,
  memberColumn.projects,
];

/** Sort keys a demo's `useTableSort({ sortableColumns })` should accept. */
export const sortKeysOf = (columns: TableColumn<Member>[]) =>
  columns
    .flatMap(column => (column.subColumns ? column.subColumns : [column]))
    .map(column => column.sortKey)
    .filter((key): key is string => Boolean(key));

/** Client-side stand-in for a server-side ORDER BY. Nulls sort first. */
export const sortMembers = (
  rows: Member[],
  sortKey: string | null,
  direction: SortOrder | 'asc' | 'desc' | null
): Member[] => {
  if (!sortKey || !direction) {
    return rows;
  }
  const dir = direction.toLowerCase() === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = a[sortKey] as string | number | null;
    const bv = b[sortKey] as string | number | null;
    if (av === bv) {
      return 0;
    }
    if (av === null) {
      return -dir;
    }
    if (bv === null) {
      return dir;
    }
    return typeof av === 'number' && typeof bv === 'number'
      ? dir * (av - bv)
      : dir * String(av).localeCompare(String(bv));
  });
};

/** Deterministic cursor-paginated "server": the cursor is a row offset. */
export const fetchMemberPage = (rows: Member[], first: number, after: string | null) => {
  const start = after ? Number(after) : 0;
  const items = rows.slice(start, start + first);
  return {
    items,
    endCursor: String(start + items.length),
    hasNextPage: start + first < rows.length,
    totalCount: rows.length,
  };
};
