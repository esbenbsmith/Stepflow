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
  excludedNoteOne: string;
  excludedNoteOther: string;
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
    excludedNoteOne:
      "{n} decision excluded from these averages (dateOfDecision precedes dateOfFiling in the source data).",
    excludedNoteOther:
      "{n} decisions excluded from these averages (dateOfDecision precedes dateOfFiling in the source data).",
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
    excludedNoteOne:
      "{n} afgørelse udelukket fra disse gennemsnit (afgørelsesdato ligger før klagedato i kildedata).",
    excludedNoteOther:
      "{n} afgørelser udelukket fra disse gennemsnit (afgørelsesdato ligger før klagedato i kildedata).",
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
  },
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

// Not stored on Dictionary itself — it's a function, and Dictionary values get
// passed as props to Client Components, which can't serialize functions.
export function formatExcludedNote(t: Dictionary, n: number): string {
  const template = n === 1 ? t.excludedNoteOne : t.excludedNoteOther;
  return template.replace("{n}", n.toLocaleString(t.locale));
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
