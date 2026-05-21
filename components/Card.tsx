"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  Check,
  Eye,
  SkipForward,
  X,
  CircleDot,
} from "lucide-react";
import type { Lang } from "@/lib/progress";
import { t } from "@/lib/i18n";
import type { Grade, Question } from "@/lib/types";
import { SECTION_LABELS } from "@/lib/sections";
import { parseAnswerLetters } from "@/lib/parseAnswer";

interface Props {
  lang: Lang;
  question: Question;
  showUnverified: boolean;
  onGrade: (g: Grade) => void;
  onSkip?: () => void;
}

const GRADE_BTNS: { g: Grade; key: string; cls: string; clsHi: string }[] = [
  {
    g: "again",
    key: "card.grade.again",
    cls: "bg-rose-50 text-rose-800 hover:bg-rose-100 border-rose-200",
    clsHi: "bg-rose-200 text-rose-900 border-rose-400 ring-2 ring-rose-300",
  },
  {
    g: "hard",
    key: "card.grade.hard",
    cls: "bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-200",
    clsHi: "bg-amber-200 text-amber-900 border-amber-400 ring-2 ring-amber-300",
  },
  {
    g: "good",
    key: "card.grade.good",
    cls: "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200",
    clsHi: "bg-emerald-200 text-emerald-900 border-emerald-400 ring-2 ring-emerald-300",
  },
  {
    g: "easy",
    key: "card.grade.easy",
    cls: "bg-sky-50 text-sky-800 hover:bg-sky-100 border-sky-200",
    clsHi: "bg-sky-200 text-sky-900 border-sky-400 ring-2 ring-sky-300",
  },
];

type Result = "correct" | "partial" | "wrong";

function evaluatePicks(picked: Set<string>, correct: Set<string>): Result {
  if (picked.size === 0) return "wrong";
  if (picked.size === correct.size) {
    for (const p of picked) if (!correct.has(p)) return "wrong";
    return "correct";
  }
  // Any overlap counts as partial; otherwise wrong.
  for (const p of picked) if (correct.has(p)) return "partial";
  return "wrong";
}

export function Card({ lang, question, showUnverified, onGrade, onSkip }: Props) {
  const [phase, setPhase] = useState<"writing" | "choosing" | "graded">("writing");
  const [recall, setRecall] = useState("");
  const [picks, setPicks] = useState<Set<string>>(new Set());

  // Reset when the card changes
  useEffect(() => {
    setPhase("writing");
    setRecall("");
    setPicks(new Set());
  }, [question.id]);

  const choiceKeys = useMemo(
    () => Object.keys(question.choices ?? {}).sort(),
    [question],
  );
  const correctSet = useMemo(
    () => parseAnswerLetters(question.answer, choiceKeys),
    [question, choiceKeys],
  );
  const isAutoGradable = correctSet.size > 0 && choiceKeys.length > 0;
  const longAnswer = question.answer && question.answer.trim().length > 20;
  const result: Result | null = phase === "graded" && isAutoGradable
    ? evaluatePicks(picks, correctSet)
    : null;

  const togglePick = (k: string) => {
    if (phase !== "choosing") return;
    setPicks((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const advance = () => {
    if (phase === "writing") {
      // MC: go to the option-picking step. Open question: skip straight to graded.
      setPhase(isAutoGradable ? "choosing" : "graded");
    } else if (phase === "choosing") {
      setPhase("graded");
    }
  };

  // Keyboard: space/enter to advance phase, 1-4 to grade once graded.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
        return;
      if ((phase === "writing" || phase === "choosing") && (e.key === "Enter" || e.key === " ")) {
        if (phase === "choosing" && picks.size === 0) return;
        e.preventDefault();
        advance();
      } else if (phase === "graded") {
        if (e.key === "1") onGrade("again");
        else if (e.key === "2") onGrade("hard");
        else if (e.key === "3") onGrade("good");
        else if (e.key === "4") onGrade("easy");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, onGrade, picks.size, isAutoGradable]);

  const suggestedGrade: Grade =
    result === "correct" ? "good" : result === "partial" ? "hard" : "again";

  return (
    <article className="rounded-2xl bg-white shadow-card border border-slate-100 p-5 sm:p-6 tap-highlight-none">
      <header className="flex items-center justify-between gap-2 mb-3">
        <div className="text-xs uppercase tracking-wider text-ut-medium font-semibold">
          {SECTION_LABELS[question.section][lang]}
        </div>
        <div className="flex items-center gap-2">
          {question.needs_review && showUnverified && (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 rounded-md px-1.5 py-0.5">
              <AlertTriangle size={11} /> {t(lang, "card.unverified")}
            </span>
          )}
          {!isAutoGradable && (
            <span className="text-[10px] uppercase tracking-wider text-slate-400">
              {t(lang, "card.flashcard.label")}
            </span>
          )}
          {question.source_count > 1 && (
            <span className="text-[10px] uppercase tracking-wider text-slate-500">
              {question.source_count} {t(lang, "card.sources")}
            </span>
          )}
        </div>
      </header>

      <h2 className="text-lg sm:text-xl font-semibold text-ut-navy leading-snug whitespace-pre-line">
        {question.question}
      </h2>

      <div className="mt-4">
        <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
          {phase === "writing" ? t(lang, "card.recall.prompt") : t(lang, "card.your.recall")}
        </label>
        <textarea
          value={recall}
          onChange={(e) => setRecall(e.target.value)}
          placeholder={t(lang, "card.recall.placeholder")}
          readOnly={phase !== "writing"}
          rows={3}
          className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm resize-y ${
            phase !== "writing"
              ? "border-slate-200 bg-slate-50 text-slate-700"
              : "border-slate-200 focus:border-ut-dark"
          }`}
        />
      </div>

      {isAutoGradable && phase !== "writing" && (
        <div className="mt-4">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">
            {t(lang, "card.choose")}
          </div>
          <ul className="space-y-2">
            {choiceKeys.map((k) => {
              const isPicked = picks.has(k);
              const isCorrect = correctSet.has(k);
              const showState = phase === "graded";
              let cls = "border-slate-200 bg-white hover:border-ut-medium/60";
              let badge: React.ReactNode = null;
              if (showState) {
                if (isCorrect && isPicked) {
                  cls = "border-emerald-300 bg-emerald-50";
                  badge = (
                    <Check
                      size={14}
                      className="text-emerald-600 shrink-0"
                      aria-label="correct"
                    />
                  );
                } else if (isCorrect && !isPicked) {
                  cls = "border-amber-300 bg-amber-50";
                  badge = (
                    <CircleDot
                      size={14}
                      className="text-amber-600 shrink-0"
                      aria-label="missed"
                    />
                  );
                } else if (!isCorrect && isPicked) {
                  cls = "border-rose-300 bg-rose-50";
                  badge = (
                    <X size={14} className="text-rose-600 shrink-0" aria-label="wrong" />
                  );
                } else {
                  cls = "border-slate-200 bg-white text-slate-500";
                }
              } else if (isPicked) {
                cls = "border-ut-dark bg-ut-light/20";
              }
              return (
                <li key={k}>
                  <button
                    type="button"
                    onClick={() => togglePick(k)}
                    disabled={phase === "graded"}
                    className={`w-full text-left flex items-start gap-3 rounded-lg border p-3 text-sm transition ${cls} ${phase === "graded" ? "cursor-default" : ""}`}
                  >
                    <span
                      className={`shrink-0 w-6 h-6 rounded-md grid place-items-center font-bold text-xs ${
                        isPicked && phase === "choosing"
                          ? "bg-ut-dark text-white"
                          : showState && isCorrect
                            ? "bg-emerald-500 text-white"
                            : showState && isPicked && !isCorrect
                              ? "bg-rose-500 text-white"
                              : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {k.toUpperCase()}
                    </span>
                    <span className="flex-1">{question.choices[k]}</span>
                    {badge}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {phase === "writing" && (
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={advance}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-ut-dark text-white text-sm font-medium hover:bg-ut-navy transition"
          >
            <Eye size={16} />
            {isAutoGradable
              ? t(lang, "card.reveal.options")
              : t(lang, "card.reveal.open")}
          </button>
          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-slate-200 text-sm hover:bg-slate-50"
            >
              <SkipForward size={16} /> {t(lang, "card.skip")}
            </button>
          )}
        </div>
      )}

      {phase === "choosing" && (
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={advance}
            disabled={picks.size === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-ut-dark text-white text-sm font-medium hover:bg-ut-navy transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check size={16} /> {t(lang, "card.submit")}
          </button>
        </div>
      )}

      {phase === "graded" && (
        <div className="mt-5 space-y-4">
          {isAutoGradable && result && (
            <div
              className={`rounded-lg border px-3 py-2 text-sm font-semibold inline-flex items-center gap-2 ${
                result === "correct"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : result === "partial"
                    ? "bg-amber-50 border-amber-200 text-amber-800"
                    : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              {result === "correct" ? (
                <Check size={14} />
              ) : result === "partial" ? (
                <CircleDot size={14} />
              ) : (
                <X size={14} />
              )}
              {result === "correct"
                ? t(lang, "card.result.correct")
                : result === "partial"
                  ? t(lang, "card.result.partial")
                  : t(lang, "card.result.wrong")}
            </div>
          )}

          {longAnswer && (
            <div className="rounded-lg bg-ut-light/10 border border-ut-light/40 p-3 text-sm text-ut-navy">
              <div className="text-[10px] uppercase tracking-wider text-ut-dark font-semibold mb-1 flex items-center gap-1.5">
                <BookOpen size={11} /> {t(lang, "card.explanation")}
              </div>
              <div className="whitespace-pre-line leading-relaxed">{question.answer}</div>
            </div>
          )}

          {!isAutoGradable && !longAnswer && question.answer && (
            <div className="rounded-lg bg-ut-light/10 border border-ut-light/40 p-3 text-sm text-ut-navy">
              <div className="text-[10px] uppercase tracking-wider text-ut-dark font-semibold mb-1">
                {t(lang, "card.correct.answer")}
              </div>
              <div className="whitespace-pre-line leading-relaxed">{question.answer}</div>
            </div>
          )}

          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
              {t(lang, "card.grade.hint")}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {GRADE_BTNS.map((b, i) => {
                const highlighted = isAutoGradable && b.g === suggestedGrade;
                return (
                  <button
                    key={b.g}
                    type="button"
                    onClick={() => onGrade(b.g)}
                    className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                      highlighted ? b.clsHi : b.cls
                    }`}
                  >
                    <div>{t(lang, b.key)}</div>
                    <div className="text-[10px] opacity-60 mt-0.5">{i + 1}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
