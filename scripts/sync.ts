// Pulls all decisions with both dateOfFiling and dateOfDecision set from the
// huslejenaevn.dk GraphQL API and upserts them into the local SQLite database.
// The API caps pages at 50 items, so a full sync takes ~1,900 requests.
//
// Usage: npm run sync
import { config } from "dotenv";
import path from "node:path";
import { getDb } from "../src/lib/db";

config({ path: path.join(process.cwd(), ".env.local") });

const API_URL = process.env.HUSLEJENAEVN_API_URL ?? "https://gql.huslejenaevn.dk";
const API_KEY = process.env.HUSLEJENAEVN_API_KEY;
const PAGE_SIZE = 50;
const DELAY_MS = 150;

if (!API_KEY) {
  throw new Error("HUSLEJENAEVN_API_KEY is not set (check .env.local)");
}

type Statutory = {
  lawId: string;
  lawText: string;
  chapterId: string | null;
  chapterText: string | null;
  sectionId: string | null;
  sectionText: string | null;
};

type DecisionRow = {
  id: string;
  municipalityCode: string;
  municipalityName: string;
  dateOfFiling: string;
  dateOfDecision: string;
  decisiveBoard: string;
  inFavour: string;
  reasonForClosing: string;
  statutories: Statutory[];
};

const QUERY = `
  query Sync($skip: Int!, $take: Int!) {
    pagedDecisions(
      skip: $skip
      take: $take
      order: { id: ASC }
      where: { dateOfFiling: { neq: null }, dateOfDecision: { neq: null } }
    ) {
      totalCount
      items {
        id
        municipalityCode
        municipalityName
        dateOfFiling
        dateOfDecision
        decisiveBoard
        inFavour
        reasonForClosing
        statutories {
          lawId
          lawText
          chapterId
          chapterText
          sectionId
          sectionText
        }
      }
    }
  }
`;

// A separate, filter-free count of every case regardless of status (in
// progress, dismissed, decided, ...) — the main sync only pulls cases with
// both dateOfFiling and dateOfDecision set, so this can't be derived from
// the local decisions table.
const TOTAL_CASE_COUNT_QUERY = `
  query TotalCaseCount {
    pagedDecisions(skip: 0, take: 1) {
      totalCount
    }
  }
`;

async function fetchTotalCaseCount(): Promise<number> {
  const res = await fetch(`${API_URL}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": API_KEY!,
    },
    body: JSON.stringify({ query: TOTAL_CASE_COUNT_QUERY }),
  });

  if (!res.ok) {
    throw new Error(`Request failed fetching total case count: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  if (json.errors) {
    throw new Error(`GraphQL error fetching total case count: ${JSON.stringify(json.errors)}`);
  }
  return json.data.pagedDecisions.totalCount;
}

// Breaks case counts down by why the case was closed (or that it hasn't been
// assigned one yet) — this is how "dismissed", "settled", etc. are surfaced,
// since the main sync's decisions table only holds cases that reached an
// actual decision. Bucketed by year of filing rather than year of decision:
// dismissed/not-set cases have no dateOfDecision, but every case has a
// dateOfFiling.
const REASON_FOR_CLOSING_VALUES = [
  "NOT_SET",
  "DISMISSED",
  "IN_FAVOUR",
  "REJECTED",
  "SETTLEMENT",
  "IN_PARTIAL_FAVOUR",
] as const;

const FILING_YEAR_RANGE_QUERY = `
  query FilingYearRange {
    oldest: pagedDecisions(skip: 0, take: 1, order: { dateOfFiling: ASC }, where: { dateOfFiling: { neq: null } }) {
      items { dateOfFiling }
    }
    newest: pagedDecisions(skip: 0, take: 1, order: { dateOfFiling: DESC }, where: { dateOfFiling: { neq: null } }) {
      items { dateOfFiling }
    }
  }
`;

async function fetchFilingYearRange(): Promise<{ firstYear: number; lastYear: number }> {
  const res = await fetch(`${API_URL}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-KEY": API_KEY! },
    body: JSON.stringify({ query: FILING_YEAR_RANGE_QUERY }),
  });
  if (!res.ok) {
    throw new Error(`Request failed fetching filing year range: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  if (json.errors) {
    throw new Error(`GraphQL error fetching filing year range: ${JSON.stringify(json.errors)}`);
  }
  const firstYear = new Date(json.data.oldest.items[0].dateOfFiling).getUTCFullYear();
  const lastYear = new Date(json.data.newest.items[0].dateOfFiling).getUTCFullYear();
  return { firstYear, lastYear };
}

const DECISION_YEAR_RANGE_QUERY = `
  query DecisionYearRange {
    oldest: pagedDecisions(skip: 0, take: 1, order: { dateOfDecision: ASC }, where: { dateOfDecision: { neq: null } }) {
      items { dateOfDecision }
    }
    newest: pagedDecisions(skip: 0, take: 1, order: { dateOfDecision: DESC }, where: { dateOfDecision: { neq: null } }) {
      items { dateOfDecision }
    }
  }
`;

async function fetchDecisionYearRange(): Promise<{ firstYear: number; lastYear: number }> {
  const res = await fetch(`${API_URL}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-KEY": API_KEY! },
    body: JSON.stringify({ query: DECISION_YEAR_RANGE_QUERY }),
  });
  if (!res.ok) {
    throw new Error(`Request failed fetching decision year range: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  if (json.errors) {
    throw new Error(`GraphQL error fetching decision year range: ${JSON.stringify(json.errors)}`);
  }
  const firstYear = new Date(json.data.oldest.items[0].dateOfDecision).getUTCFullYear();
  const lastYear = new Date(json.data.newest.items[0].dateOfDecision).getUTCFullYear();
  return { firstYear, lastYear };
}

type DateDimension = "dateOfFiling" | "dateOfDecision";

function reasonForClosingRangeQuery(dateField: DateDimension, gte: string, lt: string): string {
  const fields = REASON_FOR_CLOSING_VALUES.map(
    (v) =>
      `${v}: pagedDecisions(skip: 0, take: 1, where: { ${dateField}: { gte: "${gte}", lt: "${lt}" }, reasonForClosing: { eq: ${v} } }) { totalCount }`
  ).join("\n    ");
  return `query ReasonForClosingForRange { ${fields} }`;
}

async function fetchReasonForClosingForRange(
  dateField: DateDimension,
  gte: string,
  lt: string,
  label: string,
  attempt = 1
): Promise<Record<string, number>> {
  const res = await fetch(`${API_URL}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-KEY": API_KEY! },
    body: JSON.stringify({ query: reasonForClosingRangeQuery(dateField, gte, lt) }),
  });

  if (!res.ok) {
    if (attempt < 3) {
      await sleep(1000 * attempt);
      return fetchReasonForClosingForRange(dateField, gte, lt, label, attempt + 1);
    }
    throw new Error(`Request failed fetching reason-for-closing counts for ${label}: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  if (json.errors) {
    if (attempt < 3) {
      await sleep(1000 * attempt);
      return fetchReasonForClosingForRange(dateField, gte, lt, label, attempt + 1);
    }
    throw new Error(`GraphQL error fetching reason-for-closing counts for ${label}: ${JSON.stringify(json.errors)}`);
  }
  const counts: Record<string, number> = {};
  for (const v of REASON_FOR_CLOSING_VALUES) {
    counts[v] = json.data[v].totalCount;
  }
  return counts;
}

async function fetchReasonForClosingByYear(
  firstYear: number,
  lastYear: number
): Promise<Record<string, Record<string, number>>> {
  const byYear: Record<string, Record<string, number>> = {};
  for (let year = firstYear; year <= lastYear; year++) {
    byYear[year] = await fetchReasonForClosingForRange(
      "dateOfFiling",
      `${year}-01-01T00:00:00Z`,
      `${year + 1}-01-01T00:00:00Z`,
      String(year)
    );
    await sleep(DELAY_MS);
  }
  return byYear;
}

async function fetchReasonForClosingByQuarter(
  dateField: DateDimension,
  firstYear: number,
  lastYear: number
): Promise<Record<string, Record<string, number>>> {
  const byQuarter: Record<string, Record<string, number>> = {};
  for (let year = firstYear; year <= lastYear; year++) {
    for (let quarter = 1; quarter <= 4; quarter++) {
      const startMonth = (quarter - 1) * 3 + 1;
      const endMonth = startMonth + 3 > 12 ? 1 : startMonth + 3;
      const endYear = startMonth + 3 > 12 ? year + 1 : year;
      const key = `${year}-Q${quarter}`;
      byQuarter[key] = await fetchReasonForClosingForRange(
        dateField,
        `${year}-${String(startMonth).padStart(2, "0")}-01T00:00:00Z`,
        `${endYear}-${String(endMonth).padStart(2, "0")}-01T00:00:00Z`,
        key
      );
      await sleep(DELAY_MS);
    }
  }
  return byQuarter;
}

// The canonical list of all Danish municipalities the API knows about — not
// derived from the local decisions table, since a municipality with zero
// cases ever would never show up there but should still appear as "missing
// every year" on the coverage page.
const MUNICIPALITIES_QUERY = `
  query Municipalities {
    municipalities {
      municipalityCode
      name
    }
  }
`;

async function fetchAllMunicipalities(): Promise<{ code: string; name: string }[]> {
  const res = await fetch(`${API_URL}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-KEY": API_KEY! },
    body: JSON.stringify({ query: MUNICIPALITIES_QUERY }),
  });
  if (!res.ok) {
    throw new Error(`Request failed fetching municipalities: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  if (json.errors) {
    throw new Error(`GraphQL error fetching municipalities: ${JSON.stringify(json.errors)}`);
  }
  return json.data.municipalities.map((m: { municipalityCode: string; name: string }) => ({
    code: m.municipalityCode,
    name: m.name,
  }));
}

function municipalityYearCountsQuery(code: string, firstYear: number, lastYear: number): string {
  const fields: string[] = [];
  for (let year = firstYear; year <= lastYear; year++) {
    fields.push(
      `y${year}: pagedDecisions(skip: 0, take: 1, where: { municipalityCode: { eq: "${code}" }, dateOfFiling: { gte: "${year}-01-01T00:00:00Z", lt: "${year + 1}-01-01T00:00:00Z" } }) { totalCount }`
    );
  }
  return `query MunicipalityYearCounts { ${fields.join("\n    ")} }`;
}

async function fetchCaseCountsForMunicipality(
  code: string,
  firstYear: number,
  lastYear: number,
  attempt = 1
): Promise<Record<string, number>> {
  const res = await fetch(`${API_URL}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-KEY": API_KEY! },
    body: JSON.stringify({ query: municipalityYearCountsQuery(code, firstYear, lastYear) }),
  });

  if (!res.ok) {
    if (attempt < 3) {
      await sleep(1000 * attempt);
      return fetchCaseCountsForMunicipality(code, firstYear, lastYear, attempt + 1);
    }
    throw new Error(`Request failed fetching year counts for municipality ${code}: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  if (json.errors) {
    if (attempt < 3) {
      await sleep(1000 * attempt);
      return fetchCaseCountsForMunicipality(code, firstYear, lastYear, attempt + 1);
    }
    throw new Error(`GraphQL error fetching year counts for municipality ${code}: ${JSON.stringify(json.errors)}`);
  }
  const counts: Record<string, number> = {};
  for (let year = firstYear; year <= lastYear; year++) {
    counts[year] = json.data[`y${year}`].totalCount;
  }
  return counts;
}

type MunicipalityYearCoverage = Record<string, { name: string; counts: Record<string, number> }>;

async function fetchMunicipalityYearCounts(
  firstYear: number,
  lastYear: number
): Promise<MunicipalityYearCoverage> {
  const municipalities = await fetchAllMunicipalities();
  const coverage: MunicipalityYearCoverage = {};
  for (const m of municipalities) {
    coverage[m.code] = {
      name: m.name,
      counts: await fetchCaseCountsForMunicipality(m.code, firstYear, lastYear),
    };
    await sleep(DELAY_MS);
  }
  return coverage;
}

async function fetchPage(skip: number, attempt = 1): Promise<{ totalCount: number; items: DecisionRow[] }> {
  const res = await fetch(`${API_URL}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": API_KEY!,
    },
    body: JSON.stringify({ query: QUERY, variables: { skip, take: PAGE_SIZE } }),
  });

  if (!res.ok) {
    if (attempt < 3) {
      await sleep(1000 * attempt);
      return fetchPage(skip, attempt + 1);
    }
    throw new Error(`Request failed at skip=${skip}: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  if (json.errors) {
    throw new Error(`GraphQL error at skip=${skip}: ${JSON.stringify(json.errors)}`);
  }
  return json.data.pagedDecisions;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const db = getDb();
  const upsert = db.prepare(`
    INSERT INTO decisions (id, municipality_code, municipality_name, date_of_filing, date_of_decision, decisive_board, in_favour, reason_for_closing)
    VALUES (@id, @municipalityCode, @municipalityName, @dateOfFiling, @dateOfDecision, @decisiveBoard, @inFavour, @reasonForClosing)
    ON CONFLICT(id) DO UPDATE SET
      municipality_code = excluded.municipality_code,
      municipality_name = excluded.municipality_name,
      date_of_filing = excluded.date_of_filing,
      date_of_decision = excluded.date_of_decision,
      decisive_board = excluded.decisive_board,
      in_favour = excluded.in_favour,
      reason_for_closing = excluded.reason_for_closing
  `);
  const deleteStatutories = db.prepare(`DELETE FROM decision_statutories WHERE decision_id = @decisionId`);
  const insertStatutory = db.prepare(`
    INSERT INTO decision_statutories (decision_id, law_id, law_text, chapter_id, chapter_text, section_id, section_text)
    VALUES (@decisionId, @lawId, @lawText, @chapterId, @chapterText, @sectionId, @sectionText)
  `);
  const upsertMany = db.transaction((rows: DecisionRow[]) => {
    for (const row of rows) {
      upsert.run(row);
      deleteStatutories.run({ decisionId: row.id });
      for (const s of row.statutories) {
        insertStatutory.run({
          decisionId: row.id,
          lawId: s.lawId,
          lawText: s.lawText,
          chapterId: s.chapterId ?? "",
          chapterText: s.chapterText ?? "",
          sectionId: s.sectionId ?? "",
          sectionText: s.sectionText ?? "",
        });
      }
    }
  });

  const totalCaseCount = await fetchTotalCaseCount();
  db.prepare(
    `INSERT INTO sync_meta (key, value) VALUES ('total_case_count', @value)
     ON CONFLICT(key) DO UPDATE SET value = @value`
  ).run({ value: String(totalCaseCount) });

  const { firstYear, lastYear } = await fetchFilingYearRange();

  const reasonForClosingByYear = await fetchReasonForClosingByYear(firstYear, lastYear);
  db.prepare(
    `INSERT INTO sync_meta (key, value) VALUES ('reason_for_closing_by_year', @value)
     ON CONFLICT(key) DO UPDATE SET value = @value`
  ).run({ value: JSON.stringify(reasonForClosingByYear) });

  const reasonForClosingByQuarter = await fetchReasonForClosingByQuarter("dateOfFiling", firstYear, lastYear);
  db.prepare(
    `INSERT INTO sync_meta (key, value) VALUES ('reason_for_closing_by_quarter', @value)
     ON CONFLICT(key) DO UPDATE SET value = @value`
  ).run({ value: JSON.stringify(reasonForClosingByQuarter) });

  const decisionYearRange = await fetchDecisionYearRange();
  const reasonForClosingByQuarterDecision = await fetchReasonForClosingByQuarter(
    "dateOfDecision",
    decisionYearRange.firstYear,
    decisionYearRange.lastYear
  );
  db.prepare(
    `INSERT INTO sync_meta (key, value) VALUES ('reason_for_closing_by_quarter_decision', @value)
     ON CONFLICT(key) DO UPDATE SET value = @value`
  ).run({ value: JSON.stringify(reasonForClosingByQuarterDecision) });

  const reasonForClosingCounts: Record<string, number> = {};
  for (const yearCounts of Object.values(reasonForClosingByYear)) {
    for (const [reason, count] of Object.entries(yearCounts)) {
      reasonForClosingCounts[reason] = (reasonForClosingCounts[reason] ?? 0) + count;
    }
  }
  db.prepare(
    `INSERT INTO sync_meta (key, value) VALUES ('reason_for_closing_counts', @value)
     ON CONFLICT(key) DO UPDATE SET value = @value`
  ).run({ value: JSON.stringify(reasonForClosingCounts) });

  const municipalityYearCounts = await fetchMunicipalityYearCounts(Math.max(firstYear, 2012), lastYear);
  db.prepare(
    `INSERT INTO sync_meta (key, value) VALUES ('municipality_year_counts', @value)
     ON CONFLICT(key) DO UPDATE SET value = @value`
  ).run({ value: JSON.stringify(municipalityYearCounts) });

  let skip = 0;
  let totalCount = Infinity;
  const startedAt = Date.now();

  while (skip < totalCount) {
    const page = await fetchPage(skip);
    totalCount = page.totalCount;
    upsertMany(page.items);
    skip += PAGE_SIZE;

    const pct = Math.min(100, (skip / totalCount) * 100);
    process.stdout.write(`\rSynced ${Math.min(skip, totalCount)}/${totalCount} (${pct.toFixed(1)}%)`);

    if (page.items.length < PAGE_SIZE) break; // last page
    await sleep(DELAY_MS);
  }

  db.prepare(
    `INSERT INTO sync_meta (key, value) VALUES ('last_synced_at', @now)
     ON CONFLICT(key) DO UPDATE SET value = @now`
  ).run({ now: new Date().toISOString() });

  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`\nDone in ${seconds}s.`);
}

main().catch((err) => {
  console.error("\nSync failed:", err);
  process.exit(1);
});
