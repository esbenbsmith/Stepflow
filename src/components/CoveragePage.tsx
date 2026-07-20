import Link from "next/link";
import { getMunicipalityYearCoverage, getSyncMeta } from "@/lib/db";
import { getDictionary, type Locale } from "@/lib/i18n";

function formatSyncedAt(iso: string | null, t: ReturnType<typeof getDictionary>): string {
  if (!iso) return t.never;
  return new Date(iso).toLocaleString(t.locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export async function CoveragePage({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const otherLocale: Locale = locale === "en" ? "da" : "en";
  const otherHref = otherLocale === "en" ? "/coverage" : "/coverage/da";
  const dashboardHref = locale === "en" ? "/" : "/da";

  const coverage = getMunicipalityYearCoverage();
  const syncedAt = getSyncMeta("last_synced_at");

  const UtilityBar = (
    <div className="border-b border-[var(--border)] bg-[var(--surface-1)]">
      <div className="mx-auto w-full max-w-4xl px-6 py-2 text-xs text-[var(--text-muted)]">
        {t.attribution}
      </div>
    </div>
  );

  const years = Array.from(
    new Set(coverage.flatMap((m) => Object.keys(m.countsByYear)))
  ).sort();
  const currentYear = String(new Date().getUTCFullYear());

  const rows = years.map((year) => {
    const missing = coverage.filter((m) => !(m.countsByYear[year] > 0));
    return { year, missing };
  });

  return (
    <>
      {UtilityBar}
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
        <header className="mb-8 border-b border-[var(--border)] pb-6">
          <div className="flex items-start justify-between">
            <div>
              <Link
                href={dashboardHref}
                className="text-sm text-[var(--link)] underline hover:text-[var(--text-primary)]"
              >
                {t.backToDashboard}
              </Link>
              <h1 className="mt-2 text-3xl font-bold text-[var(--text-primary)]">
                {t.coveragePageTitle}
              </h1>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{t.coveragePageSubtitle}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {t.coverageMunicipalityCountNote.replace("{count}", String(coverage.length))}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href={locale === "en" ? "/statutes" : "/statutes/da"}
                className="text-sm text-[var(--link)] underline hover:text-[var(--text-primary)]"
              >
                {t.statutesNavLink}
              </Link>
              <Link
                href={otherHref}
                className="text-sm text-[var(--link)] underline hover:text-[var(--text-primary)]"
              >
                {t.otherLanguageLabel}
              </Link>
            </div>
          </div>
        </header>

        {rows.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">{t.noMatch}</p>
        ) : (
          <div className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)] bg-[var(--surface-1)]">
            {rows.map((row) => (
              <details key={row.year} className="group px-4 py-3">
                <summary className="flex list-none cursor-pointer items-center justify-between text-sm text-[var(--text-primary)] [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-2">
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-3 w-3 shrink-0 text-[var(--text-muted)] transition-transform group-open:rotate-90"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {row.year}
                    {row.year === currentYear && (
                      <span className="text-[var(--text-muted)]">*</span>
                    )}
                  </span>
                  <span className="text-xs tabular-nums text-[var(--text-muted)]">
                    {row.missing.length} {t.coverageMissingLabel}
                  </span>
                </summary>
                {row.missing.length === 0 ? (
                  <p className="mt-2 text-xs text-[var(--text-secondary)]">{t.coverageNoneMissing}</p>
                ) : (
                  <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-[var(--text-secondary)]">
                    {row.missing.map((m) => (
                      <li key={m.code}>{m.name}</li>
                    ))}
                  </ul>
                )}
              </details>
            ))}
          </div>
        )}

        <p className="mt-3 text-xs text-[var(--text-muted)]">* {t.coverageCurrentYearNote}</p>

        <p className="mt-4 text-xs text-[var(--text-muted)]">
          {t.lastSynced}: {formatSyncedAt(syncedAt, t)}. {t.source}:{" "}
          <a
            href="https://gql.huslejenaevn.dk"
            className="text-[var(--link)] underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            gql.huslejenaevn.dk
          </a>
        </p>
      </main>
    </>
  );
}
