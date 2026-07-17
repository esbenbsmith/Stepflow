import Link from "next/link";
import {
  getDecisionStatusBreakdown,
  getDecisiveBoardOptions,
  getExclusionBreakdown,
  getInFavourByMunicipality,
  getInFavourByYear,
  getMunicipalityAverages,
  getMunicipalityOptions,
  getOverall,
  getReasonForClosingByQuarter,
  getReasonForClosingByYear,
  getReasonForClosingCounts,
  getSyncMeta,
  getTotalCaseCount,
  getYearOptions,
  getYearlyAverages,
} from "@/lib/db";
import { formatExclusionBreakdown, formatInFavourHeading, getDictionary, type Locale } from "@/lib/i18n";
import { CaseStatusChart } from "@/components/CaseStatusChart";
import { DecisionStatusTable } from "@/components/DecisionStatusTable";
import { FiltersBar } from "@/components/FiltersBar";
import { InFavourChart } from "@/components/InFavourChart";
import { MunicipalityChart } from "@/components/MunicipalityChart";
import { QuarterlyStatusTable } from "@/components/QuarterlyStatusTable";
import { StatTile } from "@/components/StatTile";
import { TrendChart } from "@/components/TrendChart";

function formatSyncedAt(iso: string | null, t: ReturnType<typeof getDictionary>): string {
  if (!iso) return t.never;
  return new Date(iso).toLocaleString(t.locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export async function Dashboard({
  locale,
  searchParams,
}: {
  locale: Locale;
  searchParams: Promise<{ year?: string; municipality?: string; board?: string }>;
}) {
  const t = getDictionary(locale);
  const params = await searchParams;
  const filters = {
    year: params.year,
    municipalityCode: params.municipality,
    decisiveBoard: params.board,
  };
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v) as [string, string][]
  ).toString();
  const otherLocale: Locale = locale === "en" ? "da" : "en";
  const otherHref = `${otherLocale === "en" ? "/" : "/da"}${qs ? `?${qs}` : ""}`;

  const years = getYearOptions();
  const municipalityOptions = getMunicipalityOptions();
  const decisiveBoardOptions = getDecisiveBoardOptions();
  const syncedAt = getSyncMeta("last_synced_at");

  const LanguageSwitcher = (
    <Link
      href={otherHref}
      className="text-sm text-[var(--link)] underline hover:text-[var(--text-primary)]"
    >
      {t.otherLanguageLabel}
    </Link>
  );

  const StatutesLink = (
    <Link
      href={locale === "en" ? "/statutes" : "/statutes/da"}
      className="text-sm text-[var(--link)] underline hover:text-[var(--text-primary)]"
    >
      {t.statutesNavLink}
    </Link>
  );

  const UtilityBar = (
    <div className="border-b border-[var(--border)] bg-[var(--surface-1)]">
      <div className="mx-auto w-full max-w-4xl px-6 py-2 text-xs text-[var(--text-muted)]">
        {t.attribution}
      </div>
    </div>
  );

  if (years.length === 0) {
    return (
      <>
        {UtilityBar}
        <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">
              {t.title}
            </h1>
            {LanguageSwitcher}
          </div>
          <p className="text-[var(--text-secondary)]">
            {t.noDataPrefix} <code className="text-[var(--text-primary)]">npm run sync</code>{" "}
            {t.noDataSuffix}
          </p>
        </main>
      </>
    );
  }

  const overall = getOverall(filters);
  const totalCaseCount = getTotalCaseCount();
  const reasonForClosingByYear = getReasonForClosingByYear();
  const reasonForClosingByQuarter = getReasonForClosingByQuarter();
  const reasonForClosingBreakdown = Object.entries(getReasonForClosingCounts())
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([key, count]) => `${count.toLocaleString(t.locale)} ${t.reasonForClosingLabels[key] ?? key}`)
    .join(" · ");
  const municipalities = getMunicipalityAverages(filters);
  const decisionStatusBreakdown = getDecisionStatusBreakdown(filters);
  const exclusionBreakdown = getExclusionBreakdown(filters);
  const exclusionTotal = exclusionBreakdown.invalidDuration + exclusionBreakdown.before2012;
  const exclusionText = formatExclusionBreakdown(t, exclusionBreakdown);

  const trendFilters = { decisiveBoard: filters.decisiveBoard };
  const nationalTrend = getYearlyAverages(trendFilters);
  const selectedMunicipality = filters.municipalityCode
    ? municipalityOptions.find((m) => m.municipalityCode === filters.municipalityCode) ?? null
    : null;
  const municipalityTrend = filters.municipalityCode
    ? getYearlyAverages({ ...trendFilters, municipalityCode: filters.municipalityCode })
    : null;

  const inFavourByMunicipality = getInFavourByMunicipality(filters);
  const inFavourByYear = getInFavourByYear({
    municipalityCode: filters.municipalityCode,
    decisiveBoard: filters.decisiveBoard,
  });
  const inFavourHeading = formatInFavourHeading(t, {
    year: filters.year,
    municipalityName: selectedMunicipality?.municipalityName,
  });

  return (
    <>
      {UtilityBar}
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
        <header className="mb-8 flex items-start justify-between border-b border-[var(--border)] pb-6">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">
              {t.title}
            </h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {t.subtitle}
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {t.totalCasesLabel}: {totalCaseCount.toLocaleString(t.locale)}
            </p>
            {reasonForClosingBreakdown && (
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">{reasonForClosingBreakdown}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            {StatutesLink}
            {LanguageSwitcher}
          </div>
        </header>

        <FiltersBar
          years={years}
          municipalities={municipalityOptions}
          decisiveBoards={decisiveBoardOptions}
          t={t}
        />

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

        {nationalTrend.length > 0 && (
          <div className="mb-8">
            <TrendChart
              national={nationalTrend}
              municipality={municipalityTrend}
              municipalityName={selectedMunicipality?.municipalityName ?? null}
              t={t}
            />
          </div>
        )}

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

        {reasonForClosingByYear.length > 0 && (
          <div className="mt-8">
            <CaseStatusChart data={reasonForClosingByYear} t={t} />
          </div>
        )}

        {reasonForClosingByQuarter.length > 0 && (
          <div className="mt-8">
            <QuarterlyStatusTable data={reasonForClosingByQuarter} t={t} />
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
          </details>
        )}
      </main>
    </>
  );
}
