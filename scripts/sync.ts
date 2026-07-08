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
    INSERT INTO decisions (id, municipality_code, municipality_name, date_of_filing, date_of_decision, decisive_board, in_favour)
    VALUES (@id, @municipalityCode, @municipalityName, @dateOfFiling, @dateOfDecision, @decisiveBoard, @inFavour)
    ON CONFLICT(id) DO UPDATE SET
      municipality_code = excluded.municipality_code,
      municipality_name = excluded.municipality_name,
      date_of_filing = excluded.date_of_filing,
      date_of_decision = excluded.date_of_decision,
      decisive_board = excluded.decisive_board,
      in_favour = excluded.in_favour
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
