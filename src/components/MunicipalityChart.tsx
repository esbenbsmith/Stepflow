"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MunicipalityAverage } from "@/lib/db";
import type { Dictionary } from "@/lib/i18n";

const BAR_SIZE = 14;
const ROW_HEIGHT = 22;

function formatDays(value: number): string {
  return `${value.toFixed(1)}d`;
}

function TooltipContent({
  active,
  payload,
  t,
}: {
  active?: boolean;
  payload?: { payload: MunicipalityAverage }[];
  t: Dictionary;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="inline-block h-[2px] w-3 rounded-full bg-[var(--series-1)]" />
        <span className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">
          {formatDays(row.avgDays)}
        </span>
      </div>
      <div className="mt-0.5 text-xs text-[var(--text-secondary)]">
        {row.municipalityName}
      </div>
      <div className="text-xs text-[var(--text-muted)]">
        {row.caseCount.toLocaleString(t.locale)} {t.tooltipDecisions}
      </div>
    </div>
  );
}

type SortMode = "desc" | "asc" | "alpha";

export function MunicipalityChart({
  data,
  t,
}: {
  data: MunicipalityAverage[];
  t: Dictionary;
}) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const [sortMode, setSortMode] = useState<SortMode>("desc");

  const sortedData = useMemo(() => {
    const arr = [...data];
    if (sortMode === "desc") arr.sort((a, b) => b.avgDays - a.avgDays);
    else if (sortMode === "asc") arr.sort((a, b) => a.avgDays - b.avgDays);
    else arr.sort((a, b) => a.municipalityName.localeCompare(b.municipalityName, t.locale));
    return arr;
  }, [data, sortMode, t.locale]);

  const { maxCode, minCode } = useMemo(() => {
    if (data.length === 0) return { maxCode: null, minCode: null };
    let maxRow = data[0];
    let minRow = data[0];
    for (const row of data) {
      if (row.avgDays > maxRow.avgDays) maxRow = row;
      if (row.avgDays < minRow.avgDays) minRow = row;
    }
    return { maxCode: maxRow.municipalityCode, minCode: minRow.municipalityCode };
  }, [data]);

  const chartHeight = Math.max(data.length * ROW_HEIGHT, 200);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          {t.chartHeading}
        </h2>
        <div className="flex items-center gap-4 text-xs">
          <label className="flex items-center gap-2 text-[var(--text-secondary)]">
            {t.sortLabel}
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="rounded border border-[var(--border)] bg-[var(--surface-1)] px-1.5 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              <option value="desc">{t.sortHighestFirst}</option>
              <option value="asc">{t.sortLowestFirst}</option>
              <option value="alpha">{t.sortAlpha}</option>
            </select>
          </label>
          <button
            onClick={() => setView("chart")}
            className={`border-b-2 px-1 pb-1 font-medium ${
              view === "chart"
                ? "border-[var(--accent)] text-[var(--text-primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {t.chartTab}
          </button>
          <button
            onClick={() => setView("table")}
            className={`border-b-2 px-1 pb-1 font-medium ${
              view === "table"
                ? "border-[var(--accent)] text-[var(--text-primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {t.tableTab}
          </button>
        </div>
      </div>

      {view === "chart" ? (
        <div
          className="max-h-[70vh] overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-2"
        >
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={sortedData}
              layout="vertical"
              barSize={BAR_SIZE}
              barCategoryGap={2}
              margin={{ top: 4, right: 40, bottom: 4, left: 4 }}
            >
              <CartesianGrid
                horizontal={false}
                stroke="var(--gridline)"
                strokeDasharray="0"
              />
              <XAxis
                type="number"
                stroke="var(--baseline)"
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "var(--baseline)" }}
                label={{
                  value: t.daysAxis,
                  position: "insideBottomRight",
                  offset: -2,
                  fill: "var(--text-muted)",
                  fontSize: 11,
                }}
              />
              <YAxis
                type="category"
                dataKey="municipalityName"
                width={170}
                stroke="var(--baseline)"
                tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval={0}
              />
              <Tooltip
                content={<TooltipContent t={t} />}
                cursor={{ fill: "var(--gridline)", opacity: 0.4 }}
              />
              <Bar dataKey="avgDays" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                {sortedData.map((entry) => (
                  <Cell
                    key={entry.municipalityCode}
                    fill="var(--series-1)"
                    opacity={
                      entry.municipalityCode === maxCode || entry.municipalityCode === minCode
                        ? 1
                        : 0.85
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="max-h-[70vh] overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface-1)]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[var(--surface-1)]">
              <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-muted)]">
                <th className="px-3 py-2 font-medium">{t.tableMunicipality}</th>
                <th className="px-3 py-2 font-medium text-right">{t.tableAvgDays}</th>
                <th className="px-3 py-2 font-medium text-right">{t.tableDecisions}</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row) => (
                <tr
                  key={row.municipalityCode}
                  className="border-b border-[var(--border)] last:border-0"
                >
                  <td className="px-3 py-1.5 text-[var(--text-primary)]">
                    {row.municipalityName}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-[var(--text-primary)]">
                    {formatDays(row.avgDays)}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-[var(--text-muted)]">
                    {row.caseCount.toLocaleString(t.locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
