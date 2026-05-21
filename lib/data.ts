import type { IndexFile, Question, SectionFile, SectionId } from "./types";
import { ALL_SECTIONS } from "./types";

let cache: Partial<Record<SectionId, Question[]>> = {};
let indexCache: IndexFile | null = null;

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return (await res.json()) as T;
}

export async function loadIndex(): Promise<IndexFile> {
  if (indexCache) return indexCache;
  indexCache = await fetchJSON<IndexFile>("/data/index.json");
  return indexCache;
}

export async function loadSection(section: SectionId): Promise<Question[]> {
  if (cache[section]) return cache[section]!;
  const file = await fetchJSON<SectionFile>(`/data/${section}.json`);
  cache[section] = file.questions;
  return file.questions;
}

export async function loadSections(sections: SectionId[]): Promise<Question[]> {
  const arrays = await Promise.all(sections.map(loadSection));
  return arrays.flat();
}

export async function loadAll(): Promise<Question[]> {
  return loadSections(ALL_SECTIONS);
}

/**
 * Fisher-Yates with a seeded PRNG for reproducible interleave per session.
 */
export function shuffle<T>(arr: T[], seed: number = Date.now()): T[] {
  const out = arr.slice();
  let s = seed | 0;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) | 0;
    const r = Math.abs(s) % (i + 1);
    [out[i], out[r]] = [out[r], out[i]];
  }
  return out;
}

/**
 * Interleave by section: round-robin pick one from each scoped section.
 * Preserves the within-section MC-first / most-repeated-first order.
 */
export function interleaveBySection(questions: Question[]): Question[] {
  const buckets = new Map<SectionId, Question[]>();
  for (const q of questions) {
    if (!buckets.has(q.section)) buckets.set(q.section, []);
    buckets.get(q.section)!.push(q);
  }
  const keys = Array.from(buckets.keys());
  const out: Question[] = [];
  let added = true;
  while (added) {
    added = false;
    for (const k of keys) {
      const b = buckets.get(k)!;
      if (b.length > 0) {
        out.push(b.shift()!);
        added = true;
      }
    }
  }
  return out;
}
