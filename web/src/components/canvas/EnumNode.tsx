'use client'

import { memo } from 'react'
import { NodeProps } from '@xyflow/react'
import { Enum } from '@/lib/types/schema'

export const EnumNode = memo(function EnumNode({ data, selected }: NodeProps) {
  const enumDef = data.enumDef as Enum

  return (
    <div
      className={`rounded-xl text-left cursor-default transition-all duration-300 ${selected ? 'z-50' : 'z-10'}`}
      style={{
        background: 'var(--bg-table)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: `1px solid ${selected ? 'var(--accent-secondary)' : 'var(--border-table)'}`,
        boxShadow: selected ? `0 0 0 1px var(--accent-secondary), 0 12px 32px rgba(0,0,0,0.6)` : 'var(--shadow-table)',
        minWidth: 180,
        transform: selected ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      {/* UML Enum Header */}
      <div
        className="flex flex-col px-4 py-3 rounded-t-xl items-center justify-center"
        style={{ 
          background: 'linear-gradient(135deg, rgba(0,191,255,0.15) 0%, transparent 100%)', 
          borderBottom: '1px solid rgba(0,191,255,0.15)' 
        }}
      >
        <span className="text-[9px] font-bold uppercase tracking-widest opacity-80 mb-0.5" style={{ color: 'var(--accent-secondary)' }}>«enumeration»</span>
        <span className="text-[14px] font-semibold tracking-tight drop-shadow-md" style={{ color: 'var(--text-primary)' }}>
          {enumDef.name}
        </span>
        {enumDef.note && (
          <div className="mt-1.5 text-[11px] italic opacity-80 text-center leading-tight" style={{ color: 'var(--accent-secondary)' }}>
            {enumDef.note}
          </div>
        )}
      </div>

      {/* Values */}
      <div className="py-1 rounded-b-xl overflow-hidden text-center" style={{ background: 'var(--bg-table-badge)' }}>
        {enumDef.values.map((val) => (
          <div
            key={val}
            className="px-4 py-2 text-[13px] font-mono tracking-tight transition-colors hover:bg-[var(--bg-table-hover)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            {val}
          </div>
        ))}
      </div>
    </div>
  )
})
