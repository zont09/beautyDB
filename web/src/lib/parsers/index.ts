import { Schema, Column, Link, ParseResult, InputLanguage, ColType, Modifier } from '@/lib/types/schema'

// Detect input language from raw text
export function detectLanguage(input: string): InputLanguage {
  const trimmed = input.trim()
  if (!trimmed) return 'unknown'

  // BDL: starts with 'table' or 'link' or 'enum'
  if (/^\s*(table|link|enum)\s+\w/m.test(trimmed)) return 'bdl'

  // SQL: CREATE TABLE keyword
  if (/CREATE\s+TABLE\s+/i.test(trimmed)) return 'sql'

  // Prisma: model keyword
  if (/^\s*model\s+\w+\s*\{/m.test(trimmed)) return 'prisma'

  // JSON: starts with {
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json'

  return 'unknown'
}

function inferType(name: string): ColType {
  const l = name.toLowerCase()
  if (l.includes('id') && l !== 'id') return 'int'
  if (l.includes('price') || l.includes('amount') || l.includes('total') || l.includes('rate') || l.includes('rating')) return 'float'
  if (l.includes('date') || l.endsWith('_at') || l.endsWith('_on')) return 'datetime'
  if (l.includes('is_') || l.startsWith('is') || l.includes('active') || l.includes('enable') || l.includes('status') && l.includes('bool')) return 'bool'
  if (l.includes('image') || l.includes('photo') || l.includes('avatar') || l.includes('cover')) return 'image'
  if (l.includes('json') || l.includes('meta') || l.includes('data') || l.includes('config')) return 'json'
  if (l === 'id') return 'int'
  return 'text'
}

// Parse BDL (beautyDB Language) input
export function parseBDL(input: string): ParseResult {
  const schema: Schema = { tables: [], links: [], enums: [] }
  const errors: ParseResult['errors'] = []

  const lines = input.split('\n')
  let inTable = false
  let inEnum = false
  let currentTable: Schema['tables'][0] | null = null
  let currentEnum: Schema['enums'][0] | null = null
  let lineNum = 0

  for (const rawLine of lines) {
    lineNum++
    const line = rawLine.replace(/\/\/.*$/, '').trim() // strip comments
    if (!line) continue

    // table declaration
    const tableMatch = line.match(/^table\s+(\w+)\s*\{?$/)
    if (tableMatch) {
      if (currentTable) schema.tables.push(currentTable)
      if (currentEnum) schema.enums.push(currentEnum)
      currentTable = { name: tableMatch[1], columns: [] }
      inTable = true
      inEnum = false
      continue
    }

    // enum declaration
    const enumMatch = line.match(/^enum\s+(\w+)\s*\{?$/)
    if (enumMatch) {
      if (currentTable) schema.tables.push(currentTable)
      if (currentEnum) schema.enums.push(currentEnum)
      currentEnum = { name: enumMatch[1], values: [] }
      inEnum = true
      inTable = false
      continue
    }

    // opening brace (separate line)
    if (line === '{') continue

    // closing brace
    if (line === '}') {
      if (currentTable) {
        schema.tables.push(currentTable)
        currentTable = null
      }
      if (currentEnum) {
        schema.enums.push(currentEnum)
        currentEnum = null
      }
      inTable = false
      inEnum = false
      continue
    }

    // note declaration: note "something"
    const noteMatch = line.match(/^note\s+"([^"]+)"$/)
    if (noteMatch) {
      const noteContent = noteMatch[1]
      if (inTable && currentTable) currentTable.note = noteContent
      else if (inEnum && currentEnum) currentEnum.note = noteContent
      continue
    }

    // link declaration: link A 1-n B [through C]
    const linkMatch = line.match(/^link\s+(\w+)\s+(1-1|1-n|n-n)\s+(\w+)(?:\s+through\s+(\w+))?$/)
    if (linkMatch) {
      const [, fromTable, cardinality, toTable] = linkMatch
      // Find FK column - column in toTable that references fromTable
      schema.links.push({
        from: { table: fromTable, column: 'id' },
        to: { table: toTable, column: `${fromTable.toLowerCase()}_id` },
        cardinality: cardinality as Link['cardinality'],
      })
      continue
    }

    // column definition inside table
    if (inTable && currentTable) {
      // * id autoincrement text required unique default:X -> Table
      const isPK = line.startsWith('*')
      let colLine = isPK ? line.slice(1).trim() : line

      let colNote: string | undefined
      // Extract note:"..." or note:'...' before further processing
      const colNoteMatch = colLine.match(/note:\s*["']([^"']+)["']/)
      if (colNoteMatch) {
        colNote = colNoteMatch[1]
        colLine = colLine.replace(colNoteMatch[0], '').trim()
      }

      // FK: name -> Table
      const fkMatch = colLine.match(/^(\w+)\s*->\s*(\w+)(?:\s+(.*))?$/)
      if (fkMatch) {
        const [, colName, targetTable, rest] = fkMatch
        const mods: Modifier[] = rest ? parseModifiers(rest) : []
        currentTable.columns.push({
          name: colName,
          type: 'int',
          modifiers: ['required', ...mods],
          foreignKey: { table: targetTable, column: 'id' },
          note: colNote
        })
        // Auto-create link
        schema.links.push({
          from: { table: currentTable.name, column: colName },
          to: { table: targetTable, column: 'id' },
          cardinality: '1-n',
        })
        continue
      }

      // Normal column: name [type] [modifiers...]
      const parts = colLine.split(/\s+/)
      const colName = parts[0]
      if (!colName) continue

      let colType: ColType = 'text'
      let startMod = 1

      const knownModifiers = ['primaryKey', 'autoincrement', 'required', 'unique']
      const isModifier = (s: string) => knownModifiers.includes(s) || s.startsWith('default:')

      if (parts[1] && !isModifier(parts[1])) {
        // Must be a type (either known type or Custom Enum)
        colType = parts[1]
        startMod = 2
      } else {
        colType = inferType(colName)
      }

      const mods: Modifier[] = []
      if (isPK) mods.push('primaryKey')
      mods.push(...parseModifiers(parts.slice(startMod).join(' ')))

      currentTable.columns.push({
        name: colName,
        type: colType,
        modifiers: mods,
        foreignKey: null,
        note: colNote
      })
      continue
    }

    // enum value definition
    if (inEnum && currentEnum) {
      const parts = line.split(/\s+/)
      const valName = parts[0]
      if (valName) currentEnum.values.push(valName)
      continue
    }

    // Unknown line
    if (line && !line.startsWith('//')) {
      errors.push({ line: lineNum, column: 0, message: `Unexpected: ${line}`, suggestion: 'Check BDL syntax' })
    }
  }

  // Push last open table/enum
  if (currentTable) schema.tables.push(currentTable)
  if (currentEnum) schema.enums.push(currentEnum)

  // Deduplicate links
  const seen = new Set<string>()
  schema.links = schema.links.filter((l) => {
    const key = `${l.from.table}.${l.from.column}->${l.to.table}.${l.to.column}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // Ensure every table has a PK column
  for (const table of schema.tables) {
    const hasPK = table.columns.some((c) => c.modifiers.includes('primaryKey'))
    if (!hasPK && !table.columns.find((c) => c.name === 'id')) {
      table.columns.unshift({ name: 'id', type: 'int', modifiers: ['primaryKey', 'autoincrement'], foreignKey: null })
    }
  }

  return { schema, errors, language: 'bdl' }
}

function parseModifiers(str: string): Modifier[] {
  if (!str) return []
  const mods: Modifier[] = []
  const words = str.split(/\s+/).filter(Boolean)
  for (const w of words) {
    if (w === 'required' || w === 'unique' || w === 'autoincrement') mods.push(w)
    else if (w.startsWith('default:')) mods.push(w)
  }
  return mods
}

// SQL Parser - basic CREATE TABLE support
export function parseSQL(input: string): ParseResult {
  const schema: Schema = { tables: [], links: [], enums: [] }
  const errors: ParseResult['errors'] = []

  // Remove SQL comments
  const cleaned = input
    .replace(/--[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')

  // Match CREATE TABLE blocks
  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?(\w+)[`"']?\s*\(([\s\S]*?)\);?/gi
  let match

  while ((match = tableRegex.exec(cleaned)) !== null) {
    const tableName = match[1]
    const body = match[2]
    const table: Schema['tables'][0] = { name: tableName, columns: [] }

    const colDefs = body.split(',').map((s) => s.trim()).filter(Boolean)

    for (const def of colDefs) {
      // Skip table-level constraints
      if (/^\s*(PRIMARY\s+KEY|UNIQUE|INDEX|KEY|CONSTRAINT|FOREIGN\s+KEY)\s*\(/i.test(def)) {
        // Parse FK constraint
        const fkMatch = def.match(/FOREIGN\s+KEY\s*\((\w+)\)\s*REFERENCES\s+(\w+)\s*\((\w+)\)/i)
        if (fkMatch) {
          const [, col, refTable, refCol] = fkMatch
          const existing = table.columns.find((c) => c.name === col)
          if (existing) existing.foreignKey = { table: refTable, column: refCol }
          schema.links.push({
            from: { table: tableName, column: col },
            to: { table: refTable, column: refCol },
            cardinality: '1-n',
          })
        }
        continue
      }

      // Column definition: name TYPE [constraints...]
      const colMatch = def.match(/^[`"']?(\w+)[`"']?\s+(\w+(?:\s*\(\s*\d+(?:\s*,\s*\d+)?\s*\))?)/i)
      if (!colMatch) continue

      const colName = colMatch[1].toLowerCase() === colMatch[1] ? colMatch[1] : colMatch[1]
      const sqlType = colMatch[2].toUpperCase()

      const colType: ColType = mapSQLType(sqlType)
      const mods: Modifier[] = []

      if (/PRIMARY\s+KEY/i.test(def)) mods.push('primaryKey')
      if (/AUTO_INCREMENT|AUTOINCREMENT|SERIAL/i.test(def)) mods.push('autoincrement')
      if (/NOT\s+NULL/i.test(def)) mods.push('required')
      if (/\bUNIQUE\b/i.test(def)) mods.push('unique')

      const defaultMatch = def.match(/DEFAULT\s+([^\s,]+)/i)
      if (defaultMatch) mods.push(`default:${defaultMatch[1]}`)

      // Inline FK
      let fk = null
      const inlineFk = def.match(/REFERENCES\s+(\w+)\s*\((\w+)\)/i)
      if (inlineFk) {
        fk = { table: inlineFk[1], column: inlineFk[2] }
        schema.links.push({
          from: { table: tableName, column: colName },
          to: { table: inlineFk[1], column: inlineFk[2] },
          cardinality: '1-n',
        })
      }

      table.columns.push({ name: colName, type: colType, modifiers: mods, foreignKey: fk })
    }

    schema.tables.push(table)
  }

  // Deduplicate links
  const seen = new Set<string>()
  schema.links = schema.links.filter((l) => {
    const key = `${l.from.table}.${l.from.column}->${l.to.table}.${l.to.column}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return { schema, errors, language: 'sql' }
}

function mapSQLType(sqlType: string): ColType {
  const t = sqlType.toUpperCase()
  if (/INT|INTEGER|BIGINT|SMALLINT|TINYINT|SERIAL/.test(t)) return 'int'
  if (/FLOAT|DOUBLE|DECIMAL|NUMERIC|REAL/.test(t)) return 'float'
  if (/DATE/.test(t) && !/TIME/.test(t)) return 'date'
  if (/DATETIME|TIMESTAMP/.test(t)) return 'datetime'
  if (/BOOL|BOOLEAN|TINYINT\(1\)/.test(t)) return 'bool'
  if (/JSON|JSONB/.test(t)) return 'json'
  if (/UUID/.test(t)) return 'uuid'
  return 'text'
}

// Parse any input format
export function parseInput(input: string): ParseResult {
  const lang = detectLanguage(input)
  switch (lang) {
    case 'bdl': return parseBDL(input)
    case 'sql': return parseSQL(input)
    default: return { schema: { tables: [], links: [], enums: [] }, errors: [], language: lang }
  }
}
