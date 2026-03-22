# beautyDB — Project Plan

> **Slug:** `beautydb-web`
> **Type:** WEB APPLICATION
> **Date:** 2026-03-22
> **Status:** PLANNING

---

## 📋 Overview

**beautyDB** là một web app cho phép người dùng thiết kế database schema bằng cách vẽ ERD (Entity Relationship Diagram) trực tiếp trên canvas, với sự hỗ trợ của AI.

**Vấn đề giải quyết:**
- Thiết kế database bằng tay (Figma, dbdiagram.io) chậm và khó chia sẻ
- Người không biết SQL vẫn cần thiết kế và hiểu cấu trúc database
- Không có tool nào kết hợp AI + ERD visualisation trong cùng một browser workflow

**Vision:** _"Paste schema → diagram xuất hiện. Mô tả bằng tiếng Anh → AI build nó."_

---

## ✅ Success Criteria

| Metric | Target |
|--------|--------|
| Paste-to-diagram time | < 2 giây |
| Parse success rate (messy SQL) | > 90% |
| AI FK accuracy | > 85% |
| Hỗ trợ schema 50+ tables | ✅ Không crash |
| Export ra PostgreSQL SQL hợp lệ | ✅ Chạy được trong psql |

---

## 🛠️ Tech Stack

### Frontend

| Component | Technology | Lý do chọn |
|-----------|-----------|------------|
| Framework | **Next.js 15** (App Router) | SSR/SSG, routing tốt, ecosystem mạnh |
| Language | **TypeScript** | Type safety cho schema objects phức tạp |
| Canvas / ERD | **React Flow** (`@xyflow/react`) | Drag, zoom, edge routing built-in |
| Auto-layout | **`@dagrejs/dagre`** | Hierarchical layout, minimize crossings |
| Code Editor | **CodeMirror 6** | Syntax highlighting, error marks, BDL support |
| UI Primitives | **Radix UI** | Accessible, unstyled components |
| Styling | **Tailwind CSS v4** | Rapid styling, design token system |
| Animation | **Framer Motion** | Micro-animations, transitions |
| State | **Zustand** | Lightweight, no boilerplate, persist middleware |
| Icons | **Lucide React** | Consistent, tree-shakable |

### Backend / AI

| Component | Technology | Lý do chọn |
|-----------|-----------|------------|
| API Routes | **Next.js API Routes** | Co-located với frontend, đơn giản |
| AI Model | **Google Gemini 2.5 Flash** | Giỏi code/schema, chi phí thấp |
| SQL Parser | **`sql-parser-cst`** | CST-based, tolerant với messy SQL |
| BDL Parser | **Custom (PEG.js / hand-written)** | BDL là ngôn ngữ độc quyền của beautyDB |
| Session State | **`localStorage`** (anonymous) | Zero-friction, không cần account |
| Export | **`html2canvas`** / **`@svgdotjs/svg.js`** | PNG/SVG export |

### DevOps / Tooling

| Tool | Usage |
|------|-------|
| **pnpm** | Package manager |
| **ESLint + Prettier** | Code quality |
| **Vitest** | Unit tests cho parsers |
| **Playwright** | E2E tests |
| **Vercel** | Deployment (zero-config với Next.js) |

---

## 📁 File Structure

```
beautyDB/
├── app/
│   ├── layout.tsx              # Root layout, theme provider
│   ├── page.tsx                # Main editor page (3-panel layout)
│   ├── share/[id]/
│   │   └── page.tsx            # Read-only share view
│   └── api/
│       ├── ai/
│       │   ├── build-table/
│       │   │   └── route.ts    # AI Table Builder endpoint
│       │   └── suggest-links/
│       │       └── route.ts    # AI Link Suggester endpoint
│       └── export/
│           └── share/
│               └── route.ts   # Generate share link
├── components/
│   ├── editor/
│   │   ├── SchemaEditor.tsx    # CodeMirror wrapper
│   │   └── bdl-syntax.ts       # BDL CodeMirror language
│   ├── canvas/
│   │   ├── ERDCanvas.tsx       # React Flow main canvas
│   │   ├── TableNode.tsx       # Custom React Flow node
│   │   ├── RelationshipEdge.tsx # Crow's foot edges
│   │   └── MiniMapPanel.tsx    # Bottom-right minimap
│   ├── ai/
│   │   ├── AIPanel.tsx         # AI sidebar
│   │   ├── TableBuilderForm.tsx # Natural language input
│   │   ├── LinkSuggesterList.tsx # Suggestions list
│   │   └── HistoryPanel.tsx    # AI request history
│   ├── export/
│   │   └── ExportMenu.tsx      # Export format picker
│   └── ui/                     # Radix UI wrappers
│       ├── Button.tsx
│       ├── Tooltip.tsx
│       └── Dialog.tsx
├── lib/
│   ├── parsers/
│   │   ├── bdl-parser.ts       # BDL → internal JSON
│   │   ├── sql-parser.ts       # SQL → internal JSON
│   │   ├── prisma-parser.ts    # Prisma → internal JSON
│   │   └── detect-language.ts  # Auto-detect input type
│   ├── exporters/
│   │   ├── sql-exporter.ts     # Internal JSON → SQL
│   │   ├── prisma-exporter.ts  # Internal JSON → Prisma
│   │   └── bdl-exporter.ts     # Internal JSON → BDL
│   ├── layout/
│   │   └── dagre-layout.ts     # Dagre auto-layout
│   ├── ai/
│   │   └── prompts.ts          # AI prompt templates
│   ├── store/
│   │   └── schema-store.ts     # Zustand store
│   └── types/
│       └── schema.ts           # TypeScript type definitions
├── public/
├── styles/
│   └── globals.css
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 🎨 Design System

### Colour Tokens

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--bg-primary` | `#fafaf8` | `#0f0f13` | Page background |
| `--bg-surface` | `#ffffff` | `#1a1a21` | Cards, panels |
| `--accent-primary` | `#7c6af7` | `#9d8fff` | Headers, active |
| `--accent-success` | `#34d399` | `#34d399` | FK icons |
| `--accent-warning` | `#fbbf24` | `#fbbf24` | AI suggestions |
| `--line-1-1` | `#3b82f6` | `#60a5fa` | 1-1 lines |
| `--line-1-n` | `#7c6af7` | `#9d8fff` | 1-n lines |
| `--line-n-n` | `#f97316` | `#fb923c` | n-n lines |

### Layout (Desktop)

```
┌─────────────────────────────────────────────────────────────┐
│  beautyDB logo   [Export ▼]  [Share]  [Theme]               │
├──────────────┬──────────────────────────┬────────────────────┤
│ EDITOR (25%) │ CANVAS (50%)             │ AI PANEL (25%)     │
│              │                          │                    │
│ CodeMirror   │ React Flow ERD           │ Request input      │
│              │                          │ Suggestion list    │
│ [Parse &     │ [TableA]──1:n──[TableB]  │ AI History         │
│  Visualise]  │                          │                    │
├──────────────┴──────────────────────────┴────────────────────┤
│ [Re-layout] [Zoom fit] [Full/Compact/Names] [Minimap]        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📐 Internal Schema Format (Canonical)

```typescript
// lib/types/schema.ts
interface Column {
  name: string
  type: 'int' | 'text' | 'float' | 'date' | 'datetime' | 'bool' | 'image' | 'json'
  modifiers: ('primaryKey' | 'autoincrement' | 'required' | 'unique' | `default:${string}`)[]
  foreignKey: { table: string; column: string } | null
}

interface Table {
  name: string
  columns: Column[]
}

interface Link {
  from: { table: string; column: string }
  to: { table: string; column: string }
  cardinality: '1-1' | '1-n' | 'n-n'
}

interface Schema {
  tables: Table[]
  links: Link[]
}
```

---

## 📋 Task Breakdown

### PHASE 0: Foundation (P0)

#### T01 — Project Init
- **Agent:** `backend-specialist`
- **Priority:** P0 🔴
- **Dependencies:** none
- **INPUT:** empty directory
- **OUTPUT:** `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`
- **VERIFY:** `pnpm dev` chạy không lỗi, `http://localhost:3000` trả về 200

#### T02 — Design System & Global CSS
- **Agent:** `frontend-specialist`
- **Skills:** `frontend-design`, `tailwind-patterns`
- **Priority:** P0 🔴
- **Dependencies:** T01
- **INPUT:** Colour tokens từ PRD section 4.2
- **OUTPUT:** `styles/globals.css` với CSS variables, dark mode support
- **VERIFY:** Toggle dark mode → tất cả tokens chuyển đúng

#### T03 — TypeScript Types
- **Agent:** `backend-specialist`
- **Priority:** P0 🔴
- **Dependencies:** T01
- **INPUT:** Canonical JSON schema từ PRD section 2.2
- **OUTPUT:** `lib/types/schema.ts` — đầy đủ types cho Schema, Table, Column, Link
- **VERIFY:** `npx tsc --noEmit` không có type errors

#### T04 — Zustand Store
- **Agent:** `backend-specialist`
- **Priority:** P0 🔴
- **Dependencies:** T03
- **INPUT:** Schema type definitions
- **OUTPUT:** `lib/store/schema-store.ts` với actions: `setSchema`, `addTable`, `addLink`, `undo`, `redo`
- **VERIFY:** Unit test: setSchema → getState() returns correct schema

---

### PHASE 1: Core Parsers (P1)

#### T05 — BDL Parser
- **Agent:** `backend-specialist`
- **Skills:** `clean-code`
- **Priority:** P1 🟠
- **Dependencies:** T03
- **INPUT:** BDL spec từ `beautyDB_language.md`
- **OUTPUT:** `lib/parsers/bdl-parser.ts` — parse BDL string → Schema JSON
- **VERIFY:** Parse ví dụ Online Shop từ BDL spec → ra đúng 5 tables + 4 links

#### T06 — SQL Parser
- **Agent:** `backend-specialist`
- **Priority:** P1 🟠
- **Dependencies:** T03
- **INPUT:** `sql-parser-cst` library
- **OUTPUT:** `lib/parsers/sql-parser.ts` — parse CREATE TABLE SQL → Schema JSON
- **VERIFY:** Parse 20-table PostgreSQL dump → ra đúng tables + FK relationships

#### T07 — Language Auto-Detect
- **Agent:** `backend-specialist`
- **Priority:** P1 🟠
- **Dependencies:** T05, T06
- **INPUT:** Raw string từ editor
- **OUTPUT:** `lib/parsers/detect-language.ts` — trả về `'bdl' | 'sql' | 'prisma' | 'json'`
- **VERIFY:** Test 4 sample inputs → detect đúng 100%

#### T08 — SQL Exporter
- **Agent:** `backend-specialist`
- **Priority:** P1 🟠
- **Dependencies:** T03
- **INPUT:** Internal Schema JSON
- **OUTPUT:** `lib/exporters/sql-exporter.ts` — tạo MySQL/PostgreSQL/SQLite SQL
- **VERIFY:** Export 5-table schema → chạy trong `psql` không lỗi

---

### PHASE 2: Canvas & Editor (P2)

#### T09 — Schema Editor (CodeMirror)
- **Agent:** `frontend-specialist`
- **Skills:** `frontend-design`
- **Priority:** P2 🟡
- **Dependencies:** T04, T05, T06, T07
- **INPUT:** CodeMirror 6 setup
- **OUTPUT:** `components/editor/SchemaEditor.tsx` — editor với syntax highlighting, 500ms debounce parse, inline error marks
- **VERIFY:** Paste BDL → highlight + parse trong 500ms

#### T10 — React Flow Canvas
- **Agent:** `frontend-specialist`
- **Priority:** P2 🟡
- **Dependencies:** T03, T04
- **INPUT:** React Flow library
- **OUTPUT:** `components/canvas/ERDCanvas.tsx` — main canvas với zoom, pan, minimap
- **VERIFY:** Render 10-table schema không overlap

#### T11 — Table Node Component
- **Agent:** `frontend-specialist`
- **Skills:** `frontend-design`
- **Priority:** P2 🟡
- **Dependencies:** T10
- **INPUT:** Table data từ Schema store
- **OUTPUT:** `components/canvas/TableNode.tsx` — card với header, columns, PK/FK icons, view modes (Full/Compact/Names)
- **VERIFY:** Click card → right panel hiển thị column details

#### T12 — Relationship Edges (Crow's Foot)
- **Agent:** `frontend-specialist`
- **Priority:** P2 🟡
- **Dependencies:** T10
- **INPUT:** Link data từ Schema store
- **OUTPUT:** `components/canvas/RelationshipEdge.tsx` — custom edges với crow's foot notation, hover tooltip
- **VERIFY:** 1-1 dashed | 1-n crow's foot | n-n dashed crow's foot hiển thị đúng

#### T13 — Dagre Auto-Layout
- **Agent:** `frontend-specialist`
- **Priority:** P2 🟡
- **Dependencies:** T10
- **INPUT:** `@dagrejs/dagre` library
- **OUTPUT:** `lib/layout/dagre-layout.ts` — tính toán positions cho React Flow nodes
- **VERIFY:** 20-table schema → không có node overlap, edge crossings tối thiểu

#### T14 — 3-Panel Main Layout
- **Agent:** `frontend-specialist`
- **Skills:** `frontend-design`
- **Priority:** P2 🟡
- **Dependencies:** T09, T10, T11, T12, T13
- **INPUT:** Design spec từ PRD section 4.1
- **OUTPUT:** `app/page.tsx` — 3-panel responsive layout (Editor | Canvas | AI)
- **VERIFY:** Resizable panels, toolbar ở bottom

---

### PHASE 3: AI Features (P3)

#### T15 — AI Table Builder API
- **Agent:** `backend-specialist`
- **Skills:** `api-patterns`
- **Priority:** P3 🔵
- **Dependencies:** T03, T08
- **INPUT:** Prompt template từ PRD section 5.1
- **OUTPUT:** `app/api/ai/build-table/route.ts` — nhận user request + current schema → trả về BDL + explanations
- **VERIFY:** Request "Add product review system" → trả về Review table với FK đúng đến Product và User

#### T16 — AI Link Suggester API
- **Agent:** `backend-specialist`
- **Priority:** P3 🔵
- **Dependencies:** T03
- **INPUT:** Prompt template từ PRD section 5.2
- **OUTPUT:** `app/api/ai/suggest-links/route.ts` — nhận schema → trả về JSON array suggestions
- **VERIFY:** Schema với `post.author_id` + `User` table → High confidence suggestion

#### T17 — AI Panel UI
- **Agent:** `frontend-specialist`
- **Skills:** `frontend-design`
- **Priority:** P3 🔵
- **Dependencies:** T15, T16
- **INPUT:** AI API endpoints
- **OUTPUT:** `components/ai/AIPanel.tsx`, `TableBuilderForm.tsx`, `LinkSuggesterList.tsx`
- **VERIFY:** Ghost preview hiện trên canvas trước khi confirm; "Add to schema" merge vào live schema

---

### PHASE 4: Export & Share (P4)

#### T18 — Export Menu
- **Agent:** `frontend-specialist`
- **Priority:** P4 🟢
- **Dependencies:** T08
- **INPUT:** SQL, BDL, Prisma exporters
- **OUTPUT:** `components/export/ExportMenu.tsx` — dropdown với tất cả formats
- **VERIFY:** Export PostgreSQL → file hợp lệ; Export PNG → toàn bộ canvas captured

#### T19 — Share Link
- **Agent:** `backend-specialist`
- **Priority:** P4 🟢
- **Dependencies:** T03
- **INPUT:** Schema JSON
- **OUTPUT:** `app/api/export/share/route.ts` + `app/share/[id]/page.tsx`
- **VERIFY:** Share link mở trong incognito → hiện schema read-only đúng

---

### PHASE X: Verification

#### Automated Tests
```bash
# Unit tests (parsers)
pnpm vitest run

# E2E tests
pnpm playwright test

# Type check
pnpm tsc --noEmit

# Lint
pnpm lint

# Security scan
python .agent/skills/vulnerability-scanner/scripts/security_scan.py .

# UX audit
python .agent/skills/frontend-design/scripts/ux_audit.py .

# Build
pnpm build
```

#### Manual Verification Checklist
- [ ] Paste BDL Online Shop example → ERD renders đúng trong < 2s
- [ ] Paste messy PostgreSQL dump → parse thành công, syntax errors hiển thị inline
- [ ] Drag table card → position persist trong session
- [ ] Click 1-n relationship → cả 2 tables highlight
- [ ] AI: "Add notification system" → ghost preview xuất hiện → confirm → schema update
- [ ] AI Link Suggester: schema với `author_id` → High confidence suggestion
- [ ] Export PostgreSQL → chạy `psql -f output.sql` không lỗi
- [ ] Share link → mở incognito → read-only view đúng
- [ ] `Cmd+Z` → undo AI-generated table
- [ ] Toggle dark mode → tất cả colours đúng

---

## 🔀 Task Dependencies Graph

```
T01 (Init)
├── T02 (Design System)
├── T03 (Types)
│   ├── T04 (Store) ──────────────→ T09, T10
│   ├── T05 (BDL Parser) ──────────→ T07, T09
│   ├── T06 (SQL Parser) ──────────→ T07, T09
│   └── T08 (SQL Exporter) ────────→ T15, T18
├── T07 (Language Detect) ─────────→ T09
└── T09 → T10 → T11 → T14
              └── T12 → T14
              └── T13 → T14
T14 → T17 (AI Panel)
T15, T16 → T17
T18, T19 (can parallel with T17)
```

---

## ⚠️ Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| BDL parser edge cases | High | Vitest unit tests với 20+ fixtures |
| React Flow performance 50+ nodes | Medium | Virtualization, memoization |
| AI hallucinating wrong FK refs | High | Validate AI output against existing schema before preview |
| CodeMirror BDL syntax plugin complexity | Medium | Start với regex-based tokenizer, nâng lên PEG.js sau |
| CORS / API key exposure | High | API keys chỉ ở server-side (API Routes) |

---

## 📦 Key Dependencies

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "@xyflow/react": "^12.0.0",
    "@dagrejs/dagre": "^1.1.4",
    "@codemirror/view": "^6.0.0",
    "@codemirror/state": "^6.0.0",
    "@radix-ui/react-tooltip": "^1.0.0",
    "@radix-ui/react-dialog": "^1.0.0",
    "zustand": "^5.0.0",
    "framer-motion": "^11.0.0",
    "sql-parser-cst": "^0.23.0",
    "lucide-react": "^0.400.0",
    "@google/generative-ai": "^0.21.0",
    "html2canvas": "^1.4.1"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "tailwindcss": "^4.0.0",
    "vitest": "^2.0.0",
    "@playwright/test": "^1.45.0"
  }
}
```

---

## 🗺️ MVP Scope (v1.0)

**IN SCOPE:**
- ✅ Editor: BDL + SQL input, auto-detect, syntax highlighting
- ✅ Canvas: ERD render, auto-layout (Dagre), drag + zoom
- ✅ Relationship lines: crow's foot notation, hover tooltips
- ✅ AI Table Builder: natural language → new BDL table
- ✅ AI Link Suggester: detect undeclared FKs
- ✅ Export: SQL (PostgreSQL/MySQL) + PNG/SVG
- ✅ Share link (read-only)

**OUT OF SCOPE (v2.0+):**
- ❌ Real-time multiplayer
- ❌ Version history / diff view
- ❌ Live database connection
- ❌ User accounts / auth
- ❌ Code generation (Prisma, TypeORM, Drizzle)

---

*Plan created: 2026-03-22 | Status: AWAITING USER APPROVAL*
