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

function total(row: ReasonForClosingByQuarter): number {
  return REASON_KEYS.reduce((sum, key) => sum + row[key], 0);
}

export function QuarterlyStatusTable({
  data,
  t,
}: {
  data: ReasonForClosingByQuarter[];
  t: Dictionary;
}) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
        {t.quarterlyStatusHeading}
      </h2>
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
    </div>
  );
}
