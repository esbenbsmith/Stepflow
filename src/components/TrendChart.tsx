"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { YearlyAverage } from "@/lib/db";
import type { Dictionary } from "@/lib/i18n";

function formatDays(value: number): string {
  return `${value.toFixed(1)}d`;
}

type TrendRow = {
  year: string;
  national: number | null;
  nationalCount: number;
  municipality: number | null;
  municipalityCount: number;
};

function TooltipContent({
  active,
  payload,
  label,
  municipalityName,
  t,
}: {
  active?: boolean;
  payload?: { payload: TrendRow }[];
  label?: string;
  municipalityName: string | null;
  t: Dictionary;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 shadow-sm">
      <div className="mb-1 text-xs font-semibold text-[var(--text-primary)]">{label}</div>
      {row.national != null && (
        <div className="flex items-center gap-2">
          <span className="inline-block h-[2px] w-3 rounded-full bg-[var(--series-1)]" />
          <span className="text-sm font-medium tabular-nums text-[var(--text-primary)]">
            {formatDays(row.national)}
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            {t.trendNationalLabel} ({row.nationalCount.toLocaleString(t.locale)} {t.tooltipDecisions})
          </span>
        </div>
      )}
      {municipalityName && row.municipality != null && (
        <div className="flex items-center gap-2">
          <span className="inline-block h-[2px] w-3 rounded-full bg-[var(--series-2)]" />
          <span className="text-sm font-medium tabular-nums text-[var(--text-primary)]">
            {formatDays(row.municipality)}
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            {municipalityName} ({row.municipalityCount.toLocaleString(t.locale)} {t.tooltipDecisions})
          </span>
        </div>
      )}
    </div>
  );
}

export function TrendChart({
  national,
  municipality,
  municipalityName,
  t,
}: {
  national: YearlyAverage[];
  municipality: YearlyAverage[] | null;
  municipalityName: string | null;
  t: Dictionary;
}) {
  const data = useMemo<TrendRow[]>(() => {
    const nationalByYear = new Map(national.map((r) => [r.year, r]));
    const municipalityByYear = new Map((municipality ?? []).map((r) => [r.year, r]));
    const years = Array.from(
      new Set([...nationalByYear.keys(), ...municipalityByYear.keys()])
    ).sort();

    return years.map((year) => ({
      year,
      national: nationalByYear.get(year)?.avgDays ?? null,
      nationalCount: nationalByYear.get(year)?.caseCount ?? 0,
      municipality: municipalityByYear.get(year)?.avgDays ?? null,
      municipalityCount: municipalityByYear.get(year)?.caseCount ?? 0,
    }));
  }, [national, municipality]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">{t.trendHeading}</h2>
        <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-[2px] w-3 rounded-full bg-[var(--series-1)]" />
            {t.trendNationalLabel}
          </span>
          {municipalityName && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-[2px] w-3 rounded-full bg-[var(--series-2)]" />
              {municipalityName}
            </span>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-2">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
            <CartesianGrid stroke="var(--gridline)" strokeDasharray="0" vertical={false} />
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
                value: t.daysAxis,
                angle: -90,
                position: "insideLeft",
                fill: "var(--text-muted)",
                fontSize: 11,
              }}
            />
            <Tooltip
              content={<TooltipContent municipalityName={municipalityName} t={t} />}
              cursor={{ stroke: "var(--gridline)" }}
            />
            <Line
              type="monotone"
              dataKey="national"
              stroke="var(--series-1)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              connectNulls
            />
            {municipalityName && (
              <Line
                type="monotone"
                dataKey="municipality"
                stroke="var(--series-2)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                connectNulls
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
