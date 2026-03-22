'use client'

import { useState } from 'react'
import { SchemaEditor } from '@/components/editor/SchemaEditor'
import { ERDCanvas } from '@/components/canvas/ERDCanvas'
import { EnumView } from '@/components/canvas/EnumView'
import { Database, ListTree, Sun, Moon, Download, Image as ImageIcon, FileText, Share2 } from 'lucide-react'
import { toPng, toSvg } from 'html-to-image'
import { exportToSQL, exportToBDL, exportToPrisma, exportToDrawIO, generateDocxReport } from '@/lib/exporters'
import { useSchemaStore } from '@/lib/store/schema-store'
import { saveAs } from 'file-saver'

export default function Page() {
  const [activeTab, setActiveTab] = useState<'tables' | 'enums'>('tables')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [showExportMenu, setShowExportMenu] = useState(false)
  const { schema, setRawInput, rawInput } = useSchemaStore()

  const toggleTheme = () => {
    const t = theme === 'dark' ? 'light' : 'dark'
    setTheme(t)
    document.documentElement.setAttribute('data-theme', t)
  }

  const handleExport = async (format: 'png' | 'svg' | 'drawio' | 'report') => {
    console.log(`[beautyDB] Starting export: ${format}`)
    const el = document.querySelector('.react-flow') as HTMLElement
    setShowExportMenu(false)

    if (!el && (format === 'png' || format === 'svg' || format === 'report')) {
      alert("Canvas element not found. Please make sure the diagram is visible.")
      return
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const baseFilename = `beautyDB-schema-${timestamp}`

    try {
      if (format === 'png' || format === 'svg') {
        console.log(`[beautyDB] Generating ${format}...`)
        await new Promise(r => setTimeout(r, 200))

        const dataUrl = await (format === 'png' ? toPng : toSvg)(el, {
          backgroundColor: theme === 'dark' ? '#0a0a0f' : '#f2f2f7',
          pixelRatio: 2,
          cacheBust: true,
          style: {
            transform: 'scale(1)',
            width: el.offsetWidth + 'px',
            height: el.offsetHeight + 'px',
          }
        })

        if (!dataUrl || dataUrl.length < 500) {
          throw new Error("Export failed: The generated image is empty or invalid.")
        }

        saveAs(dataUrl, `${baseFilename}.${format}`)
        console.log(`[beautyDB] ${format} download triggered via file-saver.`)
      } else if (format === 'drawio') {
        console.log(`[beautyDB] Generating drawio XML...`)
        const xml = exportToDrawIO(schema)
        const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' })
        saveAs(blob, `${baseFilename}.drawio.xml`)
        console.log(`[beautyDB] drawio download triggered via file-saver.`)
      } else if (format === 'report') {
        console.log(`[beautyDB] Generating DOCX report...`)
        const diagramPng = await toPng(el, {
          backgroundColor: theme === 'dark' ? '#0a0a0f' : '#f2f2f7',
          pixelRatio: 1.5,
        })
        const docxBlob = await generateDocxReport(schema, diagramPng)
        saveAs(docxBlob, `${baseFilename}-Report.docx`)
        console.log(`[beautyDB] DOCX report download triggered via file-saver.`)
      }
    } catch (e) {
      console.error("[beautyDB] Export Error:", e)
      alert("Failed to export: " + (e instanceof Error ? e.message : String(e)))
    }
  }

  return (
    <main className="flex h-screen w-screen overflow-hidden text-sm" style={{ background: 'var(--bg-primary)' }}>
      {/* 25% Left Editor Panel */}
      <div className="w-1/4 h-full border-r z-20" style={{ borderColor: 'var(--border)' }}>
        <SchemaEditor />
      </div>

      {/* 75% Right Canvas Area */}
      <div className="w-3/4 h-full relative">
        
        {/* Header Bar Overlaid on Canvas */}
        <div className="absolute top-0 left-0 right-0 h-14 flex items-center justify-between px-6 z-10 pointer-events-none">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-[#00e5a0]" />
            <span className="font-bold tracking-tight text-white pointer-events-auto">beautyDB</span>
          </div>
          
          {/* Main View Tabs */}
          <div className="flex bg-[#16161e] p-1 rounded-lg border border-[#2a2a38] pointer-events-auto shadow-md">
            <button 
              onClick={() => setActiveTab('tables')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[12px] font-medium transition-colors ${activeTab === 'tables' ? 'bg-[#1e1e28] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Database size={14} /> Tables
            </button>
            <button 
              onClick={() => setActiveTab('enums')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[12px] font-medium transition-colors ${activeTab === 'enums' ? 'bg-[#1e1e28] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <ListTree size={14} /> Enums
            </button>
          </div>

          <div className="flex gap-2 pointer-events-auto">
            <button 
              onClick={toggleTheme}
              className="btn btn-ghost px-2"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            <div className="relative">
              <button onClick={() => setShowExportMenu(!showExportMenu)} className="btn btn-ghost">
                <Download size={14} /> Export
              </button>
              
              {showExportMenu && (
                <div 
                  className="absolute right-0 top-full mt-2 w-48 rounded-lg py-2 z-50 shadow-2xl animate-in"
                  style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }}
                >
                  <div className="px-3 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Image</div>
                  <button onClick={() => handleExport('png')} className="w-full text-left px-3 py-1.5 transition-colors text-[12px] flex items-center gap-2 hover:bg-[var(--bg-elevated)]" style={{ color: 'var(--text-primary)' }}>
                    <ImageIcon size={14} className="text-[#00e5a0]" /> Save PNG
                  </button>
                  <button onClick={() => handleExport('svg')} className="w-full text-left px-3 py-1.5 transition-colors text-[12px] flex items-center gap-2 hover:bg-[var(--bg-elevated)]" style={{ color: 'var(--text-primary)' }}>
                    <ImageIcon size={14} className="text-[#00bfff]" /> Save SVG
                  </button>
                  
                  <div className="h-px bg-white/5 my-1 mx-2" />
                  <div className="px-3 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Diagram Tools</div>
                  <button onClick={() => handleExport('drawio')} className="w-full text-left px-3 py-1.5 transition-colors text-[12px] flex items-center gap-2 hover:bg-[var(--bg-elevated)]" style={{ color: 'var(--text-primary)' }}>
                    <Share2 size={14} className="text-[#ff9500]" /> Export draw.io (XML)
                  </button>
                  
                  <div className="h-px bg-white/5 my-1 mx-2" />
                  <div className="px-3 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Document</div>
                  <button onClick={() => handleExport('report')} className="w-full text-left px-3 py-1.5 transition-colors text-[14px] font-semibold flex items-center gap-2 hover:bg-[var(--bg-elevated)]" style={{ color: 'var(--accent-primary)' }}>
                    <FileText size={16} /> Download Report (DOCX)
                  </button>
                </div>
              )}
            </div>

            <button className="btn btn-primary">Share</button>
          </div>
        </div>

        {/* View Content */}
        {activeTab === 'tables' ? <ERDCanvas /> : <EnumView />}
        
      </div>
    </main>
  )
}
