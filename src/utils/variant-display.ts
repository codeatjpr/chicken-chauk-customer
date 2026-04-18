/** Mirrors backend `variant-display.ts` for consistent labels in the app. */

function unitSuffix(unit: string): string {
  switch (unit) {
    case 'GRAMS':
      return 'g'
    case 'KG':
      return 'kg'
    case 'PIECES':
      return 'pc'
    case 'DOZEN':
      return 'dz'
    default:
      return unit
  }
}

/** e.g. "500 g", "1 kg" for 1000 g — never "1000GRAMS". */
export function formatVariantWeightAndUnit(weight: number, unit: string): string {
  if (unit === 'GRAMS' && weight >= 1000) {
    const kg = weight / 1000
    const kgStr = Number.isInteger(kg) ? String(kg) : kg.toFixed(2).replace(/\.?0+$/, '')
    return `${kgStr} kg`
  }
  const wStr = Number.isInteger(weight) ? String(weight) : String(weight)
  return `${wStr} ${unitSuffix(unit)}`
}

/** e.g. "Curry Cut · 1 kg" */
export function formatVariantNameWithWeight(
  name: string,
  weight: number,
  unit: string,
): string {
  return `${name} · ${formatVariantWeightAndUnit(weight, unit)}`
}
