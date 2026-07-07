"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { MunicipalityOption } from "@/lib/db";
import type { Dictionary } from "@/lib/i18n";

export function FiltersBar({
  years,
  municipalities,
  decisiveBoards,
  t,
}: {
  years: string[];
  municipalities: MunicipalityOption[];
  decisiveBoards: string[];
  t: Dictionary;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`);
  }

  const selectClass =
    "rounded border border-[var(--border)] bg-[var(--surface-1)] px-2 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]";

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
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

      <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
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

      <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
        {t.decisiveBoardLabel}
        <select
          className={selectClass}
          value={searchParams.get("board") ?? ""}
          onChange={(e) => setParam("board", e.target.value)}
        >
          <option value="">{t.allDecisiveBoards}</option>
          {decisiveBoards.map((board) => (
            <option key={board} value={board}>
              {t.boardLabels[board] ?? board}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
