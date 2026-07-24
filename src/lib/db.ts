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
      in_favour TEXT NOT NULL DEFAULT '',
      reason_for_closing TEXT NOT NULL DEFAULT ''
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

  // Migration for DBs created before decisive_board/in_favour/reason_for_closing existed.
  const columns = db.prepare("PRAGMA table_info(decisions)").all() as { name: string }[];
  if (!columns.some((c) => c.name === "decisive_board")) {
    db.exec("ALTER TABLE decisions ADD COLUMN decisive_board TEXT NOT NULL DEFAULT ''");
  }
  if (!columns.some((c) => c.name === "in_favour")) {
    db.exec("ALTER TABLE decisions ADD COLUMN in_favour TEXT NOT NULL DEFAULT ''");
  }
  if (!columns.some((c) => c.name === "reason_for_closing")) {
    db.exec("ALTER TABLE decisions ADD COLUMN reason_for_closing TEXT NOT NULL DEFAULT ''");
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

// A handful of decisions carry a dateOfFiling that postdates dateOfDecision.
// There's no single explanation: the affected rows span 10+ municipalities
// (Copenhagen and Aarhus have more of them than Skive Kommune, despite an
// earlier version of this comment blaming a Skive-specific import batch),
// and the gap ranges from under a day to over a decade. About a quarter of
// them do share a real fingerprint — dateOfFiling stamped with the exact
// system-clock time of a recent write (Skive-heavy, but not exclusive to it,
// and evidently still ongoing rather than a one-off historical batch) — while
// dateOfDecision stays a clean date. The rest show no such pattern. The API's
// effectiveDate field can't help disambiguate: it was checked and always
// mirrors dateOfDecision exactly, so it carries no independent signal.
//
// A case can't be decided before it's filed, so rows more than a day off are
// excluded from every statistic rather than silently skewing them (see
// getExclusionBreakdown for a visible, per-reason tally). Rows within a day
// are tolerated as same-day noise and clamped to 0 duration instead —
// plausibly just a timezone/rounding artifact rather than bad data.
const VALID_DURATION = "julianday(date_of_decision) >= julianday(date_of_filing) - 1";

// Filed or decided before 2012 — that period has very sparse volume (a
// handful of cases a year, versus thousands per year from 2012 on) and is
// treated as outside the statistically meaningful range.
const NOT_BEFORE_2012 = "strftime('%Y', date_of_filing) >= '2012' AND strftime('%Y', date_of_decision) >= '2012'";

const DURATION_EXPR = "MAX(0, julianday(date_of_decision) - julianday(date_of_filing))";

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
    sql: `WHERE ${[VALID_DURATION, NOT_BEFORE_2012, ...conditions].join(" AND ")}`,
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
        AVG(${DURATION_EXPR}) AS avgDays,
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
        AVG(${DURATION_EXPR}) AS avgDays,
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
        AVG(${DURATION_EXPR}) AS avgDays,
        COUNT(*) AS caseCount,
        COUNT(DISTINCT municipality_code) AS municipalityCount
      FROM decisions
      ${sql}
      `
    )
    .get(params) as Overall;
  return row;
}

export type DecisionStatusCount = { reasonForClosing: string; count: number };

// Exact status breakdown of the same rows counted in "Decisions counted" —
// uses the same whereClause, so counts always sum to caseCount from
// getOverall() with matching filters.
export function getDecisionStatusBreakdown(filters: Filters = {}): DecisionStatusCount[] {
  const { sql, params } = whereClause(filters);
  const rows = getDb()
    .prepare(
      `
      SELECT
        CASE WHEN reason_for_closing = '' THEN 'NOT_SET' ELSE reason_for_closing END AS reasonForClosing,
        COUNT(*) AS count
      FROM decisions
      ${sql}
      GROUP BY reasonForClosing
      ORDER BY count DESC
      `
    )
    .all(params) as DecisionStatusCount[];
  return rows;
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

// Rows failing VALID_DURATION by more than the 1-day tolerance.
const INVALID_DURATION = "julianday(date_of_decision) < julianday(date_of_filing) - 1";

export type ExclusionBreakdown = {
  invalidDuration: number;
  before2012: number;
  topAffectedMunicipalities: { name: string; count: number }[];
};

// Each excluded row is attributed to exactly one reason — invalid-duration is
// checked first, so a row that's both pre-2012 and date-inverted only counts
// once, under invalidDuration.
export function getExclusionBreakdown(filters: Filters = {}): ExclusionBreakdown {
  const { conditions, params } = userConditions(filters);
  const extra = conditions.length > 0 ? ` AND ${conditions.join(" AND ")}` : "";

  const invalidDurationRow = getDb()
    .prepare(`SELECT COUNT(*) AS n FROM decisions WHERE ${INVALID_DURATION}${extra}`)
    .get(params) as { n: number };

  const before2012Row = getDb()
    .prepare(
      `SELECT COUNT(*) AS n FROM decisions WHERE NOT (${INVALID_DURATION}) AND NOT (${NOT_BEFORE_2012})${extra}`
    )
    .get(params) as { n: number };

  const topAffectedMunicipalities = getDb()
    .prepare(
      `
      SELECT municipality_name AS name, COUNT(*) AS count
      FROM decisions
      WHERE ${INVALID_DURATION}${extra}
      GROUP BY municipality_name
      ORDER BY count DESC
      LIMIT 5
      `
    )
    .all(params) as { name: string; count: number }[];

  return {
    invalidDuration: invalidDurationRow.n,
    before2012: before2012Row.n,
    topAffectedMunicipalities,
  };
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

function parseReasonForClosingByQuarter(value: string | null): ReasonForClosingByQuarter[] {
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

// Bucketed by quarter of filing (keys stored as "2023-Q1" etc.) — set by
// scripts/sync.ts.
export function getReasonForClosingByQuarter(): ReasonForClosingByQuarter[] {
  return parseReasonForClosingByQuarter(getSyncMeta("reason_for_closing_by_quarter"));
}

// Same shape as getReasonForClosingByQuarter, but bucketed by quarter of
// dateOfDecision instead — set by scripts/sync.ts. Dismissed and not-set
// cases almost never have a dateOfDecision (that's exactly why the
// filing-date version exists), so those two columns read close to zero in
// every quarter here.
export function getReasonForClosingByQuarterDecision(): ReasonForClosingByQuarter[] {
  return parseReasonForClosingByQuarter(getSyncMeta("reason_for_closing_by_quarter_decision"));
}

export type MunicipalityYearCoverage = {
  code: string;
  name: string;
  countsByYear: Record<string, number>;
};

// From the API's canonical municipality list (not the local decisions
// table), so a municipality with zero cases ever still shows up as missing
// every year rather than being silently absent — set by scripts/sync.ts.
export function getMunicipalityYearCoverage(): MunicipalityYearCoverage[] {
  const value = getSyncMeta("municipality_year_counts");
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as Record<string, { name: string; counts: Record<string, number> }>;
    return Object.entries(parsed)
      .map(([code, { name, counts }]) => ({ code, name, countsByYear: counts }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}
