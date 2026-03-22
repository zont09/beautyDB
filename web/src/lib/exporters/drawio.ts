import { Schema } from '@/lib/types/schema'

export function exportToDrawIO(schema: Schema): string {
  const HEADER = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="${new Date().toISOString()}" agent="beautyDB" version="21.1.2" type="device">
  <diagram id="beautyDB-diagram" name="Database Schema">
    <mxGraphModel dx="1422" dy="798" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />`
  
  const FOOTER = `      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`

  let xml = HEADER
  let nextId = 2

  // Map to store table node IDs for linking
  const tableIdMap = new Map<string, number>()

  // 1. Render Tables
  schema.tables.forEach((table, index) => {
    const tableId = nextId++
    tableIdMap.set(table.name, tableId)
    
    // Position (simplistic grid if not set)
    const x = table.position?.x ?? (index % 3) * 300
    const y = table.position?.y ?? Math.floor(index / 3) * 400
    const height = 40 + (table.columns.length * 30)
    
    // Table Vertex
    xml += `
        <mxCell id="${tableId}" value="${table.name}" style="shape=table;startSize=30;container=1;collapsible=1;childLayout=tableLayout;fixedRows=1;rowLines=0;fontStyle=1;align=center;fillColor=#16161e;strokeColor=#00e5a0;fontColor=#ffffff;" vertex="1" parent="1">
          <mxGeometry x="${x}" y="${y}" width="200" height="${height}" as="geometry" />
        </mxCell>`

    // Render Columns inside table
    table.columns.forEach((col, colIdx) => {
      const colId = nextId++
      const rowY = 30 + (colIdx * 30)
      const isPK = col.modifiers.includes('primaryKey')
      const label = `${isPK ? '🔑 ' : ''}${col.name} : ${col.type}`
      
      xml += `
        <mxCell id="${colId}" value="${label}" style="shape=tableRow;horizontal=0;startSize=0;dashed=0;connectable=0;fillColor=none;strokeColor=none;fontColor=#9090b0;align=left;spacingLeft=10;" vertex="1" parent="${tableId}">
          <mxGeometry y="${rowY}" width="200" height="30" as="geometry" />
        </mxCell>`
    })
  })

  // 2. Render Links
  schema.links.forEach((link) => {
    const sourceId = tableIdMap.get(link.from.table)
    const targetId = tableIdMap.get(link.to.table)
    
    if (sourceId && targetId) {
      const edgeId = nextId++
      const label = link.cardinality
      
      xml += `
        <mxCell id="${edgeId}" value="${label}" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#00bfff;strokeWidth=2;fontColor=#00bfff;fontSize=10;" edge="1" parent="1" source="${sourceId}" target="${targetId}">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>`
    }
  })

  xml += FOOTER
  return xml
}
