#!/usr/bin/env node
/**
 * DataHarvest — Python → TypeScript type bridge
 *
 * Runs scripts/export_schema.py (Pydantic → JSON Schema) and feeds the
 * result through json-schema-to-typescript to produce
 * src/lib/types.generated.ts. Run via `npm run gen:types` or
 * `node scripts/cli.js gen-types`.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { compile } from 'json-schema-to-typescript'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..')
const OUT_FILE = path.join(REPO_ROOT, 'src', 'lib', 'types.generated.ts')

function resolvePython() {
  const win = process.platform === 'win32'
  const venvPython = path.join(REPO_ROOT, '.venv', win ? 'Scripts/python.exe' : 'bin/python')
  if (existsSync(venvPython)) return venvPython
  return win ? 'python' : 'python3'
}

/**
 * Pydantic gives every single field its own JSON Schema "title"
 * (e.g. "login_url" -> "Login Url"). json-schema-to-typescript turns any
 * titled sub-schema into its own named type alias, which both pollutes
 * the output (Id, Id1, Label, Label1, ...) and can silently collide
 * across unrelated models sharing a field name. Strip titles from every
 * node except the model roots themselves so only real model names get
 * exported; everything else inlines.
 */
function stripNestedTitles(schemaNode, isRoot = false) {
  if (schemaNode === null || typeof schemaNode !== 'object') return

  if (!isRoot) delete schemaNode.title

  if (schemaNode.properties) {
    for (const propSchema of Object.values(schemaNode.properties)) stripNestedTitles(propSchema, false)
  }
  if (schemaNode.items) stripNestedTitles(schemaNode.items, false)
  if (schemaNode.additionalProperties && typeof schemaNode.additionalProperties === 'object') {
    stripNestedTitles(schemaNode.additionalProperties, false)
  }
  for (const combiner of ['anyOf', 'oneOf', 'allOf']) {
    if (Array.isArray(schemaNode[combiner])) {
      for (const sub of schemaNode[combiner]) stripNestedTitles(sub, false)
    }
  }
  if (schemaNode.$defs) {
    for (const def of Object.values(schemaNode.$defs)) stripNestedTitles(def, true)
  }
}

function exportSchema() {
  const python = resolvePython()
  const result = spawnSync(python, [path.join(__dirname, 'export_schema.py')], {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
    maxBuffer: 32 * 1024 * 1024,
  })
  if (result.status !== 0) {
    console.error(result.stderr || result.error)
    process.exit(result.status ?? 1)
  }
  return JSON.parse(result.stdout)
}

async function main() {
  console.log('[gen-types] exporting Pydantic schemas...')
  const schema = exportSchema()
  stripNestedTitles(schema, true)
  const defs = schema.$defs ?? {}
  const names = Object.keys(defs).sort()

  console.log(`[gen-types] compiling ${names.length} models to TypeScript...`)

  let output = `/**
 * AUTO-GENERATED — DO NOT EDIT BY HAND.
 * Generated from backend Pydantic schemas (app/schemas/requests.py)
 * by scripts/gen-types.mjs. Run \`npm run gen:types\` to refresh.
 */

`

  const emitted = new Set()

  for (const name of names) {
    if (emitted.has(name)) continue
    const single = { ...defs[name], $defs: defs, title: name }
    const ts = await compile(single, name, {
      bannerComment: '',
      additionalProperties: false,
      unreachableDefinitions: false,
    })

    for (const block of ts.split(/\n(?=export )/)) {
      const match = block.match(/^export (?:interface|type|enum) (\w+)/)
      const blockName = match?.[1]
      if (blockName) {
        if (emitted.has(blockName)) continue
        emitted.add(blockName)
      }
      output += block.trimEnd() + '\n\n'
    }
  }

  writeFileSync(OUT_FILE, output, 'utf-8')
  console.log(`[gen-types] wrote ${emitted.size} types -> ${path.relative(REPO_ROOT, OUT_FILE)}`)
}

main().catch((err) => {
  console.error('[gen-types] failed:', err)
  process.exit(1)
})
