'use client'

import { useCallback, useEffect } from 'react'
import { ReactFlow, Controls, useNodesState, Node } from '@xyflow/react'
import { useSchemaStore } from '@/lib/store/schema-store'
import { EnumNode } from './EnumNode'
import '@xyflow/react/dist/style.css'

const nodeTypes = { enumNode: EnumNode }

export function EnumView() {
  const store = useSchemaStore()
  const { schema, updateEnumPosition } = store
  const enums = schema.enums || []

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])

  useEffect(() => {
    const newNodes: Node[] = enums.map((en, idx) => {
      let pos = en.position
      if (!pos) {
        pos = { x: 50 + (idx % 4) * 250, y: 50 + Math.floor(idx / 4) * 200 }
      }
      return {
        id: en.name,
        type: 'enumNode',
        position: pos,
        data: { enumDef: en },
      }
    })
    setNodes(newNodes)
  }, [schema.enums, setNodes])

  const onNodeDragStop = useCallback(
    (_: unknown, node: Node) => {
      updateEnumPosition(node.id, node.position.x, node.position.y)
    },
    [updateEnumPosition]
  )

  if (enums.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 select-none w-full" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-6xl opacity-10">≡</div>
        <div className="text-center">
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No enums defined</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Type `enum Role {"{"} Admin User {"}"}` in the editor</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative" style={{ background: 'var(--bg-primary)' }}>
      <ReactFlow
        nodes={nodes}
        onNodesChange={onNodesChange}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
      >
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
