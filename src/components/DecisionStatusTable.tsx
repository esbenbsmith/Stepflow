import type { DecisionStatusCount } from "@/lib/db";
import type { Dictionary } from "@/lib/i18n";

export function DecisionStatusTable({
  data,
  t,
}: {
  data: DecisionStatusCount[];
  t: Dictionary;
}) {
  const total = data.reduce((sum, row) => sum + row.count, 0);
  if (total === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
        {t.decisionStatusHeading}
      </h2>
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-muted)]">
              <th className="px-3 py-2 font-medium">{t.decisionStatusLabel}</th>
              <th className="px-3 py-2 font-medium text-right">{t.tableDecisions}</th>
              <th className="px-3 py-2 font-medium text-right">{t.percentAxis}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.reasonForClosing} className="border-b border-[var(--border)] last:border-0">
                <td className="px-3 py-1.5 text-[var(--text-primary)]">
                  {t.reasonForClosingLabels[row.reasonForClosing] ?? row.reasonForClosing}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums text-[var(--text-primary)]">
                  {row.count.toLocaleString(t.locale)}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums text-[var(--text-muted)]">
                  {((row.count / total) * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
