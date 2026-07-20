export type Locale = "en" | "da";

export interface Dictionary {
  locale: string;
  title: string;
  subtitle: string;
  yearLabel: string;
  allYears: string;
  municipalityLabel: string;
  allMunicipalities: string;
  decisiveBoardLabel: string;
  allDecisiveBoards: string;
  boardLabels: Record<string, string>;
  average: string;
  decisionsCounted: string;
  totalCasesLabel: string;
  reasonForClosingLabels: Record<string, string>;
  municipalities: string;
  chartHeading: string;
  chartTab: string;
  tableTab: string;
  sortLabel: string;
  sortHighestFirst: string;
  sortLowestFirst: string;
  sortAlpha: string;
  tableMunicipality: string;
  tableAvgDays: string;
  tableDecisions: string;
  tooltipDecisions: string;
  daysAxis: string;
  trendHeading: string;
  trendYearAxis: string;
  trendNationalLabel: string;
  inFavourHeadingAll: string;
  inFavourHeadingYear: string;
  inFavourHeadingMunicipality: string;
  inFavourHeadingBoth: string;
  inFavourViewMunicipality: string;
  inFavourViewYear: string;
  inFavourTenant: string;
  inFavourLandlord: string;
  inFavourShared: string;
  inFavourNotSet: string;
  percentAxis: string;
  noDataPrefix: string;
  noDataSuffix: string;
  noMatch: string;
  lastSynced: string;
  never: string;
  source: string;
  exclusionToggleOne: string;
  exclusionToggleOther: string;
  exclusionReasonInvalidDuration: string;
  exclusionReasonBefore2012: string;
  exclusionTopAffected: string;
  exclusionMissingDatesNote: string;
  otherLanguageLabel: string;
  attribution: string;
  statutesNavLink: string;
  backToDashboard: string;
  statutesPageTitle: string;
  statutesPageSubtitle: string;
  statutorySearchPlaceholder: string;
  statutoryIncludeLabel: string;
  statutoryExcludeLabel: string;
  statutoryClear: string;
  statutoryNoSelection: string;
  statutoryNoMatch: string;
  caseStatusHeading: string;
  caseStatusCountAxis: string;
  caseStatusTableTotal: string;
  quarterlyStatusHeading: string;
  quarterlyStatusQuarter: string;
  decisionStatusHeading: string;
  decisionStatusLabel: string;
  allCasesVsFilteredNote: string;
  coverageNavLink: string;
  coveragePageTitle: string;
  coveragePageSubtitle: string;
  coverageMunicipalityCountNote: string;
  coverageMissingLabel: string;
  coverageNoneMissing: string;
  coverageCurrentYearNote: string;
}

const dictionaries: Record<Locale, Dictionary> = {
  en: {
    locale: "en-GB",
    title: "Rent board Dashboard",
    subtitle: "Time from filing to decision across Danish rent boards.",
    yearLabel: "Year decided",
    allYears: "All years",
    municipalityLabel: "Municipality",
    allMunicipalities: "All municipalities",
    decisiveBoardLabel: "Board",
    allDecisiveBoards: "All boards",
    boardLabels: {
      RENT_BOARD: "Rent Board",
      RESIDENT_COMPLAINTS_BOARD: "Resident Complaints Board",
      APPEAL_BOARD: "Appeal Board",
      NOT_SET: "Not set",
    },
    average: "Average",
    decisionsCounted: "Decisions counted",
    totalCasesLabel: "Total cases tracked",
    reasonForClosingLabels: {
      NOT_SET: "not set",
      DISMISSED: "dismissed",
      IN_FAVOUR: "decided",
      REJECTED: "rejected",
      SETTLEMENT: "settled",
      IN_PARTIAL_FAVOUR: "partially decided",
    },
    municipalities: "Municipalities",
    chartHeading: "Average days from filing to decision, by municipality",
    chartTab: "Chart",
    tableTab: "Table",
    sortLabel: "Sort",
    sortHighestFirst: "Highest first",
    sortLowestFirst: "Lowest first",
    sortAlpha: "A–Z",
    tableMunicipality: "Municipality",
    tableAvgDays: "Avg. days",
    tableDecisions: "Decisions",
    tooltipDecisions: "decisions",
    daysAxis: "Days",
    trendHeading: "Average days from filing to decision, over time",
    trendYearAxis: "Year",
    trendNationalLabel: "National average",
    inFavourHeadingAll: "Decision outcome, by municipality and year",
    inFavourHeadingYear: "Decision outcome in {year}, by municipality",
    inFavourHeadingMunicipality: "Decision outcome in {municipality}, by year",
    inFavourHeadingBoth: "Decision outcome in {municipality}, {year}",
    inFavourViewMunicipality: "By municipality",
    inFavourViewYear: "By year",
    inFavourTenant: "In favour of tenant",
    inFavourLandlord: "In favour of landlord",
    inFavourShared: "Shared",
    inFavourNotSet: "Not set",
    percentAxis: "% of decisions",
    noDataPrefix: "No data yet. Run",
    noDataSuffix: "to pull decisions from the huslejenaevn.dk API.",
    noMatch: "No decisions match this filter.",
    lastSynced: "Data last synced",
    never: "never",
    source: "Source",
    exclusionToggleOne: "{n} decision excluded from these statistics — see why",
    exclusionToggleOther: "{n} decisions excluded from these statistics — see why",
    exclusionReasonInvalidDuration:
      "{n} — the source data has dateOfDecision preceding dateOfFiling, which isn't possible; we don't know which of the two dates is wrong, so these are left out entirely rather than guessed at.",
    exclusionReasonBefore2012:
      "{n} — filed or decided before 2012, outside the range with enough volume to be statistically meaningful.",
    exclusionTopAffected: "Most affected by the date-order issue: {list}.",
    exclusionMissingDatesNote:
      "Cases missing a dateOfDecision (or, in principle, a dateOfFiling) entirely are never synced into this database at all, so they aren't part of the count above either — those cases fall outside this filtered view completely.",
    otherLanguageLabel: "Dansk",
    attribution: "Unofficial dashboard built on public data from huslejenaevn.dk",
    statutesNavLink: "Filter by statute",
    backToDashboard: "← Back to dashboard",
    statutesPageTitle: "Filter by statute",
    statutesPageSubtitle:
      "See how case outcomes and processing time differ by the law, chapter, or paragraph (§) a decision cites.",
    statutorySearchPlaceholder: "Search laws, chapters, paragraphs…",
    statutoryIncludeLabel: "Include",
    statutoryExcludeLabel: "Exclude",
    statutoryClear: "Clear",
    statutoryNoSelection: "No statutes selected — showing all decisions.",
    statutoryNoMatch: "No statutes match your search.",
    caseStatusHeading: "All cases, by year and status",
    caseStatusCountAxis: "Cases",
    caseStatusTableTotal: "Total",
    quarterlyStatusHeading: "All cases, by quarter and status",
    quarterlyStatusQuarter: "Quarter",
    decisionStatusHeading: "Status of decisions counted",
    decisionStatusLabel: "Status",
    allCasesVsFilteredNote:
      "This covers every case in the source system. \"Decisions counted\" below uses a smaller, filtered subset of these — see the note near the bottom for what's excluded and why.",
    coverageNavLink: "Data coverage",
    coveragePageTitle: "Data coverage",
    coveragePageSubtitle:
      "Which municipalities have zero recorded cases in a given year since 2012 — every case regardless of status, not just the filtered set used elsewhere.",
    coverageMunicipalityCountNote: "Based on all {count} municipalities recognised by the source system.",
    coverageMissingLabel: "missing",
    coverageNoneMissing: "None — every municipality recorded at least one case.",
    coverageCurrentYearNote:
      "The current year is still accumulating cases, so its \"missing\" count reflects incomplete data, not necessarily a real gap.",
  },
  da: {
    locale: "da-DK",
    title: "Husleje- og Beboerklagenævn Dashboard",
    subtitle: "Sagsbehandlingstid fra klage til afgørelse hos de danske huslejenævn.",
    yearLabel: "Afgørelsesår",
    allYears: "Alle år",
    municipalityLabel: "Kommune",
    allMunicipalities: "Alle kommuner",
    decisiveBoardLabel: "Nævn",
    allDecisiveBoards: "Alle nævn",
    boardLabels: {
      RENT_BOARD: "Huslejenævn",
      RESIDENT_COMPLAINTS_BOARD: "Beboerklagenævn",
      APPEAL_BOARD: "Ankenævn",
      NOT_SET: "Ikke angivet",
    },
    average: "Gennemsnit",
    decisionsCounted: "Afgørelser talt med",
    totalCasesLabel: "Sager i alt registreret",
    reasonForClosingLabels: {
      NOT_SET: "ikke angivet",
      DISMISSED: "henlagt",
      IN_FAVOUR: "afgjort",
      REJECTED: "afvist",
      SETTLEMENT: "forligt",
      IN_PARTIAL_FAVOUR: "delvist afgjort",
    },
    municipalities: "Kommuner",
    chartHeading: "Gennemsnitligt antal dage fra indbringelse til afgørelse, pr. kommune",
    chartTab: "Diagram",
    tableTab: "Tabel",
    sortLabel: "Sortér",
    sortHighestFirst: "Højest først",
    sortLowestFirst: "Lavest først",
    sortAlpha: "A–Å",
    tableMunicipality: "Kommune",
    tableAvgDays: "Gns. dage",
    tableDecisions: "Afgørelser",
    tooltipDecisions: "afgørelser",
    daysAxis: "Dage",
    trendHeading: "Gennemsnitligt antal dage fra indbringelse til afgørelse, over tid",
    trendYearAxis: "År",
    trendNationalLabel: "Landsgennemsnit",
    inFavourHeadingAll: "Udfald af afgørelser, pr. kommune og år",
    inFavourHeadingYear: "Udfald af afgørelser i {year}, pr. kommune",
    inFavourHeadingMunicipality: "Udfald af afgørelser i {municipality}, pr. år",
    inFavourHeadingBoth: "Udfald af afgørelser i {municipality}, {year}",
    inFavourViewMunicipality: "Pr. kommune",
    inFavourViewYear: "Pr. år",
    inFavourTenant: "Medhold til lejer",
    inFavourLandlord: "Medhold til udlejer",
    inFavourShared: "Delt medhold",
    inFavourNotSet: "Ikke angivet",
    percentAxis: "% af afgørelser",
    noDataPrefix: "Ingen data endnu. Kør",
    noDataSuffix: "for at hente afgørelser fra huslejenaevn.dk's API.",
    noMatch: "Ingen afgørelser matcher dette filter.",
    lastSynced: "Data sidst synkroniseret",
    never: "aldrig",
    source: "Kilde",
    exclusionToggleOne: "{n} afgørelse udelukket fra denne statistik — se hvorfor",
    exclusionToggleOther: "{n} afgørelser udelukket fra denne statistik — se hvorfor",
    exclusionReasonInvalidDuration:
      "{n} — i kildedataen ligger afgørelsesdatoen før klagedatoen, hvilket ikke er muligt; vi ved ikke, hvilken af de to datoer der er forkert, så disse udelades helt frem for at gætte.",
    exclusionReasonBefore2012:
      "{n} — indbragt eller afgjort før 2012, uden for det interval, hvor der er nok volumen til at være statistisk meningsfuldt.",
    exclusionTopAffected: "Mest berørt af datorækkefølge-problemet: {list}.",
    exclusionMissingDatesNote:
      "Sager helt uden en afgørelsesdato (eller i princippet en indbringelsesdato) bliver aldrig synkroniseret til denne database, så de er heller ikke en del af tallet ovenfor — de falder helt uden for denne filtrerede visning.",
    otherLanguageLabel: "English",
    attribution: "Uofficielt dashboard baseret på offentlige data fra huslejenaevn.dk",
    statutesNavLink: "Filtrér efter lovhjemmel",
    backToDashboard: "← Tilbage til dashboard",
    statutesPageTitle: "Filtrér efter lovhjemmel",
    statutesPageSubtitle:
      "Se hvordan udfald og sagsbehandlingstid varierer efter den lov, det kapitel eller den paragraf (§), en afgørelse henviser til.",
    statutorySearchPlaceholder: "Søg efter love, kapitler, paragraffer…",
    statutoryIncludeLabel: "Medtag",
    statutoryExcludeLabel: "Udeluk",
    statutoryClear: "Ryd",
    statutoryNoSelection: "Ingen lovhjemler valgt — viser alle afgørelser.",
    statutoryNoMatch: "Ingen lovhjemler matcher din søgning.",
    caseStatusHeading: "Alle sager, pr. år og status",
    caseStatusCountAxis: "Sager",
    caseStatusTableTotal: "I alt",
    quarterlyStatusHeading: "Alle sager, pr. kvartal og status",
    quarterlyStatusQuarter: "Kvartal",
    decisionStatusHeading: "Status for talte afgørelser",
    decisionStatusLabel: "Status",
    allCasesVsFilteredNote:
      "Dette dækker alle sager i kildesystemet. \"Afgørelser talt med\" nedenfor bruger en mindre, filtreret delmængde af disse — se noten nederst for, hvad der er udeladt, og hvorfor.",
    coverageNavLink: "Datadækning",
    coveragePageTitle: "Datadækning",
    coveragePageSubtitle:
      "Hvilke kommuner har nul registrerede sager i et givet år siden 2012 — alle sager uanset status, ikke kun den filtrerede mængde brugt andre steder.",
    coverageMunicipalityCountNote: "Baseret på alle {count} kommuner, som kildesystemet kender.",
    coverageMissingLabel: "mangler",
    coverageNoneMissing: "Ingen — alle kommuner havde mindst én sag.",
    coverageCurrentYearNote:
      "Det indeværende år modtager stadig sager, så dets \"mangler\"-tal afspejler ufuldstændige data, ikke nødvendigvis et reelt hul.",
  },
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

// Not stored on Dictionary itself — it's a function, and Dictionary values get
// passed as props to Client Components, which can't serialize functions.
export function formatExclusionBreakdown(
  t: Dictionary,
  breakdown: {
    invalidDuration: number;
    before2012: number;
    topAffectedMunicipalities: { name: string; count: number }[];
  }
): { toggleText: string; reasonLines: string[]; topAffectedText: string | null } {
  const total = breakdown.invalidDuration + breakdown.before2012;
  const toggleTemplate = total === 1 ? t.exclusionToggleOne : t.exclusionToggleOther;
  const toggleText = toggleTemplate.replace("{n}", total.toLocaleString(t.locale));

  const reasonLines: string[] = [];
  if (breakdown.invalidDuration > 0) {
    reasonLines.push(
      t.exclusionReasonInvalidDuration.replace("{n}", breakdown.invalidDuration.toLocaleString(t.locale))
    );
  }
  if (breakdown.before2012 > 0) {
    reasonLines.push(
      t.exclusionReasonBefore2012.replace("{n}", breakdown.before2012.toLocaleString(t.locale))
    );
  }

  const topAffectedText =
    breakdown.topAffectedMunicipalities.length > 0
      ? t.exclusionTopAffected.replace(
          "{list}",
          breakdown.topAffectedMunicipalities
            .map((m) => `${m.name} (${m.count.toLocaleString(t.locale)})`)
            .join(", ")
        )
      : null;

  return { toggleText, reasonLines, topAffectedText };
}

export function formatInFavourHeading(
  t: Dictionary,
  { year, municipalityName }: { year?: string; municipalityName?: string | null }
): string {
  if (municipalityName && year) {
    return t.inFavourHeadingBoth.replace("{municipality}", municipalityName).replace("{year}", year);
  }
  if (municipalityName) {
    return t.inFavourHeadingMunicipality.replace("{municipality}", municipalityName);
  }
  if (year) {
    return t.inFavourHeadingYear.replace("{year}", year);
  }
  return t.inFavourHeadingAll;
}
