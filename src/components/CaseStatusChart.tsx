"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReasonForClosingByYear } from "@/lib/db";
import type { Dictionary } from "@/lib/i18n";

const REASON_KEYS = [
  "IN_FAVOUR",
  "IN_PARTIAL_FAVOUR",
  "REJECTED",
  "DISMISSED",
  "SETTLEMENT",
  "NOT_SET",
] as const;

const REASON_COLORS: Record<(typeof REASON_KEYS)[number], string> = {
  IN_FAVOUR: "var(--series-1)",
  IN_PARTIAL_FAVOUR: "var(--series-6)",
  REJECTED: "var(--series-2)",
  DISMISSED: "var(--series-3)",
  SETTLEMENT: "var(--series-5)",
  NOT_SET: "var(--series-4)",
};

function total(row: ReasonForClosingByYear): number {
  return REASON_KEYS.reduce((sum, key) => sum + row[key], 0);
}

function TooltipContent({
  active,
  payload,
  label,
  t,
}: {
  active?: boolean;
  payload?: { payload: ReasonForClosingByYear }[];
  label?: string;
  t: Dictionary;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 shadow-sm">
      <div className="mb-1 text-xs font-semibold text-[var(--text-primary)]">{label}</div>
      {REASON_KEYS.filter((key) => row[key] > 0).map((key) => (
        <div key={key} className="flex items-center gap-2">
          <span
            className="inline-block h-[2px] w-3 rounded-full"
            style={{ backgroundColor: REASON_COLORS[key] }}
          />
          <span className="text-sm font-medium tabular-nums text-[var(--text-primary)]">
            {row[key].toLocaleString(t.locale)}
          </span>
          <span className="text-xs text-[var(--text-muted)]">{t.reasonForClosingLabels[key] ?? key}</span>
        </div>
      ))}
      <div className="mt-1 border-t border-[var(--border)] pt-1 text-xs text-[var(--text-muted)]">
        {t.caseStatusTableTotal}: {total(row).toLocaleString(t.locale)}
      </div>
    </div>
  );
}

export function CaseStatusChart({ data, t }: { data: ReasonForClosingByYear[]; t: Dictionary }) {
  const [displayMode, setDisplayMode] = useState<"chart" | "table">("chart");

  const legend = REASON_KEYS.map((key) => [t.reasonForClosingLabels[key] ?? key, REASON_COLORS[key]] as const);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">{t.caseStatusHeading}</h2>
        <div className="flex items-center gap-4 text-xs">
          <button
            onClick={() => setDisplayMode("chart")}
            className={`border-b-2 px-1 pb-1 font-medium ${
              displayMode === "chart"
                ? "border-[var(--accent)] text-[var(--text-primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {t.chartTab}
          </button>
          <button
            onClick={() => setDisplayMode("table")}
            className={`border-b-2 px-1 pb-1 font-medium ${
              displayMode === "table"
                ? "border-[var(--accent)] text-[var(--text-primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {t.tableTab}
          </button>
        </div>
      </div>

      {displayMode === "chart" && (
        <div className="mb-2 flex flex-wrap items-center gap-4 text-xs text-[var(--text-secondary)]">
          {legend.map(([label, color]) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className="inline-block h-[2px] w-3 rounded-full" style={{ backgroundColor: color }} />
              {label}
            </span>
          ))}
        </div>
      )}

      {displayMode === "table" ? (
        <div className="max-h-[70vh] overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface-1)]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[var(--surface-1)]">
              <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-muted)]">
                <th className="px-3 py-2 font-medium">{t.trendYearAxis}</th>
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
                <tr key={row.year} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-3 py-1.5 text-[var(--text-primary)]">{row.year}</td>
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
      ) : (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-2">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} barCategoryGap={4} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
              <CartesianGrid vertical={false} stroke="var(--gridline)" strokeDasharray="0" />
              <XAxis
                dataKey="year"
                stroke="var(--baseline)"
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "var(--baseline)" }}
              />
              <YAxis
                stroke="var(--baseline)"
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                label={{
                  value: t.caseStatusCountAxis,
                  angle: -90,
                  position: "insideLeft",
                  fill: "var(--text-muted)",
                  fontSize: 11,
                }}
              />
              <Tooltip content={<TooltipContent t={t} />} cursor={{ fill: "var(--gridline)", opacity: 0.4 }} />
              {REASON_KEYS.map((key) => (
                <Bar key={key} dataKey={key} stackId="a" fill={REASON_COLORS[key]} isAnimationActive={false} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
