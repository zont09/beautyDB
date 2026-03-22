'use client'

import { memo, useState } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { Key, Link, ChevronDown, ChevronUp } from 'lucide-react'
import { Table, Column } from '@/lib/types/schema'
import { useSchemaStore } from '@/lib/store/schema-store'

interface TableNodeData {
  table: Table
  viewMode: 'full' | 'compact' | 'names' | 'uml'
  isSelected?: boolean
}

const TYPE_COLORS: Record<string, string> = {
  int: '#00bfff', text: '#00e5a0', float: '#ff9500', date: '#e879f9',
  datetime: '#e879f9', bool: '#fbbf24', image: '#a78bfa', json: '#f97316', uuid: '#00bfff',
}

const COL_ACCENT_CLASSES: Record<string, string> = {
  primaryKey: 'badge-orange',
  required: 'badge-red',
  unique: 'badge-blue',
  autoincrement: 'badge-green',
}

function ColumnRow({ col, viewMode }: { col: Column; viewMode: string }) {
  const isPK = col.modifiers.includes('primaryKey')
  const isFK = col.foreignKey !== null

  const { setHoveredTable, schema } = useSchemaStore()
  const [showTooltip, setShowTooltip] = useState(false)

  const enumDef = schema.enums?.find(e => e.name === col.type)
  const hasTooltipInfo = isFK || col.note || enumDef

  if (viewMode === 'names') return null // hidden in names mode

  return (
    <div
      className={`relative flex items-center gap-2.5 px-4 py-2 border-t transition-colors group border-t-0`}
      style={{ borderColor: 'var(--border-table)', backgroundColor: isPK ? 'var(--bg-table-hover)' : 'transparent' }}
      onMouseEnter={() => {
        if (isFK) setHoveredTable(col.foreignKey!.table)
        setShowTooltip(true)
      }}
      onMouseLeave={() => {
        if (isFK) setHoveredTable(null)
        setShowTooltip(false)
      }}
    >
      {/* PK / FK icon */}
      <span className="w-4 flex-shrink-0 flex items-center justify-center">
        {isPK ? (
          <Key size={10} style={{ color: 'var(--accent-warning)' }} />
        ) : isFK ? (
          <Link size={10} style={{ color: 'var(--accent-secondary)' }} />
        ) : (
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: 'var(--border-hover)' }} />
        )}
      </span>

      {/* Name */}
      <span className="flex-1 truncate text-[13px] font-mono tracking-tight" style={{ color: isPK ? 'var(--accent-warning)' : isFK ? 'var(--accent-secondary)' : 'var(--text-primary)', fontWeight: isPK || isFK ? 600 : 400 }}>
        {col.name}
      </span>

      {/* Type badge */}
      {viewMode === 'full' && (
        <span
          className="ml-auto text-right text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0"
          style={{ 
            color: TYPE_COLORS[col.type] ?? 'var(--text-muted)',
            backgroundColor: `${TYPE_COLORS[col.type] ?? '#888'}15`,
            border: `1px solid ${TYPE_COLORS[col.type] ?? '#888'}30`
          }}
        >
          {col.type}
        </span>
      )}

      {/* Tooltip Overlay */}
      {showTooltip && hasTooltipInfo && (
        <div 
          className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 z-50 rounded-md p-3 w-56 pointer-events-none"
          style={{ 
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-md), 0 0 0 1px rgba(0,229,160,0.1)' 
          }}
        >
          {col.note && (
            <div className="italic mb-2 text-xs leading-relaxed border-b pb-2" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
              {col.note}
            </div>
          )}
          {isFK && (
            <div className="flex flex-col text-xs font-medium" style={{ color: 'var(--accent-primary)' }}>
              <span className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>References</span>
              <span>{col.foreignKey!.table}.<span style={{ color: 'var(--text-primary)' }}>{col.foreignKey!.column}</span></span>
            </div>
          )}
          {enumDef && (
            <div className={isFK || col.note ? 'mt-3 border-t pt-2' : ''} style={{ borderColor: 'var(--border)' }}>
              <div className="text-[10px] uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1" style={{ color: 'var(--accent-secondary)' }}>
                Enum <span className="capitalize px-1.5 py-0.5 rounded" style={{ color: 'var(--text-muted)', background: 'var(--bg-table-hover)' }}>{enumDef.name}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {enumDef.values.map(v => (
                  <span key={v} className="border rounded px-1.5 py-0.5 text-[10px]" style={{ background: 'var(--bg-table-hover)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                    {v}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Color palette for table headers based on name hash
function getTableColor(name: string): string {
  const colors = [
    '#00e5a0', '#00bfff', '#ff9500', '#e879f9', '#f97316', '#22d3ee', '#84cc16',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function TableNodeComponent({ data, selected }: NodeProps) {
  const { table, viewMode } = data as unknown as TableNodeData
  const accentColor = getTableColor(table.name)
  const [collapsed, setCollapsed] = useState(false)
  const { hoveredTable } = useSchemaStore()

  const showCols = viewMode !== 'names' && !collapsed
  const isHoveredTarget = hoveredTable === table.name

  return (
    <div
      className={`rounded-xl text-left cursor-default transition-all duration-300 ${isHoveredTarget ? 'z-50' : 'z-10'}`}
      style={{
        background: 'var(--bg-table)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: `1px solid ${selected ? accentColor : isHoveredTarget ? 'var(--accent-primary)' : 'var(--border-table)'}`,
        boxShadow: selected ? `0 0 0 1px ${accentColor}40, var(--shadow-md)` : isHoveredTarget ? `0 0 0 3px var(--accent-primary), 0 0 40px rgba(0,229,160,0.3)` : 'var(--shadow-table)',
        minWidth: 220,
        maxWidth: 300,
        transform: isHoveredTarget ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      {/* Source + Target handles */}
      <Handle type="target" position={Position.Left} style={{ background: accentColor, width: 8, height: 8, border: 'none', left: -4 }} />
      <Handle type="source" position={Position.Right} style={{ background: accentColor, width: 8, height: 8, border: 'none', right: -4 }} />

      {/* Header */}
      <div
        className="flex flex-col px-4 py-3 rounded-t-xl"
        style={{ 
          background: `linear-gradient(135deg, ${accentColor}25 0%, transparent 100%)`, 
          borderBottom: `1px solid ${accentColor}20` 
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: accentColor, boxShadow: `0 0 10px ${accentColor}` }} />
            <span className="text-[14px] font-semibold tracking-tight truncate drop-shadow-md" style={{ color: 'var(--text-primary)' }}>
              {table.name}
            </span>
          </div>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="opacity-40 hover:opacity-80 transition-opacity"
            style={{ color: 'var(--text-secondary)' }}
          >
            {collapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          </button>
        </div>
        {table.note && !collapsed && (
          <div className="mt-2 text-[11px] italic leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {table.note}
          </div>
        )}
      </div>

      {/* Columns */}
      {showCols && (
        <div className={viewMode === 'uml' ? 'px-2 py-2 rounded-b-xl' : 'rounded-b-xl overflow-hidden'} style={{ background: viewMode === 'uml' ? 'var(--bg-table-hover)' : 'transparent' }}>
          {table.columns.map((col) => (
            viewMode === 'uml' ? (
              <div key={col.name} className="px-2 py-0.5 font-mono text-[11px] flex items-center hover:bg-[var(--bg-table-hover)] transition-colors" style={{ color: 'var(--text-secondary)' }}>
                <span className="mr-1.5 w-3 text-center" style={{ color: 'var(--text-muted)' }}>
                  {col.modifiers.includes('primaryKey') ? '#' : '+'}
                </span>
                <span 
                  style={{ 
                    color: col.modifiers.includes('primaryKey') ? 'var(--text-primary)' : 'inherit',
                    textDecoration: col.modifiers.includes('primaryKey') ? 'underline' : 'none'
                  }}
                >
                  {col.name}
                </span>
                <span className="text-gray-400 mx-1.5">:</span>
                <span style={{ color: TYPE_COLORS[col.type] ?? 'var(--text-muted)' }}>{col.type}</span>
                {col.foreignKey && (
                  <span className="text-gray-500 ml-2 text-[10px]">➔ {col.foreignKey.table}</span>
                )}
              </div>
            ) : (
              <ColumnRow key={col.name} col={col} viewMode={viewMode ?? 'full'} />
            )
          ))}
        </div>
      )}

      {/* Footer: col count when collapsed */}
      {collapsed && (
        <div className="px-4 py-2 text-[10px] rounded-b-xl" style={{ color: 'var(--text-muted)', background: 'var(--bg-table-badge)' }}>
          {table.columns.length} columns
        </div>
      )}
    </div>
  )
}

export const TableNode = memo(TableNodeComponent)
