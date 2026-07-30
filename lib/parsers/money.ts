/**
 * Parses a captured amount like "8,750,000" or "8.750.000,50" into a number.
 * Group separators are only removed when followed by exactly 3 digits
 * (thousands groups); a trailing separator followed by 1-2 digits is treated
 * as the decimal point. A naive `.replace(",", ".")` breaks on any amount
 * with more than one thousands group (anything ≥ 1,000,000) because it only
 * touches the first comma, leaving the rest of the string unparseable.
 */
export function parseMoneyString(raw: string): number {
  const normalized = raw.replace(/[.,](\d{3})/g, "$1").replace(",", ".");
  return Number(normalized);
}

const MONEY_PATTERN = /S\/\.?\s?([\d]{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?)/;

/** Finds the first "S/ <amount>" in text and parses it. */
export function findMoney(text: string): number | null {
  const match = text.match(MONEY_PATTERN);
  if (!match) return null;
  const value = parseMoneyString(match[1]);
  return Number.isFinite(value) ? value : null;
}

/** Finds the first "S/ <amount>" within `windowChars` after `anchorPattern` matches. */
export function findMoneyNear(text: string, anchorPattern: RegExp, windowChars = 120): number | null {
  const anchorMatch = text.match(anchorPattern);
  if (!anchorMatch || anchorMatch.index === undefined) return null;
  const window = text.slice(anchorMatch.index, anchorMatch.index + windowChars);
  const moneyMatch = window.match(MONEY_PATTERN);
  if (!moneyMatch) return null;
  const value = parseMoneyString(moneyMatch[1]);
  return Number.isFinite(value) ? value : null;
}
