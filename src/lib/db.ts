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
      decisive_board TEXT NOT NULL DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS idx_decisions_municipality ON decisions (municipality_code);
    CREATE INDEX IF NOT EXISTS idx_decisions_decision_year ON decisions (date_of_decision);

    CREATE TABLE IF NOT EXISTS sync_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Migration for DBs created before decisive_board existed.
  const columns = db.prepare("PRAGMA table_info(decisions)").all() as { name: string }[];
  if (!columns.some((c) => c.name === "decisive_board")) {
    db.exec("ALTER TABLE decisions ADD COLUMN decisive_board TEXT NOT NULL DEFAULT ''");
  }

  return db;
}

export type Filters = {
  year?: string;
  municipalityCode?: string;
  decisiveBoard?: string;
};

// A handful of decisions carry a dateOfFiling that postdates dateOfDecision —
// e.g. a batch of Skive Kommune's backlog was imported with the import date
// stamped as dateOfFiling instead of the real historical date. A case can't be
// decided before it's filed, so these are excluded from averages rather than
// silently skewing them (see getExcludedCount for a visible tally).
const VALID_DURATION = "julianday(date_of_decision) >= julianday(date_of_filing)";

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

export function getSyncMeta(key: string): string | null {
  const row = getDb()
    .prepare("SELECT value FROM sync_meta WHERE key = ?")
    .get(key) as { value: string } | undefined;
  return row?.value ?? null;
}
