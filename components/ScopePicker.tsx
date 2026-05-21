"use client";

import { useEffect, useState } from "react";
import { CheckSquare, Square } from "lucide-react";
import type { Lang } from "@/lib/progress";
import { t } from "@/lib/i18n";
import type { IndexFile, SectionId } from "@/lib/types";
import { ALL_SECTIONS } from "@/lib/types";
import { SECTION_LABELS, SECTION_ACCENT } from "@/lib/sections";
import { loadIndex } from "@/lib/data";

interface Props {
  lang: Lang;
  scope: SectionId[];
  onChange: (scope: SectionId[]) => void;
  onContinue?: () => void;
  continueLabel?: string;
}

export function ScopePicker({ lang, scope, onChange, onContinue, continueLabel }: Props) {
  const [stats, setStats] = useState<IndexFile["stats"] | null>(null);

  useEffect(() => {
    loadIndex().then((i) => setStats(i.stats));
  }, []);

  const toggle = (s: SectionId) => {
    if (scope.includes(s)) onChange(scope.filter((x) => x !== s));
    else onChange([...scope, s]);
  };
  const all = scope.length === ALL_SECTIONS.length;
  const totalQs = stats
    ? ALL_SECTIONS.filter((s) => scope.includes(s)).reduce((acc, s) => acc + stats[s].total, 0)
    : 0;
  const totalMC = stats
    ? ALL_SECTIONS.filter((s) => scope.includes(s)).reduce((acc, s) => acc + stats[s].mc, 0)
    : 0;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-ut-navy">{t(lang, "scope.title")}</h2>
        <p className="text-sm text-slate-600 mt-1">{t(lang, "scope.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ALL_SECTIONS.map((s) => {
          const selected = scope.includes(s);
          const stat = stats?.[s];
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggle(s)}
              className={`text-left rounded-xl border p-3 transition flex items-start gap-3 ${
                selected
                  ? "border-ut-medium bg-white shadow-card"
                  : "border-slate-200 bg-white/60 hover:border-ut-medium/60"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-md bg-gradient-to-br ${SECTION_ACCENT[s]} text-white grid place-items-center shrink-0`}
              >
                {selected ? <CheckSquare size={18} /> : <Square size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-ut-navy">{SECTION_LABELS[s][lang]}</div>
                {stat && (
                  <div className="text-xs text-slate-500 mt-0.5">
                    {stat.total} {t(lang, "scope.questions")} · {stat.mc} {t(lang, "scope.mc")}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange(all ? [] : [...ALL_SECTIONS])}
            className="text-sm px-3 py-1.5 rounded-md border border-slate-200 hover:bg-white"
          >
            {all ? t(lang, "scope.none") : t(lang, "scope.all")}
          </button>
          {stats && scope.length > 0 && (
            <span className="text-xs text-slate-500">
              {totalQs} {t(lang, "scope.questions")} · {totalMC} {t(lang, "scope.mc")}
            </span>
          )}
        </div>
        {onContinue && (
          <button
            type="button"
            disabled={scope.length === 0}
            onClick={onContinue}
            className="px-4 py-2 rounded-md bg-ut-dark text-white text-sm font-medium hover:bg-ut-navy disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {continueLabel ?? t(lang, "scope.continue")}
          </button>
        )}
      </div>
    </div>
  );
}
