/**
 * Colombian property cards print make as free text: "NISSAN-PATHFINDER R50",
 * "CHEVROLET SPARK", "MERCEDES BENZ C200", etc. This utility normalises those
 * strings to the exact entries in the MAKES list so the vehicle form picker
 * can auto-select the right value.
 *
 * Returns null when no confident match is found — callers should fall back to
 * allowCustom on the picker rather than silently dropping the value.
 */

const MAKE_ALIASES: Record<string, string> = {
  // spacing / punctuation variants
  'MERCEDES BENZ':  'MERCEDES-BENZ',
  'MERCEDES':       'MERCEDES-BENZ',
  'ROLLS ROYCE':    'ROLLS-ROYCE',
  'LAND':           'LAND ROVER',
  'ALFA':           'ALFA ROMEO',
  // abbreviations
  'VW':             'VOLKSWAGEN',
  // Chinese brand name variations on CO cards
  'GREAT WALL':     'GWM',
  'GRAND WALL':     'GWM',
  'GREATWALL':      'GWM',
}

/**
 * @param raw   The make string extracted from the property card (any case).
 * @param makes The MAKES array from vehicle-data.ts.
 * @returns     The matching entry from `makes`, or null if no match found.
 */
export function normalizeMake(raw: string, makes: string[]): string | null {
  const upper   = raw.trim().toUpperCase()
  const makeSet = new Set(makes)

  // 1. exact match — handles "LAND ROVER", "ALFA ROMEO", "MERCEDES-BENZ", etc.
  if (makeSet.has(upper)) return upper

  // 2. alias on full string — "MERCEDES BENZ" → "MERCEDES-BENZ"
  const fullAlias = MAKE_ALIASES[upper]
  if (fullAlias && makeSet.has(fullAlias)) return fullAlias

  // 3. strip model suffix split on first hyphen: "NISSAN-PATHFINDER R50" → "NISSAN"
  const beforeHyphen = upper.split('-')[0].trim()
  if (beforeHyphen !== upper) {
    if (makeSet.has(beforeHyphen)) return beforeHyphen
    const hyphenAlias = MAKE_ALIASES[beforeHyphen]
    if (hyphenAlias && makeSet.has(hyphenAlias)) return hyphenAlias
  }

  // 4. first space-delimited word: "CHEVROLET SPARK" → "CHEVROLET"
  const firstWord = upper.split(' ')[0]
  if (firstWord !== upper) {
    if (makeSet.has(firstWord)) return firstWord
    const wordAlias = MAKE_ALIASES[firstWord]
    if (wordAlias && makeSet.has(wordAlias)) return wordAlias
  }

  return null
}
