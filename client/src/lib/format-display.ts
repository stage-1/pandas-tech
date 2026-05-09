/**
 * Display-only formatting helpers — pure functions, no DB writes.
 */

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(' ')
}

/** Returns a title-cased "Make Model" string, or empty string if both are absent. */
export function formatMakeModel(
  make?: string | null,
  model?: string | null,
): string {
  return [make, model]
    .filter(Boolean)
    .map((s) => toTitleCase(s!))
    .join(' ')
}
