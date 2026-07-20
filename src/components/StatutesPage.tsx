import Link from "next/link";
import {
  getDecisionStatusBreakdown,
  getExclusionBreakdown,
  getInFavourByMunicipality,
  getInFavourByYear,
  getMunicipalityAverages,
  getMunicipalityOptions,
  getOverall,
  getStatutoryOptions,
  getSyncMeta,
  getYearOptions,
} from "@/lib/db";
import { formatExclusionBreakdown, formatInFavourHeading, getDictionary, type Locale } from "@/lib/i18n";
import { DecisionStatusTable } from "@/components/DecisionStatusTable";
import { InFavourChart } from "@/components/InFavourChart";
import { MunicipalityChart } from "@/components/MunicipalityChart";
import { StatTile } from "@/components/StatTile";
import { StatutoryPicker } from "@/components/StatutoryPicker";

function formatSyncedAt(iso: string | null, t: ReturnType<typeof getDictionary>): string {
  if (!iso) return t.never;
  return new Date(iso).toLocaleString(t.locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function parseIds(value: string | undefined): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

export async function StatutesPage({
  locale,
  searchParams,
}: {
  locale: Locale;
  searchParams: Promise<{ include?: string; exclude?: string; year?: string; municipality?: string }>;
}) {
  const t = getDictionary(locale);
  const params = await searchParams;
  const filters = {
    year: params.year,
    municipalityCode: params.municipality,
    includeSectionIds: parseIds(params.include),
    excludeSectionIds: parseIds(params.exclude),
  };
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v) as [string, string][]
  ).toString();
  const otherLocale: Locale = locale === "en" ? "da" : "en";
  const otherHref = `${otherLocale === "en" ? "/statutes" : "/statutes/da"}${qs ? `?${qs}` : ""}`;
  const dashboardHref = locale === "en" ? "/" : "/da";

  const options = getStatutoryOptions();
  const years = getYearOptions();
  const municipalityOptions = getMunicipalityOptions();
  const syncedAt = getSyncMeta("last_synced_at");

  const UtilityBar = (
    <div className="border-b border-[var(--border)] bg-[var(--surface-1)]">
      <div className="mx-auto w-full max-w-4xl px-6 py-2 text-xs text-[var(--text-muted)]">
        {t.attribution}
      </div>
    </div>
  );

  const overall = getOverall(filters);
  const municipalities = getMunicipalityAverages(filters);
  const decisionStatusBreakdown = getDecisionStatusBreakdown(filters);
  const exclusionBreakdown = getExclusionBreakdown(filters);
  const exclusionTotal = exclusionBreakdown.invalidDuration + exclusionBreakdown.before2012;
  const exclusionText = formatExclusionBreakdown(t, exclusionBreakdown);

  const selectedMunicipality = filters.municipalityCode
    ? municipalityOptions.find((m) => m.municipalityCode === filters.municipalityCode) ?? null
    : null;
  const inFavourByMunicipality = getInFavourByMunicipality(filters);
  const inFavourByYear = getInFavourByYear({
    municipalityCode: filters.municipalityCode,
    includeSectionIds: filters.includeSectionIds,
    excludeSectionIds: filters.excludeSectionIds,
  });
  const inFavourHeading = formatInFavourHeading(t, {
    year: filters.year,
    municipalityName: selectedMunicipality?.municipalityName,
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
                {t.statutesPageTitle}
              </h1>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{t.statutesPageSubtitle}</p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href={locale === "en" ? "/coverage" : "/coverage/da"}
                className="text-sm text-[var(--link)] underline hover:text-[var(--text-primary)]"
              >
                {t.coverageNavLink}
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

        <div className="mb-8">
          <StatutoryPicker options={options} t={t} />
        </div>

        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatTile
            label={t.average}
            value={overall.avgDays != null ? `${overall.avgDays.toFixed(1)}d` : "—"}
          />
          <StatTile
            label={t.decisionsCounted}
            value={overall.caseCount.toLocaleString(t.locale)}
          />
          <StatTile
            label={t.municipalities}
            value={overall.municipalityCount.toString()}
          />
        </div>

        <DecisionStatusTable data={decisionStatusBreakdown} t={t} />

        {municipalities.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">{t.noMatch}</p>
        ) : (
          <MunicipalityChart data={municipalities} t={t} />
        )}

        {inFavourByMunicipality.length > 0 && (
          <div className="mt-8">
            <InFavourChart
              byMunicipality={inFavourByMunicipality}
              byYear={inFavourByYear}
              years={years}
              municipalities={municipalityOptions}
              heading={inFavourHeading}
              t={t}
            />
          </div>
        )}

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

        {exclusionTotal > 0 && (
          <details className="mt-3 rounded border-l-4 border-[var(--info-border)] bg-[var(--info-bg)] px-4 py-3 text-sm text-[var(--text-primary)]">
            <summary className="cursor-pointer">{exclusionText.toggleText}</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-[var(--text-secondary)]">
              {exclusionText.reasonLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            {exclusionText.topAffectedText && (
              <p className="mt-2 text-xs text-[var(--text-muted)]">{exclusionText.topAffectedText}</p>
            )}
            <p className="mt-2 text-xs text-[var(--text-muted)]">{t.exclusionMissingDatesNote}</p>
          </details>
        )}
      </main>
    </>
  );
}
