/** ISO 4217 fraction digits used to interpret stored minor units (`amount / 10^digits`). Defaults to 2. */
const MINOR_DIGITS: Record<string, number> = {
  CLP: 0,
  COP: 2,
  MXN: 2,
  USD: 2,
}

function minorToMajor(minorUnits: number, currencyCode: string) {
  const digits = MINOR_DIGITS[currencyCode] ?? 2
  return minorUnits / 10 ** digits
}

/** Format stored minor units with `Intl` for `currency` (ISO 4217); unknown codes fall back to major = minor/100. */
export function formatMinor(minorUnits: bigint | number | null | undefined, currency: string | null | undefined) {
  const n = typeof minorUnits === 'bigint' ? Number(minorUnits) : (minorUnits ?? 0)
  const code = (currency ?? 'USD').trim().slice(0, 3).toUpperCase() || 'USD'
  const major = minorToMajor(Number.isFinite(n) ? n : 0, code)
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: Math.min(MINOR_DIGITS[code] ?? 2, 4),
    }).format(major)
  } catch {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(major)
  }
}
