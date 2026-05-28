/**
 * Format a single term for Google Trends interestOverTime keyword.
 */

/** @param {string} term */
export function formatSearchTerm(term) {
  const t = term.trim();
  if (!t) return "";
  if (t.includes('"')) return t;
  if (/\s/.test(t)) return `"${t}"`;
  return t;
}
