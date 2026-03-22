'use client'

import { useCallback, useEffect, useState, memo } from 'react'
import {
  ReactFlow, Controls, MiniMap,
  useNodesState, useEdgesState,
  MarkerType, Node, Edge
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useSchemaStore } from '@/lib/store/schema-store'
import { computeLayout } from '@/lib/layout/dagre-layout'
import { TableNode } from './TableNode'
import { Schema, Cardinality, AISuggestion } from '@/lib/types/schema'
import { LayoutGrid, Sparkles, Loader2, Check } from 'lucide-react'

type ViewMode = 'full' | 'compact' | 'names' | 'uml'

const nodeTypes = { tableNode: TableNode }

function getEdgeStyle(cardinality: Cardinality) {
  const styles: Record<Cardinality, { stroke: string; strokeDasharray?: string }> = {
    '1-1': { stroke: 'var(--line-one-one)' },
    '1-n': { stroke: 'var(--line-one-many)' },
    'n-n': { stroke: 'var(--line-many-many)', strokeDasharray: '5 3' },
  }
  return styles[cardinality] ?? styles['1-n']
}

function schemaToFlow(schema: Schema, viewMode: ViewMode) {
  if (schema.tables.length === 0) return { nodes: [], edges: [] }

  const layout = computeLayout(schema)

  const nodes: Node[] = schema.tables.map((table) => ({
    id: table.name,
    type: 'tableNode',
    position: table.position ?? layout[table.name] ?? { x: 0, y: 0 },
    data: { table, viewMode },
    selectable: true,
  }))

  const edgeSeen = new Set<string>()
  const edges: Edge[] = []

  for (const link of schema.links) {
    const edgeId = `${link.from.table}__${link.from.column}__${link.to.table}`
    if (edgeSeen.has(edgeId)) continue
    edgeSeen.add(edgeId)
    if (!schema.tables.find((t) => t.name === link.from.table)) continue
    if (!schema.tables.find((t) => t.name === link.to.table)) continue

    const style = getEdgeStyle(link.cardinality)

    edges.push({
      id: edgeId,
      source: link.from.table,
      target: link.to.table,
      type: 'smoothstep', // Orthogonal routing looks much cleaner for ERD
      label: viewMode === 'uml' 
        ? (link.cardinality === '1-1' ? '1' : link.cardinality === '1-n' ? '1..*' : '*..*')
        : (link.cardinality === '1-1' ? '1:1' : link.cardinality === '1-n' ? '1:N' : 'N:N'),
      labelStyle: { fontSize: 10, fill: viewMode === 'uml' ? '#aaa' : style.stroke, fontWeight: viewMode === 'uml' ? 500 : 700 },
      labelBgStyle: { fill: 'var(--bg-panel)', fillOpacity: viewMode === 'uml' ? 0.7 : 0.9, rx: 4, ry: 4 },
      labelBgPadding: [6, 4],
      style: { stroke: viewMode === 'uml' ? '#555' : style.stroke, strokeWidth: viewMode === 'uml' ? 1.5 : 2, strokeDasharray: style.strokeDasharray },
      markerEnd: link.cardinality !== 'n-n' ? { type: MarkerType.ArrowClosed, color: viewMode === 'uml' ? '#555' : style.stroke, width: 14, height: 14 } : undefined,
      animated: false,
    })
  }
  return { nodes, edges }
}

export function ERDCanvas() {
  const store = useSchemaStore()
  const { schema, updateTablePosition, rawInput, setRawInput, setAISuggestions, aiSuggestions } = store
  
  const [viewMode, setViewMode] = useState<ViewMode>('full')
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  const [isAiLoading, setIsAiLoading] = useState(false)
  const [showAiModal, setShowAiModal] = useState(false)

  // Recompute when schema changes
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = schemaToFlow(schema, viewMode)
    setNodes(newNodes)
    setEdges(newEdges)
  }, [schema, viewMode])

  const onNodeDragStop = useCallback(
    (_: unknown, node: Node) => {
      updateTablePosition(node.id, node.position.x, node.position.y)
    },
    [updateTablePosition]
  )

  const handleRelayout = useCallback(() => {
    const layout = computeLayout(schema)
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        position: layout[n.id] ?? n.position,
      }))
    )
  }, [schema, setNodes])

  const handleAiSuggest = async () => {
    if (schema.tables.length < 2) return
    setIsAiLoading(true)
    try {
      const res = await fetch('/api/ai/suggest-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schema })
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Failed to get suggestions from AI.')
      } else if (data.suggestions && data.suggestions.length > 0) {
        setAISuggestions(data.suggestions)
        setShowAiModal(true)
      } else {
        alert('AI did not find any new missing connections.')
      }
    } catch (e) {
      console.error(e)
      alert('Failed to connect to AI logic.')
    }
    setIsAiLoading(false)
  }

  const applyAiSuggestion = (sug: AISuggestion) => {
    // Append link directly to BDL input
    const newLinkStr = `\nlink ${sug.from_table} ${sug.cardinality} ${sug.to_table}`
    setRawInput(rawInput + newLinkStr)
    store.dismissSuggestion(sug.id)
  }

  const isEmpty = schema.tables.length === 0

  return (
    <div className="relative w-full h-full" style={{ background: 'var(--bg-primary)' }}>
      {isEmpty ? (
        <EmptyState />
      ) : (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.1}
          maxZoom={3}
          attributionPosition="bottom-left"
        >
          <Controls showInteractive={false} />
          <MiniMap
            nodeColor={(n) => {
              const table = schema.tables.find((t) => t.name === n.id)
              return table ? '#00e5a0' : '#333'
            }}
            maskColor="rgba(10,10,15,0.7)"
            style={{ bottom: 60 }}
          />
        </ReactFlow>
      )}

      {/* Toolbar */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1.5 rounded-full z-10"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}
      >
        {(['full', 'compact', 'names', 'uml'] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className="btn btn-ghost text-[11px] capitalize px-3 py-1"
            style={{
              color: viewMode === mode ? 'var(--accent-primary)' : 'var(--text-muted)',
              background: viewMode === mode ? 'rgba(0,229,160,0.08)' : 'transparent',
            }}
          >
            {mode}
          </button>
        ))}
        
        <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 4px' }} />
        
        <button onClick={handleRelayout} className="btn btn-ghost text-[11px] px-3 py-1 text-white border border-[#3a3a50]">
          <LayoutGrid size={12} /> Auto Layout
        </button>

        <button 
          onClick={handleAiSuggest} 
          disabled={isAiLoading || isEmpty}
          className="btn text-[11px] px-3 py-1 ml-1"
          style={{ 
            background: 'linear-gradient(45deg, #00e5a0, #00bfff)', 
            color: '#000', 
            border: 'none',
            opacity: isEmpty ? 0.5 : 1
          }}
        >
          {isAiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
          AI Auto-Link
        </button>
      </div>

      {/* AI Suggestions Modal Floating */}
      {showAiModal && aiSuggestions.filter(s => !s.dismissed).length > 0 && (
        <div className="absolute top-16 right-6 w-80 bg-[#16161e] border border-[#2a2a38] rounded-lg shadow-2xl p-4 z-20 animate-in">
          <div className="flex items-center justify-between mb-3 border-b border-[#2a2a38] pb-2">
            <h3 className="text-[12px] font-bold text-[#00e5a0] uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={14} /> AI Found Links
            </h3>
            <button onClick={() => setShowAiModal(false)} className="text-gray-500 hover:text-white">✕</button>
          </div>
          <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
            {aiSuggestions.filter(s => !s.dismissed).map(sug => (
              <div key={sug.id} className="p-3 bg-[#1e1e28] rounded border border-[#2a2a38] group">
                <div className="flex justify-between items-start mb-1">
                  <div className="text-[12px] font-mono font-medium text-white">
                    {sug.from_table}.<span className="text-[#00bfff]">{sug.from_column}</span>
                    <span className="text-gray-500 mx-1">→</span>
                    {sug.to_table} <span className="text-[#ff9500] text-[10px]">({sug.cardinality})</span>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 mb-2 leading-relaxed">{sug.reason}</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => applyAiSuggestion(sug)}
                    className="flex-1 bg-[rgba(0,229,160,0.1)] hover:bg-[rgba(0,229,160,0.2)] text-[#00e5a0] border border-[#00e5a0]/30 py-1 rounded text-[11px] font-medium transition-colors"
                  >
                    Add Link
                  </button>
                  <button 
                    onClick={() => store.dismissSuggestion(sug.id)}
                    className="px-3 bg-transparent hover:bg-white/5 text-gray-400 border border-gray-700 py-1 rounded text-[11px] transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 select-none">
      <div className="text-6xl opacity-10">⬡</div>
      <div className="text-center">
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No schema yet</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Paste BDL or SQL in the editor →</p>
      </div>
    </div>
  )
}
