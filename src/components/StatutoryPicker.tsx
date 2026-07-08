"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { StatutoryOption } from "@/lib/db";
import type { Dictionary } from "@/lib/i18n";

function parseIds(param: string | null): string[] {
  return param ? param.split(",").filter(Boolean) : [];
}

function label(opt: StatutoryOption): string {
  return opt.sectionText || opt.chapterText || opt.lawText;
}

export function StatutoryPicker({ options, t }: { options: StatutoryOption[]; t: Dictionary }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");

  const includeIds = parseIds(searchParams.get("include"));
  const excludeIds = parseIds(searchParams.get("exclude"));

  const byId = useMemo(() => new Map(options.map((o) => [o.sectionId, o])), [options]);

  const grouped = useMemo(() => {
    const map = new Map<string, Map<string, StatutoryOption[]>>();
    for (const opt of options) {
      if (!map.has(opt.lawText)) map.set(opt.lawText, new Map());
      const chapters = map.get(opt.lawText)!;
      if (!chapters.has(opt.chapterText)) chapters.set(opt.chapterText, []);
      chapters.get(opt.chapterText)!.push(opt);
    }
    return map;
  }, [options]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return options.filter((o) => `${o.lawText} ${o.chapterText} ${o.sectionText}`.toLowerCase().includes(q));
  }, [options, query]);

  function applyIds(nextInclude: string[], nextExclude: string[]) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextInclude.length > 0) params.set("include", nextInclude.join(","));
    else params.delete("include");
    if (nextExclude.length > 0) params.set("exclude", nextExclude.join(","));
    else params.delete("exclude");
    router.push(`?${params.toString()}`);
  }

  function toggleInclude(id: string) {
    const nextInclude = includeIds.includes(id) ? includeIds.filter((x) => x !== id) : [...includeIds, id];
    applyIds(nextInclude, excludeIds.filter((x) => x !== id));
  }

  function toggleExclude(id: string) {
    const nextExclude = excludeIds.includes(id) ? excludeIds.filter((x) => x !== id) : [...excludeIds, id];
    applyIds(includeIds.filter((x) => x !== id), nextExclude);
  }

  function clearGroup(key: "include" | "exclude") {
    if (key === "include") applyIds([], excludeIds);
    else applyIds(includeIds, []);
  }

  const rowClass = "flex items-center justify-between gap-2 py-1 text-xs";
  const checkboxLabelClass = "flex w-16 shrink-0 items-center justify-center gap-1 text-[var(--text-muted)]";

  function Row({ opt }: { opt: StatutoryOption }) {
    return (
      <div className={rowClass}>
        <span className="flex-1 truncate text-[var(--text-secondary)]" title={`${opt.lawText} — ${opt.chapterText}`}>
          {label(opt)}
          <span className="text-[var(--text-muted)]"> ({opt.caseCount.toLocaleString(t.locale)})</span>
        </span>
        <label className={checkboxLabelClass}>
          <input
            type="checkbox"
            checked={includeIds.includes(opt.sectionId)}
            onChange={() => toggleInclude(opt.sectionId)}
            className="accent-[var(--series-1)]"
          />
        </label>
        <label className={checkboxLabelClass}>
          <input
            type="checkbox"
            checked={excludeIds.includes(opt.sectionId)}
            onChange={() => toggleExclude(opt.sectionId)}
            className="accent-[var(--series-2)]"
          />
        </label>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-3">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.statutorySearchPlaceholder}
        className="mb-2 w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
      />

      <div className="mb-1 flex items-center justify-between text-xs font-medium text-[var(--text-muted)]">
        <span />
        <span className="flex w-16 shrink-0 justify-center">{t.statutoryIncludeLabel}</span>
        <span className="flex w-16 shrink-0 justify-center">{t.statutoryExcludeLabel}</span>
      </div>

      <div className="max-h-64 overflow-y-auto border-t border-[var(--border)] pt-1">
        {filtered !== null ? (
          filtered.length > 0 ? (
            filtered.map((opt) => <Row key={opt.sectionId} opt={opt} />)
          ) : (
            <p className="py-2 text-xs text-[var(--text-muted)]">{t.statutoryNoMatch}</p>
          )
        ) : (
          Array.from(grouped.entries()).map(([lawText, chapters]) => (
            <details key={lawText} className="border-b border-[var(--border)] py-1 last:border-0">
              <summary className="cursor-pointer text-xs font-medium text-[var(--text-primary)]">
                {lawText}
              </summary>
              <div className="ml-3 mt-1">
                {Array.from(chapters.entries()).map(([chapterText, opts]) => (
                  <details key={chapterText || "_"} className="mb-1">
                    <summary className="cursor-pointer text-xs text-[var(--text-secondary)]">
                      {chapterText || lawText}
                    </summary>
                    <div className="ml-3">
                      {opts.map((opt) => (
                        <Row key={opt.sectionId} opt={opt} />
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </details>
          ))
        )}
      </div>

      {(includeIds.length > 0 || excludeIds.length > 0) && (
        <div className="mt-3 space-y-2 border-t border-[var(--border)] pt-2">
          {includeIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => clearGroup("include")}
                className="text-xs text-[var(--text-muted)] underline hover:text-[var(--text-primary)]"
              >
                {t.statutoryIncludeLabel}: {t.statutoryClear}
              </button>
              {includeIds.map((id) => {
                const opt = byId.get(id);
                if (!opt) return null;
                return (
                  <button
                    key={id}
                    onClick={() => toggleInclude(id)}
                    className="rounded-full bg-[var(--series-1)]/15 px-2 py-0.5 text-xs text-[var(--series-1)]"
                  >
                    {label(opt)} ×
                  </button>
                );
              })}
            </div>
          )}
          {excludeIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => clearGroup("exclude")}
                className="text-xs text-[var(--text-muted)] underline hover:text-[var(--text-primary)]"
              >
                {t.statutoryExcludeLabel}: {t.statutoryClear}
              </button>
              {excludeIds.map((id) => {
                const opt = byId.get(id);
                if (!opt) return null;
                return (
                  <button
                    key={id}
                    onClick={() => toggleExclude(id)}
                    className="rounded-full bg-[var(--series-2)]/15 px-2 py-0.5 text-xs text-[var(--series-2)]"
                  >
                    {label(opt)} ×
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {includeIds.length === 0 && excludeIds.length === 0 && (
        <p className="mt-3 border-t border-[var(--border)] pt-2 text-xs text-[var(--text-muted)]">
          {t.statutoryNoSelection}
        </p>
      )}
    </div>
  );
}
