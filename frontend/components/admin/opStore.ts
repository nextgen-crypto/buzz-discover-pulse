import { useCallback, useEffect, useState } from "react";

export interface Report {
  id: string;
  kind: "video" | "post" | "user" | "comment";
  refId: string;
  title: string;
  reason: string;
  count: number;
  status: "pending" | "review" | "resolved";
  resolution?: string;
  createdAt: string;
}

export interface Txn {
  id: string;
  user: string;
  provider: "M-Pesa" | "Airtel Money" | "Mixx";
  type: "deposit" | "withdrawal";
  amount: number;
  fee: number;
  status: "completed" | "pending" | "failed" | "refunded";
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  audience: string;
  schedule: string;
  status: "draft" | "scheduled" | "published";
  createdAt: string;
}

export interface AppConfig {
  registration: boolean;
  phoneVerification: boolean;
  emailVerification: boolean;
  comments: boolean;
  liveStreaming: boolean;
  videoUploads: boolean;
  monetization: boolean;
  newRegistrations: boolean;
  maintenance: boolean;
}

export interface RoleAssign {
  email: string;
  role: "super" | "content" | "finance" | "support";
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  target: string;
}

export interface UserFlag {
  suspended?: boolean | undefined;
  restricted?: boolean | undefined;
  warned?: boolean | undefined;
}

export interface HiddenContent {
  kind: string;
  refId: string;
  reason: string;
}

export interface OpStore {
  reports: Report[];
  txns: Txn[];
  announcements: Announcement[];
  config: AppConfig;
  roles: RoleAssign[];
  audit: AuditEntry[];
  flags: Record<string, UserFlag>;
  hidden: HiddenContent[];
  payouts: Record<string, "unpaid" | "pending" | "paid">;
}

const KEY = "wizz:admin-ops-v1";

const SEED_REPORTS: Report[] = [
  {
    id: "r-1",
    kind: "video",
    refId: "v-2",
    title: "Iceland ring road in 8 minutes",
    reason: "Spam",
    count: 9,
    status: "pending",
    createdAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
  },
  {
    id: "r-2",
    kind: "post",
    refId: "seed-p3",
    title: "Untitled post",
    reason: "Harassment",
    count: 17,
    status: "pending",
    createdAt: new Date(Date.now() - 5 * 3600_000).toISOString(),
  },
  {
    id: "r-3",
    kind: "user",
    refId: "u-sam",
    title: "@sam_films",
    reason: "Impersonation",
    count: 6,
    status: "review",
    createdAt: new Date(Date.now() - 9 * 3600_000).toISOString(),
  },
  {
    id: "r-4",
    kind: "comment",
    refId: "seed-c9",
    title: "Comment on Neon Rain",
    reason: "Hate speech",
    count: 12,
    status: "pending",
    createdAt: new Date(Date.now() - 12 * 3600_000).toISOString(),
  },
  {
    id: "r-5",
    kind: "video",
    refId: "v-4",
    title: "Design system tour",
    reason: "Copyright",
    count: 4,
    status: "resolved",
    resolution: "Approved — original work",
    createdAt: new Date(Date.now() - 26 * 3600_000).toISOString(),
  },
];

const SEED_TXNS: Txn[] = [
  {
    id: "w-92821",
    user: "maya.k",
    provider: "M-Pesa",
    type: "withdrawal",
    amount: 184000,
    fee: 9200,
    status: "pending",
    createdAt: new Date(Date.now() - 1 * 3600_000).toISOString(),
  },
  {
    id: "d-10241",
    user: "leo.wilder",
    provider: "Airtel Money",
    type: "deposit",
    amount: 50000,
    fee: 0,
    status: "completed",
    createdAt: new Date(Date.now() - 3 * 3600_000).toISOString(),
  },
  {
    id: "d-10240",
    user: "nina.co",
    provider: "M-Pesa",
    type: "deposit",
    amount: 120000,
    fee: 0,
    status: "completed",
    createdAt: new Date(Date.now() - 7 * 3600_000).toISOString(),
  },
  {
    id: "w-92820",
    user: "riko",
    provider: "Mixx",
    type: "withdrawal",
    amount: 64000,
    fee: 3200,
    status: "completed",
    createdAt: new Date(Date.now() - 11 * 3600_000).toISOString(),
  },
  {
    id: "d-10239",
    user: "sam_films",
    provider: "M-Pesa",
    type: "deposit",
    amount: 25000,
    fee: 0,
    status: "failed",
    createdAt: new Date(Date.now() - 15 * 3600_000).toISOString(),
  },
  {
    id: "w-92819",
    user: "june",
    provider: "Airtel Money",
    type: "withdrawal",
    amount: 41000,
    fee: 2050,
    status: "refunded",
    createdAt: new Date(Date.now() - 22 * 3600_000).toISOString(),
  },
  {
    id: "d-10238",
    user: "maya.k",
    provider: "Mixx",
    type: "deposit",
    amount: 90000,
    fee: 0,
    status: "completed",
    createdAt: new Date(Date.now() - 30 * 3600_000).toISOString(),
  },
  {
    id: "w-92818",
    user: "leo.wilder",
    provider: "M-Pesa",
    type: "withdrawal",
    amount: 150000,
    fee: 7500,
    status: "completed",
    createdAt: new Date(Date.now() - 49 * 3600_000).toISOString(),
  },
];

const DEFAULT_CONFIG: AppConfig = {
  registration: true,
  phoneVerification: true,
  emailVerification: false,
  comments: true,
  liveStreaming: true,
  videoUploads: true,
  monetization: true,
  newRegistrations: true,
  maintenance: false,
};

function seed(): OpStore {
  return {
    reports: SEED_REPORTS,
    txns: SEED_TXNS,
    announcements: [],
    config: DEFAULT_CONFIG,
    roles: [],
    audit: [],
    flags: {},
    hidden: [],
    payouts: {},
  };
}

function load(): OpStore {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...seed(), ...(JSON.parse(raw) as Partial<OpStore>) };
  } catch {
    // ignore
  }
  return seed();
}

let seq = 0;
export type ActFn = (action: string, target: string, fn: (s: OpStore) => OpStore) => void;

export function newId(prefix: string): string {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}${seq}`;
}

export function exportCsv(filename: string, rows: (string | number)[][], headers: string[]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Operational admin data. Persists per-browser until dedicated Supabase
 * tables (reports, txns, announcements, audit) land — every mutation below
 * maps 1:1 to a future table row, and every action is audit-logged.
 */
export function useOpStore(actor: string) {
  const [store, setStore] = useState<OpStore>(load);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setStore(load());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const commit = useCallback((next: OpStore) => {
    setStore(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent("admin-ops"));
  }, []);

  /** Apply a mutation AND append the audit entry atomically. */
  const act = useCallback(
    (action: string, target: string, fn: (s: OpStore) => OpStore) => {
      setStore((prev) => {
        const next = fn(prev);
        const entry: AuditEntry = {
          id: newId("a"),
          at: new Date().toISOString(),
          actor,
          action,
          target,
        };
        const withAudit: OpStore = { ...next, audit: [entry, ...next.audit].slice(0, 200) };
        try {
          localStorage.setItem(KEY, JSON.stringify(withAudit));
        } catch {
          // ignore
        }
        return withAudit;
      });
    },
    [actor],
  );

  return { store, commit, act };
}
