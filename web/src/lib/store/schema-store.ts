import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Schema, AISuggestion, AIHistoryEntry, ParseError } from '@/lib/types/schema'

interface SchemaAction {
  type: string
  schema: Schema
}

interface SchemaStore {
  schema: Schema
  rawInput: string
  parseErrors: ParseError[]
  aiSuggestions: AISuggestion[]
  aiHistory: AIHistoryEntry[]
  aiPanelOpen: boolean
  pendingBDL: string | null
  undoStack: Schema[]
  redoStack: Schema[]
  hoveredTable: string | null

  setSchema: (schema: Schema) => void
  setRawInput: (input: string) => void
  setParseErrors: (errors: ParseError[]) => void
  setAISuggestions: (suggestions: AISuggestion[]) => void
  dismissSuggestion: (id: string) => void
  addToHistory: (entry: AIHistoryEntry) => void
  toggleAIPanel: () => void
  setPendingBDL: (bdl: string | null) => void
  confirmPendingBDL: (schema: Schema) => void
  updateTablePosition: (tableName: string, x: number, y: number) => void
  updateEnumPosition: (enumName: string, x: number, y: number) => void
  undo: () => void
  redo: () => void
  setHoveredTable: (tableName: string | null) => void
}

export const useSchemaStore = create<SchemaStore>()(
  persist(
    (set, get) => ({
      schema: { tables: [], links: [], enums: [] },
      rawInput: '',
      parseErrors: [],
      aiSuggestions: [],
      aiHistory: [],
      aiPanelOpen: true,
      pendingBDL: null,
      undoStack: [],
      redoStack: [],
      hoveredTable: null,

      setHoveredTable: (hoveredTable) => set({ hoveredTable }),

      setSchema: (schema) => {
        const prev = get().schema
        set((state) => ({
          schema,
          undoStack: [...state.undoStack.slice(-19), prev],
          redoStack: [],
        }))
      },

      setRawInput: (rawInput) => set({ rawInput }),
      setParseErrors: (parseErrors) => set({ parseErrors }),
      setAISuggestions: (aiSuggestions) => set({ aiSuggestions }),

      dismissSuggestion: (id) =>
        set((state) => ({
          aiSuggestions: state.aiSuggestions.map((s) =>
            s.id === id ? { ...s, dismissed: true } : s
          ),
        })),

      addToHistory: (entry) =>
        set((state) => ({
          aiHistory: [entry, ...state.aiHistory.slice(0, 9)],
        })),

      toggleAIPanel: () => set((state) => ({ aiPanelOpen: !state.aiPanelOpen })),

      setPendingBDL: (pendingBDL) => set({ pendingBDL }),

      confirmPendingBDL: (newSchema) => {
        const prev = get().schema
        set((state) => ({
          schema: newSchema,
          pendingBDL: null,
          undoStack: [...state.undoStack.slice(-19), prev],
          redoStack: [],
        }))
      },

      updateTablePosition: (tableName, x, y) =>
        set((state) => ({
          schema: {
            ...state.schema,
            tables: state.schema.tables.map((t) =>
              t.name === tableName ? { ...t, position: { x, y } } : t
            ),
          },
        })),

      updateEnumPosition: (enumName, x, y) =>
        set((state) => ({
          schema: {
            ...state.schema,
            enums: state.schema.enums.map((e) =>
              e.name === enumName ? { ...e, position: { x, y } } : e
            ),
          },
        })),

      undo: () => {
        const { undoStack, schema } = get()
        if (undoStack.length === 0) return
        const prev = undoStack[undoStack.length - 1]
        set((state) => ({
          schema: prev,
          undoStack: state.undoStack.slice(0, -1),
          redoStack: [schema, ...state.redoStack.slice(0, 9)],
        }))
      },

      redo: () => {
        const { redoStack, schema } = get()
        if (redoStack.length === 0) return
        const next = redoStack[0]
        set((state) => ({
          schema: next,
          redoStack: state.redoStack.slice(1),
          undoStack: [...state.undoStack.slice(-19), schema],
        }))
      },
    }),
    {
      name: 'beautydb-schema',
      partialize: (state) => ({
        rawInput: state.rawInput,
        schema: state.schema,
        aiHistory: state.aiHistory,
      }),
    }
  )
)
