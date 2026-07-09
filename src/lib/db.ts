import Database from "better-sqlite3";
import path from "node:path";

const DB_PATH = path.join(process.cwd(), "data", "stepflow.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS decisions (
      id TEXT PRIMARY KEY,
      municipality_code TEXT NOT NULL,
      municipality_name TEXT NOT NULL,
      date_of_filing TEXT NOT NULL,
      date_of_decision TEXT NOT NULL,
      decisive_board TEXT NOT NULL DEFAULT '',
      in_favour TEXT NOT NULL DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS idx_decisions_municipality ON decisions (municipality_code);
    CREATE INDEX IF NOT EXISTS idx_decisions_decision_year ON decisions (date_of_decision);

    CREATE TABLE IF NOT EXISTS sync_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- A decision can cite multiple statutes, so this is a child table rather
    -- than a flat column on decisions. Rebuilt from scratch on every sync
    -- (see scripts/sync.ts), so it always mirrors the API's current state.
    CREATE TABLE IF NOT EXISTS decision_statutories (
      decision_id TEXT NOT NULL,
      law_id TEXT NOT NULL,
      law_text TEXT NOT NULL,
      chapter_id TEXT NOT NULL DEFAULT '',
      chapter_text TEXT NOT NULL DEFAULT '',
      section_id TEXT NOT NULL DEFAULT '',
      section_text TEXT NOT NULL DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS idx_decision_statutories_decision ON decision_statutories (decision_id);
    CREATE INDEX IF NOT EXISTS idx_decision_statutories_section ON decision_statutories (section_id);
  `);

  // Migration for DBs created before decisive_board/in_favour existed.
  const columns = db.prepare("PRAGMA table_info(decisions)").all() as { name: string }[];
  if (!columns.some((c) => c.name === "decisive_board")) {
    db.exec("ALTER TABLE decisions ADD COLUMN decisive_board TEXT NOT NULL DEFAULT ''");
  }
  if (!columns.some((c) => c.name === "in_favour")) {
    db.exec("ALTER TABLE decisions ADD COLUMN in_favour TEXT NOT NULL DEFAULT ''");
  }

  return db;
}

export type Filters = {
  year?: string;
  municipalityCode?: string;
  decisiveBoard?: string;
  includeSectionIds?: string[];
  excludeSectionIds?: string[];
};

// A handful of decisions carry a dateOfFiling that postdates dateOfDecision —
// e.g. a batch of Skive Kommune's backlog was imported with the import date
// stamped as dateOfFiling instead of the real historical date. A case can't be
// decided before it's filed, so these are excluded from averages rather than
// silently skewing them (see getExcludedCount for a visible tally).
const VALID_DURATION = "julianday(date_of_decision) >= julianday(date_of_filing)";

function sectionIdPlaceholders(prefix: string, ids: string[], params: Record<string, string>): string {
  return ids
    .map((id, i) => {
      const key = `${prefix}${i}`;
      params[key] = id;
      return `@${key}`;
    })
    .join(", ");
}

function userConditions(filters: Filters): { conditions: string[]; params: Record<string, string> } {
  const conditions: string[] = [];
  const params: Record<string, string> = {};

  if (filters.year) {
    conditions.push("strftime('%Y', date_of_decision) = @year");
    params.year = filters.year;
  }
  if (filters.municipalityCode) {
    conditions.push("municipality_code = @municipalityCode");
    params.municipalityCode = filters.municipalityCode;
  }
  if (filters.decisiveBoard) {
    conditions.push("decisive_board = @decisiveBoard");
    params.decisiveBoard = filters.decisiveBoard;
  }
  if (filters.includeSectionIds && filters.includeSectionIds.length > 0) {
    const placeholders = sectionIdPlaceholders("include", filters.includeSectionIds, params);
    conditions.push(
      `id IN (SELECT decision_id FROM decision_statutories WHERE section_id IN (${placeholders}))`
    );
  }
  if (filters.excludeSectionIds && filters.excludeSectionIds.length > 0) {
    const placeholders = sectionIdPlaceholders("exclude", filters.excludeSectionIds, params);
    conditions.push(
      `id NOT IN (SELECT decision_id FROM decision_statutories WHERE section_id IN (${placeholders}))`
    );
  }

  return { conditions, params };
}

function whereClause(filters: Filters): { sql: string; params: Record<string, string> } {
  const { conditions, params } = userConditions(filters);
  return {
    sql: `WHERE ${[VALID_DURATION, ...conditions].join(" AND ")}`,
    params,
  };
}

export type MunicipalityAverage = {
  municipalityCode: string;
  municipalityName: string;
  avgDays: number;
  caseCount: number;
};

export function getMunicipalityAverages(filters: Filters = {}): MunicipalityAverage[] {
  const { sql, params } = whereClause(filters);
  const rows = getDb()
    .prepare(
      `
      SELECT
        municipality_code AS municipalityCode,
        municipality_name AS municipalityName,
        AVG(julianday(date_of_decision) - julianday(date_of_filing)) AS avgDays,
        COUNT(*) AS caseCount
      FROM decisions
      ${sql}
      GROUP BY municipality_code
      ORDER BY avgDays DESC
      `
    )
    .all(params) as MunicipalityAverage[];
  return rows;
}

export type YearlyAverage = {
  year: string;
  avgDays: number;
  caseCount: number;
};

export function getYearlyAverages(filters: Omit<Filters, "year"> = {}): YearlyAverage[] {
  const { sql, params } = whereClause(filters);
  const rows = getDb()
    .prepare(
      `
      SELECT
        strftime('%Y', date_of_decision) AS year,
        AVG(julianday(date_of_decision) - julianday(date_of_filing)) AS avgDays,
        COUNT(*) AS caseCount
      FROM decisions
      ${sql}
      GROUP BY year
      ORDER BY year ASC
      `
    )
    .all(params) as YearlyAverage[];
  return rows;
}

export type InFavourCounts = {
  tenant: number;
  landlord: number;
  shared: number;
  notSet: number;
  total: number;
};

const IN_FAVOUR_COUNTS_SELECT = `
  SUM(CASE WHEN in_favour = 'TENANT' THEN 1 ELSE 0 END) AS tenant,
  SUM(CASE WHEN in_favour = 'LANDLORD' THEN 1 ELSE 0 END) AS landlord,
  SUM(CASE WHEN in_favour = 'SHARED' THEN 1 ELSE 0 END) AS shared,
  SUM(CASE WHEN in_favour NOT IN ('TENANT', 'LANDLORD', 'SHARED') THEN 1 ELSE 0 END) AS notSet,
  COUNT(*) AS total
`;

export type InFavourByMunicipality = InFavourCounts & {
  municipalityCode: string;
  municipalityName: string;
};

export function getInFavourByMunicipality(filters: Filters = {}): InFavourByMunicipality[] {
  const { sql, params } = whereClause(filters);
  const rows = getDb()
    .prepare(
      `
      SELECT
        municipality_code AS municipalityCode,
        municipality_name AS municipalityName,
        ${IN_FAVOUR_COUNTS_SELECT}
      FROM decisions
      ${sql}
      GROUP BY municipality_code
      ORDER BY total DESC
      `
    )
    .all(params) as InFavourByMunicipality[];
  return rows;
}

export type InFavourByYear = InFavourCounts & { year: string };

export function getInFavourByYear(filters: Omit<Filters, "year"> = {}): InFavourByYear[] {
  const { sql, params } = whereClause(filters);
  const rows = getDb()
    .prepare(
      `
      SELECT
        strftime('%Y', date_of_decision) AS year,
        ${IN_FAVOUR_COUNTS_SELECT}
      FROM decisions
      ${sql}
      GROUP BY year
      ORDER BY year ASC
      `
    )
    .all(params) as InFavourByYear[];
  return rows;
}

export type Overall = {
  avgDays: number | null;
  caseCount: number;
  municipalityCount: number;
};

export function getOverall(filters: Filters = {}): Overall {
  const { sql, params } = whereClause(filters);
  const row = getDb()
    .prepare(
      `
      SELECT
        AVG(julianday(date_of_decision) - julianday(date_of_filing)) AS avgDays,
        COUNT(*) AS caseCount,
        COUNT(DISTINCT municipality_code) AS municipalityCount
      FROM decisions
      ${sql}
      `
    )
    .get(params) as Overall;
  return row;
}

export type MunicipalityOption = {
  municipalityCode: string;
  municipalityName: string;
};

export function getMunicipalityOptions(): MunicipalityOption[] {
  return getDb()
    .prepare(
      `
      SELECT DISTINCT municipality_code AS municipalityCode, municipality_name AS municipalityName
      FROM decisions
      ORDER BY municipality_name ASC
      `
    )
    .all() as MunicipalityOption[];
}

export function getYearOptions(): string[] {
  const rows = getDb()
    .prepare(
      `
      SELECT DISTINCT strftime('%Y', date_of_decision) AS year
      FROM decisions
      WHERE date_of_decision IS NOT NULL
      ORDER BY year DESC
      `
    )
    .all() as { year: string }[];
  return rows.map((r) => r.year);
}

export function getDecisiveBoardOptions(): string[] {
  const rows = getDb()
    .prepare(
      `
      SELECT DISTINCT decisive_board AS board
      FROM decisions
      WHERE decisive_board != ''
      ORDER BY board ASC
      `
    )
    .all() as { board: string }[];
  return rows.map((r) => r.board);
}

export function getExcludedCount(filters: Filters = {}): number {
  const { conditions, params } = userConditions(filters);
  const sql = `WHERE NOT (${VALID_DURATION})${conditions.length > 0 ? ` AND ${conditions.join(" AND ")}` : ""}`;
  const row = getDb()
    .prepare(`SELECT COUNT(*) AS n FROM decisions ${sql}`)
    .get(params) as { n: number };
  return row.n;
}

export type StatutoryOption = {
  sectionId: string;
  lawText: string;
  chapterText: string;
  sectionText: string;
  caseCount: number;
};

// Only statutes actually cited by at least one synced decision show up here —
// there's no point offering a filter option with zero matching cases.
export function getStatutoryOptions(): StatutoryOption[] {
  return getDb()
    .prepare(
      `
      SELECT
        section_id AS sectionId,
        law_text AS lawText,
        chapter_text AS chapterText,
        section_text AS sectionText,
        COUNT(DISTINCT decision_id) AS caseCount
      FROM decision_statutories
      WHERE section_id != ''
      GROUP BY section_id
      ORDER BY law_text ASC, chapter_text ASC, section_text ASC
      `
    )
    .all() as StatutoryOption[];
}

export function getSyncMeta(key: string): string | null {
  const row = getDb()
    .prepare("SELECT value FROM sync_meta WHERE key = ?")
    .get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

// All cases regardless of status (in progress, dismissed, decided, ...) —
// set by scripts/sync.ts, since the decisions table only holds cases with
// both dateOfFiling and dateOfDecision set.
export function getTotalCaseCount(): number {
  const value = getSyncMeta("total_case_count");
  return value ? Number(value) : 0;
}

export type ReasonForClosingCounts = {
  NOT_SET: number;
  DISMISSED: number;
  IN_FAVOUR: number;
  REJECTED: number;
  SETTLEMENT: number;
  IN_PARTIAL_FAVOUR: number;
};

const EMPTY_REASON_FOR_CLOSING_COUNTS: ReasonForClosingCounts = {
  NOT_SET: 0,
  DISMISSED: 0,
  IN_FAVOUR: 0,
  REJECTED: 0,
  SETTLEMENT: 0,
  IN_PARTIAL_FAVOUR: 0,
};

// Every case has exactly one reasonForClosing value, so these counts sum to
// getTotalCaseCount() — set by scripts/sync.ts.
export function getReasonForClosingCounts(): ReasonForClosingCounts {
  const value = getSyncMeta("reason_for_closing_counts");
  if (!value) return EMPTY_REASON_FOR_CLOSING_COUNTS;
  try {
    return { ...EMPTY_REASON_FOR_CLOSING_COUNTS, ...JSON.parse(value) };
  } catch {
    return EMPTY_REASON_FOR_CLOSING_COUNTS;
  }
}

export type ReasonForClosingByYear = { year: string } & ReasonForClosingCounts;

// Bucketed by year of filing (not year of decision) — set by scripts/sync.ts.
// Dismissed/not-set cases have no dateOfDecision, but every case has a
// dateOfFiling, so filing year is the only year dimension that covers them.
export function getReasonForClosingByYear(): ReasonForClosingByYear[] {
  const value = getSyncMeta("reason_for_closing_by_year");
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as Record<string, Partial<ReasonForClosingCounts>>;
    return Object.entries(parsed)
      .map(([year, counts]) => ({ year, ...EMPTY_REASON_FOR_CLOSING_COUNTS, ...counts }))
      .sort((a, b) => a.year.localeCompare(b.year));
  } catch {
    return [];
  }
}

export type ReasonForClosingByQuarter = { year: string; quarter: number; period: string } & ReasonForClosingCounts;

// Same as getReasonForClosingByYear, bucketed by quarter of filing instead
// (keys stored as "2023-Q1" etc.) — set by scripts/sync.ts.
export function getReasonForClosingByQuarter(): ReasonForClosingByQuarter[] {
  const value = getSyncMeta("reason_for_closing_by_quarter");
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as Record<string, Partial<ReasonForClosingCounts>>;
    return Object.entries(parsed)
      .map(([key, counts]) => {
        const [year, quarterPart] = key.split("-Q");
        return {
          year,
          quarter: Number(quarterPart),
          period: `${year} Q${quarterPart}`,
          ...EMPTY_REASON_FOR_CLOSING_COUNTS,
          ...counts,
        };
      })
      .sort((a, b) => a.year.localeCompare(b.year) || a.quarter - b.quarter);
  } catch {
    return [];
  }
}
