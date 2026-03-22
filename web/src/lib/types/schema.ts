// Canonical internal schema format - all parsers produce this, all renderers consume this
export type ColType = 'int' | 'text' | 'float' | 'date' | 'datetime' | 'bool' | 'image' | 'json' | 'uuid' | string
export type Cardinality = '1-1' | '1-n' | 'n-n'
export type Modifier = 'primaryKey' | 'autoincrement' | 'required' | 'unique' | string // string for default:X

export interface ForeignKey {
  table: string
  column: string
}

export interface Column {
  name: string
  type: ColType
  modifiers: Modifier[]
  foreignKey: ForeignKey | null
  note?: string
}

export interface Table {
  name: string
  columns: Column[]
  // Canvas position (optional, set by layout)
  position?: { x: number; y: number }
  color?: string
  note?: string
}

export interface Link {
  from: { table: string; column: string }
  to: { table: string; column: string }
  cardinality: Cardinality
}

export interface Enum {
  name: string
  values: string[]
  note?: string
  position?: { x: number; y: number }
}

export interface Schema {
  tables: Table[]
  links: Link[]
  enums: Enum[]
}

export type InputLanguage = 'bdl' | 'sql' | 'prisma' | 'json' | 'unknown'

export interface ParseError {
  line: number
  column: number
  message: string
  suggestion?: string
}

export interface ParseResult {
  schema: Schema
  errors: ParseError[]
  language: InputLanguage
}

export interface AISuggestion {
  id: string
  from_table: string
  from_column: string
  to_table: string
  to_column: string
  cardinality: Cardinality
  confidence: 'high' | 'medium' | 'low'
  reason: string
  dismissed?: boolean
}

export interface AIHistoryEntry {
  id: string
  request: string
  bdlResult: string
  timestamp: number
}
