/**
 * Extract the set of correct-option letters from a question's answer field.
 *
 * The dataset uses several formats:
 *   - "b"                                  -> {b}
 *   - "A. tibialis posteriori..."         -> {a}
 *   - "a, c"                              -> {a, c}
 *   - "b ja d"                            -> {b, d}    (Estonian "and")
 *   - "a + c"                             -> {a, c}
 *   - "Both A and B are correct."         -> {a, b}    (heuristic on the head)
 *   - long prose without a leading letter -> {} (treat as flashcard)
 *
 * Only letters that actually exist in the question's choices map count.
 */
export function parseAnswerLetters(answer: string, validKeys: string[]): Set<string> {
  const result = new Set<string>();
  if (!answer) return result;
  const valid = new Set(validKeys.map((k) => k.toLowerCase()));
  if (valid.size === 0) return result;

  const trimmed = answer.trim().toLowerCase();
  if (trimmed.length === 0) return result;

  // 1) Pure single letter (with optional trailing punctuation): "b", "b.", "b)".
  const pure = trimmed.match(/^([a-z])(\s*[.)\]:\-]?\s*)$/);
  if (pure && valid.has(pure[1])) {
    result.add(pure[1]);
    return result;
  }

  // 2) Leading "X." or "X)" or "X:" — single letter at the start of a longer answer.
  const lead = trimmed.match(/^([a-z])\s*[.):\-]/);
  if (lead && valid.has(lead[1])) {
    result.add(lead[1]);
  }

  // 3) Explicit multi-letter pattern in the first ~80 chars.
  //    Examples: "a, c", "a + c", "a and c", "a ja c", "a & c"
  const head = trimmed.slice(0, 80);
  const multiPattern = /\b([a-z])\b\s*(?:,|\+|\sand\s|\sja\s|&)\s*\b([a-z])\b/g;
  let m: RegExpExecArray | null;
  let foundMulti = false;
  while ((m = multiPattern.exec(head)) != null) {
    if (valid.has(m[1])) result.add(m[1]);
    if (valid.has(m[2])) result.add(m[2]);
    foundMulti = true;
  }

  // 4) If still nothing matched, do a last-ditch single-letter look at
  //    the very first non-space character.
  if (result.size === 0) {
    const first = trimmed.charAt(0);
    if (valid.has(first)) {
      const next = trimmed.charAt(1);
      if (!next || /[\s.,;:)\]\-]/.test(next)) {
        result.add(first);
      }
    }
  }

  return result;
}
