"use client";

import { useState } from "react";
import type { ReasonForClosingByQuarter } from "@/lib/db";
import type { Dictionary } from "@/lib/i18n";

const REASON_KEYS = [
  "IN_FAVOUR",
  "IN_PARTIAL_FAVOUR",
  "REJECTED",
  "DISMISSED",
  "SETTLEMENT",
  "NOT_SET",
] as const;

type DateMode = "filing" | "decision";

function total(row: ReasonForClosingByQuarter): number {
  return REASON_KEYS.reduce((sum, key) => sum + row[key], 0);
}

export function QuarterlyStatusTable({
  dataByFiling,
  dataByDecision,
  t,
}: {
  dataByFiling: ReasonForClosingByQuarter[];
  dataByDecision: ReasonForClosingByQuarter[];
  t: Dictionary;
}) {
  const [mode, setMode] = useState<DateMode>("filing");
  const data = mode === "filing" ? dataByFiling : dataByDecision;
  const methodLines = mode === "filing" ? t.quarterlyStatusMethodLinesFiling : t.quarterlyStatusMethodLinesDecision;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">{t.quarterlyStatusHeading}</h2>
        <div className="flex items-center gap-4 text-xs">
          <button
            onClick={() => setMode("filing")}
            className={`border-b-2 px-1 pb-1 font-medium ${
              mode === "filing"
                ? "border-[var(--accent)] text-[var(--text-primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {t.quarterlyStatusFilingToggle}
          </button>
          <button
            onClick={() => setMode("decision")}
            className={`border-b-2 px-1 pb-1 font-medium ${
              mode === "decision"
                ? "border-[var(--accent)] text-[var(--text-primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {t.quarterlyStatusDecisionToggle}
          </button>
        </div>
      </div>
      <div className="max-h-[70vh] overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface-1)]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-[var(--surface-1)]">
            <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-muted)]">
              <th className="px-3 py-2 font-medium">{t.quarterlyStatusQuarter}</th>
              {REASON_KEYS.map((key) => (
                <th key={key} className="px-3 py-2 font-medium text-right">
                  {t.reasonForClosingLabels[key] ?? key}
                </th>
              ))}
              <th className="px-3 py-2 font-medium text-right">{t.caseStatusTableTotal}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.period} className="border-b border-[var(--border)] last:border-0">
                <td className="px-3 py-1.5 text-[var(--text-primary)]">{row.period}</td>
                {REASON_KEYS.map((key) => (
                  <td key={key} className="px-3 py-1.5 text-right tabular-nums text-[var(--text-primary)]">
                    {row[key].toLocaleString(t.locale)}
                  </td>
                ))}
                <td className="px-3 py-1.5 text-right tabular-nums text-[var(--text-muted)]">
                  {total(row).toLocaleString(t.locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <details className="mt-3 rounded border-l-4 border-[var(--info-border)] bg-[var(--info-bg)] px-4 py-3 text-sm text-[var(--text-primary)]">
        <summary className="cursor-pointer">{t.quarterlyStatusMethodToggle}</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-[var(--text-secondary)]">
          {methodLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}
