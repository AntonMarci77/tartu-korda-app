"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, Sparkles } from "lucide-react";
import { ScopePicker } from "@/components/ScopePicker";
import { Card } from "@/components/Card";
import type { Lang } from "@/lib/progress";
import { loadProgress, loadSettings, saveSettings, setCardState } from "@/lib/progress";
import { t } from "@/lib/i18n";
import { loadSections, interleaveBySection } from "@/lib/data";
import { setActiveScope } from "@/lib/scope";
import { applyGrade, isWeak } from "@/lib/scheduler";
import type { Grade, Question, SectionId } from "@/lib/types";

type Phase = "scope" | "card" | "done";

export default function WeakPage() {
  const [lang, setLang] = useState<Lang>("et");
  const [scope, setScope] = useState<SectionId[]>([]);
  const [queue, setQueue] = useState<Question[]>([]);
  const [phase, setPhase] = useState<Phase>("scope");

  useEffect(() => {
    const s = loadSettings();
    setLang(s.uiLang);
    setScope(s.lastScope.length ? s.lastScope : []);
  }, []);

  const start = async () => {
    setActiveScope(scope);
    saveSettings({ ...loadSettings(), lastScope: scope });
    const all = await loadSections(scope);
    const progress = loadProgress();
    const weak = all.filter((q) => isWeak(progress[q.id] ?? null));
    setQueue(interleaveBySection(weak));
    setPhase(weak.length === 0 ? "done" : "card");
  };

  const onGrade = (g: Grade) => {
    if (queue.length === 0) return;
    const [head, ...rest] = queue;
    const prev = loadProgress()[head.id] ?? null;
    const next = applyGrade(prev, g);
    setCardState(head.id, next);
    let newQueue = rest;
    if (g === "again") {
      const insertAt = Math.min(rest.length, 3);
      newQueue = [...rest.slice(0, insertAt), head, ...rest.slice(insertAt)];
    }
    if (newQueue.length === 0) setPhase("done");
    setQueue(newQueue);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-ut-navy">{t(lang, "nav.weak")}</h1>
        <Link
          href="/"
          className="text-sm text-ut-dark hover:text-ut-navy inline-flex items-center gap-1"
        >
          <ArrowLeft size={14} /> {t(lang, "nav.home")}
        </Link>
      </header>

      {phase === "scope" && (
        <>
          <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-900 px-3 py-2 text-sm flex items-center gap-2">
            <AlertTriangle size={14} />
            {lang === "et"
              ? "Toob ainult need kaardid, mida oled valesti vastanud või madalalt hinnanud."
              : "Pulls only cards you've missed or rated low."}
          </div>
          <ScopePicker
            lang={lang}
            scope={scope}
            onChange={setScope}
            onContinue={start}
            continueLabel={t(lang, "card.start")}
          />
        </>
      )}

      {phase === "card" && queue.length > 0 && (
        <>
          <div className="text-xs text-slate-500 px-1">
            {queue.length} {t(lang, "scope.questions")}
          </div>
          <Card
            lang={lang}
            question={queue[0]}
            showUnverified={loadSettings().showUnverified}
            onGrade={onGrade}
          />
        </>
      )}

      {phase === "done" && (
        <div className="rounded-2xl bg-white shadow-card border border-slate-100 p-6 text-center">
          <Sparkles className="mx-auto text-ut-orange mb-2" size={28} />
          <h2 className="text-xl font-semibold text-ut-navy">{t(lang, "weak.empty.title")}</h2>
          <p className="text-sm text-slate-600 mt-2">{t(lang, "weak.empty.body")}</p>
          <div className="mt-4 flex justify-center gap-2">
            <Link
              href="/learn"
              className="px-4 py-2 rounded-md bg-ut-dark text-white text-sm hover:bg-ut-navy"
            >
              {t(lang, "nav.learn")}
            </Link>
            <button
              onClick={() => setPhase("scope")}
              className="px-4 py-2 rounded-md border border-slate-200 text-sm hover:bg-slate-50"
            >
              {t(lang, "scope.title")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
