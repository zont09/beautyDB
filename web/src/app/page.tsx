'use client'

import { useState } from 'react'
import { SchemaEditor } from '@/components/editor/SchemaEditor'
import { ERDCanvas } from '@/components/canvas/ERDCanvas'
import { EnumView } from '@/components/canvas/EnumView'
import { Database, ListTree, Sun, Moon, Download, Image as ImageIcon } from 'lucide-react'
import { toPng, toSvg } from 'html-to-image'

export default function Page() {
  const [activeTab, setActiveTab] = useState<'tables' | 'enums'>('tables')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [showExportMenu, setShowExportMenu] = useState(false)

  const toggleTheme = () => {
    const t = theme === 'dark' ? 'light' : 'dark'
    setTheme(t)
    document.documentElement.setAttribute('data-theme', t)
  }

  const handleExport = async (format: 'png' | 'svg') => {
    const el = document.querySelector('.react-flow') as HTMLElement
    if (!el) {
      alert("No canvas found to export")
      return
    }
    try {
      const dataUrl = await (format === 'png' ? toPng : toSvg)(el, {
        backgroundColor: theme === 'dark' ? '#0a0a0f' : '#f2f2f7',
        pixelRatio: 2, // high quality
      })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `beautydb-${activeTab}.${format}`
      a.click()
      setShowExportMenu(false)
    } catch (e) {
      console.error(e)
      alert("Failed to export diagram.")
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
                  className="absolute right-0 top-full mt-2 w-32 rounded-lg py-1 z-50 shadow-2xl animate-in"
                  style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }}
                >
                  <button onClick={() => handleExport('png')} className="w-full text-left px-3 py-1.5 transition-colors text-[12px] flex items-center gap-2 hover:bg-[var(--bg-elevated)]" style={{ color: 'var(--text-primary)' }}>
                    <ImageIcon size={12} /> Save PNG
                  </button>
                  <button onClick={() => handleExport('svg')} className="w-full text-left px-3 py-1.5 transition-colors text-[12px] flex items-center gap-2 hover:bg-[var(--bg-elevated)]" style={{ color: 'var(--text-primary)' }}>
                    <ImageIcon size={12} /> Save SVG
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
