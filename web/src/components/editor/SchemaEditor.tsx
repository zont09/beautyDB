'use client'

import { useState, useEffect } from 'react'
import { useSchemaStore } from '@/lib/store/schema-store'
import { parseInput } from '@/lib/parsers'
import { Play } from 'lucide-react'

export function SchemaEditor() {
  const { rawInput, setRawInput, setSchema, setParseErrors } = useSchemaStore()
  const [val, setVal] = useState(rawInput)

  // Real basic sync and debounce
  useEffect(() => {
    const t = setTimeout(() => {
      if (val !== rawInput) {
        setRawInput(val)
        const res = parseInput(val)
        setSchema(res.schema)
        setParseErrors(res.errors)
      }
    }, 500)
    return () => clearTimeout(t)
  }, [val, rawInput, setRawInput, setSchema, setParseErrors])

  // Sync external changes (e.g. AI appended a link) back to local state
  useEffect(() => {
    setVal(rawInput)
  }, [rawInput])

  return (
    <div className="flex flex-col h-full panel">
      <div className="panel-header justify-between">
        <span className="panel-title text-accent-primary">Editor</span>
        <div className="flex gap-2">
          <span className="badge badge-green">BDL / SQL Auto</span>
          <button className="btn btn-primary px-2 py-1 text-[10px]" onClick={() => {
            const res = parseInput(val)
            setSchema(res.schema)
            setParseErrors(res.errors)
          }}>
            <Play size={10} /> Parse
          </button>
        </div>
      </div>
      
      <div className="flex-1 relative bg-[#0d0d12]">
        <textarea
          value={val}
          onChange={e => setVal(e.target.value)}
          className="w-full h-full p-4 bg-transparent text-[#f0f0f8] font-mono text-sm resize-none focus:outline-none"
          placeholder="Paste SQL or type BDL here...&#10;&#10;table User {&#10;  id&#10;  name&#10;  email&#10;}&#10;&#10;table Post {&#10;  id&#10;  title&#10;  author_id -> User&#10;}"
          spellCheck={false}
        />
      </div>
    </div>
  )
}
