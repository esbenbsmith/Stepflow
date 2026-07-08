"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { InFavourByMunicipality, InFavourByYear, MunicipalityOption } from "@/lib/db";
import type { Dictionary } from "@/lib/i18n";
import { useFilterParam } from "@/lib/useFilterParam";

const ROW_HEIGHT = 22;

type Row = {
  name: string;
  tenantPct: number;
  landlordPct: number;
  sharedPct: number;
  notSetPct: number;
  tenant: number;
  landlord: number;
  shared: number;
  notSet: number;
  total: number;
};

function toRow(name: string, counts: { tenant: number; landlord: number; shared: number; notSet: number; total: number }): Row {
  const total = counts.total || 1;
  return {
    name,
    tenant: counts.tenant,
    landlord: counts.landlord,
    shared: counts.shared,
    notSet: counts.notSet,
    total: counts.total,
    tenantPct: (counts.tenant / total) * 100,
    landlordPct: (counts.landlord / total) * 100,
    sharedPct: (counts.shared / total) * 100,
    notSetPct: (counts.notSet / total) * 100,
  };
}

function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

function TooltipContent({
  active,
  payload,
  label,
  t,
}: {
  active?: boolean;
  payload?: { payload: Row }[];
  label?: string;
  t: Dictionary;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;
  const entries: [string, number, number, string][] = [
    [t.inFavourTenant, row.tenant, row.tenantPct, "var(--series-1)"],
    [t.inFavourLandlord, row.landlord, row.landlordPct, "var(--series-2)"],
    [t.inFavourShared, row.shared, row.sharedPct, "var(--series-3)"],
    [t.inFavourNotSet, row.notSet, row.notSetPct, "var(--series-4)"],
  ];
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 shadow-sm">
      <div className="mb-1 text-xs font-semibold text-[var(--text-primary)]">
        {label ?? row.name}
      </div>
      {entries.map(([name, count, pct, color]) => (
        <div key={name} className="flex items-center gap-2">
          <span className="inline-block h-[2px] w-3 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-sm font-medium tabular-nums text-[var(--text-primary)]">
            {formatPct(pct)}
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            {name} ({count.toLocaleString(t.locale)} {t.tooltipDecisions})
          </span>
        </div>
      ))}
    </div>
  );
}

export function InFavourChart({
  byMunicipality,
  byYear,
  years,
  municipalities,
  heading,
  t,
}: {
  byMunicipality: InFavourByMunicipality[];
  byYear: InFavourByYear[];
  years: string[];
  municipalities: MunicipalityOption[];
  heading: string;
  t: Dictionary;
}) {
  const [view, setView] = useState<"municipality" | "year">("municipality");
  const [displayMode, setDisplayMode] = useState<"chart" | "table">("chart");
  const { searchParams, setParam } = useFilterParam();

  const selectClass =
    "rounded border border-[var(--border)] bg-[var(--surface-1)] px-2 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]";

  const municipalityRows = useMemo(
    () =>
      [...byMunicipality]
        .sort((a, b) => a.municipalityName.localeCompare(b.municipalityName, t.locale))
        .map((row) => toRow(row.municipalityName, row)),
    [byMunicipality, t.locale]
  );

  const yearRows = useMemo(() => byYear.map((row) => toRow(row.year, row)), [byYear]);

  const rows = view === "municipality" ? municipalityRows : yearRows;
  const chartHeight = view === "municipality" ? Math.max(rows.length * ROW_HEIGHT, 200) : 300;

  const legend: [string, string][] = [
    [t.inFavourTenant, "var(--series-1)"],
    [t.inFavourLandlord, "var(--series-2)"],
    [t.inFavourShared, "var(--series-3)"],
    [t.inFavourNotSet, "var(--series-4)"],
  ];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">{heading}</h2>
        <div className="flex items-center gap-4 text-xs">
          <button
            onClick={() => setView("municipality")}
            className={`border-b-2 px-1 pb-1 font-medium ${
              view === "municipality"
                ? "border-[var(--accent)] text-[var(--text-primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {t.inFavourViewMunicipality}
          </button>
          <button
            onClick={() => setView("year")}
            className={`border-b-2 px-1 pb-1 font-medium ${
              view === "year"
                ? "border-[var(--accent)] text-[var(--text-primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {t.inFavourViewYear}
          </button>
          <span className="h-4 w-px bg-[var(--border)]" />
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

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          {t.yearLabel}
          <select
            className={selectClass}
            value={searchParams.get("year") ?? ""}
            onChange={(e) => setParam("year", e.target.value)}
          >
            <option value="">{t.allYears}</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          {t.municipalityLabel}
          <select
            className={selectClass}
            value={searchParams.get("municipality") ?? ""}
            onChange={(e) => setParam("municipality", e.target.value)}
          >
            <option value="">{t.allMunicipalities}</option>
            {municipalities.map((m) => (
              <option key={m.municipalityCode} value={m.municipalityCode}>
                {m.municipalityName}
              </option>
            ))}
          </select>
        </label>
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
                <th className="px-3 py-2 font-medium">
                  {view === "municipality" ? t.tableMunicipality : t.trendYearAxis}
                </th>
                <th className="px-3 py-2 font-medium text-right">{t.inFavourTenant}</th>
                <th className="px-3 py-2 font-medium text-right">{t.inFavourLandlord}</th>
                <th className="px-3 py-2 font-medium text-right">{t.inFavourShared}</th>
                <th className="px-3 py-2 font-medium text-right">{t.inFavourNotSet}</th>
                <th className="px-3 py-2 font-medium text-right">{t.tableDecisions}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.name} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-3 py-1.5 text-[var(--text-primary)]">{row.name}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-[var(--text-primary)]">
                    {formatPct(row.tenantPct)}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-[var(--text-primary)]">
                    {formatPct(row.landlordPct)}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-[var(--text-primary)]">
                    {formatPct(row.sharedPct)}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-[var(--text-primary)]">
                    {formatPct(row.notSetPct)}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-[var(--text-muted)]">
                    {row.total.toLocaleString(t.locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          className={
            view === "municipality"
              ? "max-h-[70vh] overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-2"
              : "rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-2"
          }
        >
          <ResponsiveContainer width="100%" height={chartHeight}>
            {view === "municipality" ? (
              <BarChart
                data={rows}
                layout="vertical"
                barCategoryGap={2}
                margin={{ top: 4, right: 16, bottom: 4, left: 4 }}
              >
                <CartesianGrid horizontal={false} stroke="var(--gridline)" strokeDasharray="0" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  stroke="var(--baseline)"
                  tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--baseline)" }}
                  label={{
                    value: t.percentAxis,
                    position: "insideBottomRight",
                    offset: -2,
                    fill: "var(--text-muted)",
                    fontSize: 11,
                  }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={170}
                  stroke="var(--baseline)"
                  tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                />
                <Tooltip content={<TooltipContent t={t} />} cursor={{ fill: "var(--gridline)", opacity: 0.4 }} />
                <Bar dataKey="tenantPct" stackId="a" fill="var(--series-1)" isAnimationActive={false} />
                <Bar dataKey="landlordPct" stackId="a" fill="var(--series-2)" isAnimationActive={false} />
                <Bar dataKey="sharedPct" stackId="a" fill="var(--series-3)" isAnimationActive={false} />
                <Bar
                  dataKey="notSetPct"
                  stackId="a"
                  fill="var(--series-4)"
                  radius={[0, 4, 4, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            ) : (
              <BarChart data={rows} barCategoryGap={8} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
                <CartesianGrid vertical={false} stroke="var(--gridline)" strokeDasharray="0" />
                <XAxis
                  dataKey="name"
                  stroke="var(--baseline)"
                  tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--baseline)" }}
                />
                <YAxis
                  type="number"
                  domain={[0, 100]}
                  stroke="var(--baseline)"
                  tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  label={{
                    value: t.percentAxis,
                    angle: -90,
                    position: "insideLeft",
                    fill: "var(--text-muted)",
                    fontSize: 11,
                  }}
                />
                <Tooltip content={<TooltipContent t={t} />} cursor={{ fill: "var(--gridline)", opacity: 0.4 }} />
                <Bar dataKey="tenantPct" stackId="a" fill="var(--series-1)" isAnimationActive={false} />
                <Bar dataKey="landlordPct" stackId="a" fill="var(--series-2)" isAnimationActive={false} />
                <Bar dataKey="sharedPct" stackId="a" fill="var(--series-3)" isAnimationActive={false} />
                <Bar
                  dataKey="notSetPct"
                  stackId="a"
                  fill="var(--series-4)"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
