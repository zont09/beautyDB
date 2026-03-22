import dagre from '@dagrejs/dagre'
import { Schema } from '@/lib/types/schema'

export interface LayoutNode {
  id: string
  x: number
  y: number
  width: number
  height: number
}

const NODE_WIDTH = 240

export function computeLayout(schema: Schema): Record<string, { x: number; y: number }> {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  
  // Advanced Dagre settings for cleaner ERD layout
  g.setGraph({ 
    rankdir: 'LR', 
    nodesep: 80,    // Vertical space between nodes
    ranksep: 250,   // Horizontal space between layers
    edgesep: 40,    // Space between edges
    marginx: 40,
    marginy: 40
  })

  for (const table of schema.tables) {
    // Height depends on number of columns
    const height = Math.max(80, 48 + table.columns.length * 28)
    g.setNode(table.name, { width: NODE_WIDTH, height })
  }

  const addedEdges = new Set<string>()
  for (const link of schema.links) {
    const edgeKey = `${link.from.table}->${link.to.table}`
    if (!addedEdges.has(edgeKey) && g.hasNode(link.from.table) && g.hasNode(link.to.table)) {
      g.setEdge(link.from.table, link.to.table)
      addedEdges.add(edgeKey)
    }
  }

  dagre.layout(g)

  const positions: Record<string, { x: number; y: number }> = {}
  g.nodes().forEach((name) => {
    const node = g.node(name)
    positions[name] = {
      x: node.x - node.width / 2,
      y: node.y - node.height / 2,
    }
  })

  return positions
}
