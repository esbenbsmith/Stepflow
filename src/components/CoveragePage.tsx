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
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-muted)]">
                  <th className="px-3 py-2 font-medium">{t.coverageYearColumn}</th>
                  <th className="px-3 py-2 font-medium text-right">{t.coverageMissingCountColumn}</th>
                  <th className="px-3 py-2 font-medium">{t.coverageMissingMunicipalitiesColumn}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.year} className="border-b border-[var(--border)] last:border-0 align-top">
                    <td className="px-3 py-1.5 whitespace-nowrap text-[var(--text-primary)]">
                      {row.year}
                      {row.year === currentYear && (
                        <span className="ml-1 text-[var(--text-muted)]">*</span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-[var(--text-primary)]">
                      {row.missing.length}
                    </td>
                    <td className="px-3 py-1.5 text-[var(--text-secondary)]">
                      {row.missing.length === 0
                        ? t.coverageNoneMissing
                        : row.missing.map((m) => m.name).join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
