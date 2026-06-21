# Architecture

Adapted from [Clear Architecture](https://github.com/jkphl/clear-architecture) for a TypeScript/Node.js project.

---

## Overview

Source code is organised into three tiers that build on one another. Dependencies flow **inward only** — outer tiers know about inner tiers, never the reverse.

```
┌─────────────────────────────────────────┐
│              Client tier                │
│  ┌────────────┐  ┌────────────────────┐ │
│  │   Ports    │  │  Infrastructure    │ │
│  └────────────┘  └────────────────────┘ │
├─────────────────────────────────────────┤
│           Application tier             │
├─────────────────────────────────────────┤
│              Domain tier               │
└─────────────────────────────────────────┘
```

---

## Tiers

### ① Domain

Pure types, constants, and rules that have no dependencies on anything else in the project. No framework imports, no I/O, no side effects.

In this project: shared constants (`JSCC_YEAR`, storage keys) and the core data shapes (`TextBlock`, `LabelState`, `BlockId`).

### ② Application

Business logic that orchestrates domain types. Knows about the domain, knows nothing about the browser, the canvas, or Fastify. This is where rules live: how a label is structured, how ZPL is generated, how state transitions work.

In this project: label config (block positions, font sizes, ZPL template), state transformations (`updateBlockText`, `moveBlock`), and server-side use cases (participant parsing, print command generation).

### ③ Client tier — two sectors

**Ports** — the public interface. Entry points that accept external input (HTTP requests, browser events, form submissions) and delegate to the application layer. Should be thin: no business logic.

**Infrastructure** — implementation details that can change without touching the application layer. Canvas rendering, DOM wiring, Fastify plugin registration, CUPS shell commands.

---

## Directory layout

```
jscc-zpl-printer/
├── src/
│   ├── shared/                 ← Domain: constants and types shared across client + server
│   └── client/
│       ├── canvas/
│       │   ├── types.ts        ← Domain: TextBlock, LabelState, BlockId
│       │   ├── config.ts       ← Application: block layout, font sizes, ZPL template
│       │   ├── state.ts        ← Application: state factory and transitions
│       │   ├── render.ts       ← Infrastructure: canvas draw functions
│       │   └── editor.ts       ← Infrastructure: DOM event wiring, textarea overlay
│       ├── templates/          ← Application: ZPL string builders
│       ├── lib/                ← Infrastructure: reusable browser utilities
│       ├── main.ts             ← Port: browser entry point for the label form
│       └── editor.ts           ← Port: browser entry point for the label editor
│
├── server/
│   ├── api/                    ← Ports: Fastify route handlers (thin, delegate to utils)
│   ├── utils/                  ← Application: participant parsing, print command logic
│   └── constants.ts            ← Domain: server constants and route definitions
│
├── index.html                  ← Port: label printer page
├── editor.html                 ← Port: canvas label editor page
└── server.ts                   ← Port: Fastify bootstrap
```

---

## The Dependency Rule

A module may only import from the **same tier or inward**. The canonical dependency graph for the canvas module makes this concrete:

```
types.ts          (Domain)
  ↑
config.ts         (Application)  imports: types
  ↑
state.ts          (Application)  imports: types, config
  ↑
render.ts         (Infrastructure) imports: types, config
  ↑
canvas/editor.ts  (Infrastructure) imports: types, config, state, render
  ↑
client/editor.ts  (Port)          imports: canvas/editor, config
```

`types.ts` has zero imports. `config.ts` never touches the DOM. `state.ts` never touches `render.ts`. Violations of this order are bugs in the architecture, not just style issues.

---

## TypeScript conventions

### Types vs interfaces

Use `type` for data shapes and unions. Use `interface` only when extension across files is intentional.

```ts
// ✓ domain shape
type TextBlock = { id: BlockId; text: string; x: number; y: number; fontSize: number };

// ✓ extension point (Fastify plugin, external contract)
interface PrintRequest { zpl: string; printerName: string; }
```

### Naming

| Construct | Convention | Example |
|---|---|---|
| Types and interfaces | `PascalCase` | `TextBlock`, `LabelState` |
| Type unions / IDs | `PascalCase` | `BlockId` |
| Functions | `camelCase` | `renderCanvas`, `buildZPL` |
| Constants | `UPPER_SNAKE` for true globals, `camelCase` for module-level config | `JSCC_YEAR`, `SNAP_GRID` |
| Files | `kebab-case` for multi-word, plain noun for single-concept | `form-element.ts`, `state.ts` |
| Pure functions preferred | Avoid classes unless state encapsulation is genuinely needed | `defaultLabelState()` not `new LabelState()` |

### No "Impl" or "I" prefixes

TypeScript's structural typing makes these unnecessary. Name things by what they are, not their role in an inheritance hierarchy.

```ts
// ✗ PHP-style
interface IPrinter { ... }
class PrinterImpl implements IPrinter { ... }

// ✓ TypeScript-style
type Printer = { send(zpl: string): Promise<void> };
```

### Dependency inversion at boundaries

When the application layer needs something from infrastructure (e.g. sending a print job), define the contract as a `type` in the application layer and pass the implementation in from outside.

```ts
// Application layer defines the contract
type PrintFn = (zpl: string, printerName: string) => Promise<void>;

// Infrastructure provides the implementation
async function cupsprint(zpl: string, printerName: string): Promise<void> { ... }

// Port wires them together
submitForm(state, cupsprint);
```

### Module boundaries

Each `canvas/` module exports only what the next layer outward needs. Implementation helpers stay unexported. If a function is not exported, it cannot create an accidental dependency.

---

## What lives where — decision guide

| "Where does X go?" | Tier / Sector |
|---|---|
| A new ZPL command or label layout change | `config.ts` → Application |
| A new state transformation (rotate block, reset to defaults) | `state.ts` → Application |
| A new canvas visual (grid lines, handles, ruler) | `render.ts` → Infrastructure |
| A new user interaction (keyboard shortcut, right-click menu) | `canvas/editor.ts` → Infrastructure |
| A new server endpoint | `server/api/` → Ports, logic in `server/utils/` → Application |
| A shared constant used by both browser and server | `src/shared/constants.ts` → Domain |
| A type used only in one module | Keep it in that file, unexported unless needed |