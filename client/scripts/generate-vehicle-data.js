#!/usr/bin/env node
// Usage: node scripts/generate-vehicle-data.js <path-to-makes_and_models.json>
// Output: src/lib/vehicle-data.ts

const fs = require('fs')
const path = require('path')

const src = process.argv[2] || path.join(__dirname, '../../..', 'makes_and_models.json')
const out = path.join(__dirname, '../src/lib/vehicle-data.ts')

const data = JSON.parse(fs.readFileSync(src, 'utf8'))

const makes = data.map((m) => m.make_name).sort()

const modelsByMake = {}
const yearRangeByMake = {}

data.forEach((m) => {
  modelsByMake[m.make_name] = Object.keys(m.models).sort()
  yearRangeByMake[m.make_name] = { first: m.first_year, last: m.last_year }
})

const content = `// Generated from makes_and_models.json — do not edit manually.
// Re-generate: node scripts/generate-vehicle-data.js <path-to-json>

export const MAKES: string[] = ${JSON.stringify(makes, null, 2)}

export const MODELS_BY_MAKE: Record<string, string[]> = ${JSON.stringify(modelsByMake, null, 2)}

export const YEAR_RANGE_BY_MAKE: Record<string, { first: number; last: number }> = ${JSON.stringify(yearRangeByMake, null, 2)}
`

fs.writeFileSync(out, content)
console.log(`Wrote ${out} (${content.length} bytes)`)
