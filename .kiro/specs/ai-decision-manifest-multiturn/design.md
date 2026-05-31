# Design Document: AI Decision Manifest & Multi-turn Prompt

## Overview

This feature adds four interconnected capabilities to the existing Next.js AI marketing demo:

1. **Tag Derivation Logic** — a pure function `deriveActiveTags(layoutMatrix, theme)` that maps the current `LayoutMatrix` and theme string to a `Set<string>` of active decision-tag identifiers.
2. **AI Decision Manifest Panel** — a read-only capsule-tag panel rendered at the bottom of the left `Workbench`, giving sales reps (Fellows) an instant visual explanation of the AI's layout decisions.
3. **Multi-turn Prompt Workspace** — a follow-up textarea + submit button that unlocks after the first successful generation, letting Fellows refine the layout in natural language.
4. **Context-Aware API** — an upgrade to `/api/generate` that handles multi-turn requests carrying `previousJson` + `currentInput`, with a system prompt that enforces incremental, non-destructive updates.

The Fluid UI (Framer Motion layout animations) is already substantially implemented in `PhonePreview.tsx`. This design verifies the existing implementation is correct and specifies the `AnimatePresence` enter/exit props that need to be added.

### Key Design Decisions

- `deriveActiveTags` lives in `app/lib/tagDerivation.ts` — a pure module importable from both client components and server-side API routes (no React imports).
- `DemoLayout` owns all new shared state (`hasGenerated`, `activeTagSet`, `currentConfig` passed to `Workbench`). `Workbench` and `PhonePreview` remain presentation-focused.
- The multi-turn API path is a branch inside the existing `/api/generate` route — no new route file needed.
- The project already has `fast-check` v4 installed as a dev dependency; all property-based tests use it.
- Tests use Jest v30 with two projects: `jsdom` (component tests) and `node` (API route tests).

---

## Architecture

The feature touches four layers of the existing architecture. No new routes or pages are introduced.

```
┌─────────────────────────────────────────────────────────────────┐
│  DemoLayout (orchestrator — owns all shared state)              │
│                                                                 │
│  State: isGenerating, isFormSubmitted, previewKey, config,      │
│         apiError, selectedCarModel                              │
│  NEW:   hasGenerated (derived: previewKey >= 1)                 │
│  NEW:   activeTagSet (derived: deriveActiveTags(layoutMatrix,   │
│                                config.theme))                   │
│                                                                 │
│  handleGenerate(userInput, carModel)  — first-turn              │
│  handleMultiTurnGenerate(currentInput) — NEW, multi-turn        │
│                                                                 │
│  ┌──────────────────────────┐  ┌──────────────────────────┐    │
│  │  Workbench (left panel)  │  │  PhonePreview (right)    │    │
│  │                          │  │                          │    │
│  │  NEW props:              │  │  Unchanged props.        │    │
│  │  - hasGenerated          │  │  AnimatePresence enter/  │    │
│  │  - currentConfig         │  │  exit props added to     │    │
│  │  - activeTagSet          │  │  motion.div wrappers.    │    │
│  │  - onMultiTurnGenerate   │  │                          │    │
│  │                          │  │                          │    │
│  │  NEW sub-components:     │  └──────────────────────────┘    │
│  │  - AIDecisionManifest    │                                   │
│  │  - MultiTurnInput        │                                   │
│  └──────────────────────────┘                                   │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
         /api/generate  (POST — upgraded)
         ┌──────────────────────────────────────┐
         │  isMultiTurn=false  →  first-turn     │
         │  isMultiTurn=true   →  multi-turn     │
         │                                       │
         │  buildSystemPrompt(carModel)          │
         │  buildMultiTurnSystemPrompt(carModel) │ NEW
         │  buildMultiTurnUserMessage(           │ NEW
         │    previousJson, currentInput)        │
         └──────────────────────────────────────┘
                          │
                          ▼
              app/lib/tagDerivation.ts  (NEW — pure)
              deriveActiveTags(layoutMatrix, theme)
```

### Data Flow — Multi-turn Request

```
Fellow types refinement → MultiTurnInput.handleSubmit
  → validates non-empty/non-whitespace
  → calls onMultiTurnGenerate(trimmedInput)
    → DemoLayout.handleMultiTurnGenerate(currentInput)
      → POST /api/generate {
          isMultiTurn: true,
          previousJson: config,       // current DemoConfig
          currentInput: currentInput,
          carModel: selectedCarModel
        }
      → on success: setConfig(newConfig), setPreviewKey(prev+1)
                    (isFormSubmitted NOT reset)
      → on failure: setApiError(message)
```

---

## Components and Interfaces

### 1. `app/lib/tagDerivation.ts` (new file)

Pure module — no React imports. Safe to import from both client components and API routes.

```typescript
import type { LayoutMatrix } from './atomicLayout';

// The six canonical tag identifier strings
export const TAG_SPIN_WHEEL    = '🎯 大转盘视觉 C 位';
export const TAG_CAR_BG        = '🚗 车身退为科技背景';
export const TAG_MAGAZINE_FLOW = '📖 触发横滑杂志画册流';
export const TAG_LUXURY_GREEN  = '💎 注入新豪华绿金调';
export const TAG_VIRAL_COLOR   = '🔥 开启高频裂变色系';
export const TAG_FELLOW_TONE   = '☕ 匹配接地气 Fellow 话术';

export const ALL_TAGS = [
  TAG_SPIN_WHEEL,
  TAG_CAR_BG,
  TAG_MAGAZINE_FLOW,
  TAG_LUXURY_GREEN,
  TAG_VIRAL_COLOR,
  TAG_FELLOW_TONE,
] as const;

export type DecisionTag = (typeof ALL_TAGS)[number];

/**
 * Pure function. Derives the set of active decision tags from a LayoutMatrix
 * and a theme string. Returns an empty Set for null/undefined input.
 * Never throws.
 */
export function deriveActiveTags(
  layoutMatrix: LayoutMatrix | null | undefined,
  theme: string | null | undefined,
): Set<string> {
  const active = new Set<string>();
  if (layoutMatrix == null) return active;

  const { componentOrder, componentSettings } = layoutMatrix;
  const settings = componentSettings ?? {};

  // 🎯 大转盘视觉 C 位
  if (componentOrder[0] === 'lucky_wheel' || settings.lucky_wheel?.scale === 'large') {
    active.add(TAG_SPIN_WHEEL);
  }
  // 🚗 车身退为科技背景
  if (settings.car_stage?.isBackground === true) {
    active.add(TAG_CAR_BG);
  }
  // 📖 触发横滑杂志画册流
  if (settings.selling_points?.displayType === 'grid') {
    active.add(TAG_MAGAZINE_FLOW);
  }
  // 💎 注入新豪华绿金调
  if (theme === 'luxury_ai') {
    active.add(TAG_LUXURY_GREEN);
  }
  // 🔥 开启高频裂变色系
  if (theme === 'pop_active' || theme === 'sport_tech') {
    active.add(TAG_VIRAL_COLOR);
  }
  // ☕ 匹配接地气 Fellow 话术
  if (settings.campaign_info != null && settings.campaign_info.highlight === true) {
    active.add(TAG_FELLOW_TONE);
  }

  return active;
}
```

### 2. `AIDecisionManifest` sub-component (inside `Workbench.tsx` or extracted)

Read-only panel. Receives `activeTagSet: Set<string>` as a prop. Renders all six tags; each tag is active or inactive based on set membership.

```typescript
interface AIDecisionManifestProps {
  activeTagSet: Set<string>;
}
```

Tag category mapping (determines colour):

| Tag | Category | Active colour |
|-----|----------|---------------|
| `TAG_SPIN_WHEEL` | layout | `bg-indigo-500 text-white` |
| `TAG_CAR_BG` | layout | `bg-indigo-500 text-white` |
| `TAG_MAGAZINE_FLOW` | layout | `bg-indigo-500 text-white` |
| `TAG_LUXURY_GREEN` | style | `bg-emerald-500 text-white` |
| `TAG_VIRAL_COLOR` | style | `bg-amber-500 text-white` |
| `TAG_FELLOW_TONE` | style | `bg-emerald-500 text-white` |

Inactive state for all tags: `opacity-[0.35] bg-gray-700 text-gray-400`

No `onClick`, `onKeyDown`, `tabIndex`, or `role="button"` on any tag element.

### 3. `MultiTurnInput` sub-component (inside `Workbench.tsx` or extracted)

```typescript
interface MultiTurnInputProps {
  isGenerating: boolean;
  onSubmit: (currentInput: string) => void;
}
```

Internal state: `value: string`, `error: string | null`.

Behaviour:
- `maxLength={500}`, character counter `{value.length}/500`
- On submit: trim value; if empty/whitespace → set error `"请输入追问内容"`, do not call `onSubmit`
- On submit with valid input: clear error, call `onSubmit(trimmedValue)`
- On new submission start (isGenerating transitions to true): clear error
- On success (parent clears value via controlled prop or callback): textarea cleared
- Button label: `"✏️ 追问微调"` (idle) / spinner + `"生成中..."` (isGenerating)
- Both textarea and button `disabled` when `isGenerating`

### 4. Updated `Workbench` props interface

```typescript
interface WorkbenchProps {
  isGenerating: boolean;
  onGenerate: (userInput: string, carModel: CarModelId) => void;
  apiError: string | null;
  onAnimationComplete: () => void;
  selectedCarModel: CarModelId;
  onModelChange: (id: CarModelId) => void;
  // NEW:
  hasGenerated: boolean;
  currentConfig: DemoConfig;
  activeTagSet: Set<string>;
  onMultiTurnGenerate: (currentInput: string) => void;
}
```

Render order (bottom of Workbench, below generate button and apiError):
1. `MultiTurnInput` — rendered only when `hasGenerated && !isGenerating` (hidden during generation)
2. `AIDecisionManifest` — rendered only when `hasGenerated && activeTagSet.size > 0 && !isGenerating`

### 5. Updated `DemoLayout` additions

New derived values computed at render time (no extra state):

```typescript
const hasGenerated: boolean = previewKey >= 1;
const activeTagSet: Set<string> = deriveActiveTags(layoutMatrix, config.theme);
```

New handler:

```typescript
async function handleMultiTurnGenerate(currentInput: string): Promise<void> {
  setIsGenerating(true);
  setApiError(null);
  // animationPromise + timeoutPromise same pattern as handleGenerate
  // POST body: { isMultiTurn: true, previousJson: config, currentInput, carModel: selectedCarModel }
  // On success: setConfig(newConfig), setPreviewKey(prev+1), setIsGenerating(false)
  // NOTE: setIsFormSubmitted NOT called
  // On failure: setApiError(message), setIsGenerating(false)
}
```

### 6. Updated `/api/generate` route

Two new pure helper functions added to `route.ts`:

```typescript
function buildMultiTurnSystemPrompt(carModel: CarModelId): string {
  // Extends buildSystemPrompt with three additional instructions:
  // 1. Preserve all fields from previousJson not explicitly changed by the user
  // 2. Make only targeted changes based on currentInput
  // 3. Return only the modified pure JSON object with no Markdown wrapping
}

function buildMultiTurnUserMessage(
  previousJson: DemoConfig,
  currentInput: string,
): string {
  // Returns: `上一版布局数据：${JSON.stringify(previousJson)}\n\n新追问：${currentInput}`
  // Throws if JSON.stringify fails (caller catches and returns HTTP 500)
}
```

Request routing logic in `POST`:

```
parse body
if isMultiTurn === true:
  validate currentInput (1–500 chars trimmed) → 400 if invalid
  validate previousJson (required fields) → 400 if invalid
  resolve carModel: previousJson.carModel → body.carModel → 400 if both invalid
  build multi-turn system prompt + user message
  call DeepSeek API
  normalise layoutMatrix
  return DemoConfig
else:
  existing first-turn logic (unchanged)
```

#### `previousJson` required field validation

The following fields must be present and of the correct type:

| Field | Type check |
|-------|-----------|
| `theme` | `typeof === 'string'` |
| `carModel` | `typeof === 'string'` |
| `layoutMatrix` | `typeof === 'object' && !== null` |
| `title` | `typeof === 'string'` |
| `subtitle` | `typeof === 'string'` |
| `sellingPoints` | `Array.isArray` |
| `prizes` | `Array.isArray` |

### 7. `PhonePreview` — AnimatePresence enter/exit props

The existing implementation already has `<AnimatePresence>` and `<motion.div layoutId={componentId} layout animate={{ scale, opacity }} transition={SPRING}>`. The missing piece is `initial` and `exit` props:

```tsx
<motion.div
  key={componentId}
  layoutId={componentId}
  layout
  initial={{ opacity: 0, scale: 0.95 }}   // ADD
  animate={{ scale, opacity }}
  exit={{ opacity: 0, scale: 0.95 }}       // ADD
  transition={SPRING}
>
```

No other changes to `PhonePreview` are required.

---

## Data Models

### `MultiTurnRequestBody`

```typescript
interface MultiTurnRequestBody {
  isMultiTurn: true;
  previousJson: DemoConfig;
  currentInput: string;
  carModel: CarModelId;
}
```

### `FirstTurnRequestBody` (existing, unchanged)

```typescript
interface FirstTurnRequestBody {
  isMultiTurn?: false;
  userInput: string;
  carModel: CarModelId;
}
```

### `DecisionTagMeta` (used by `AIDecisionManifest`)

```typescript
interface DecisionTagMeta {
  id: DecisionTag;
  label: string;           // same as id (the emoji string)
  category: 'layout' | 'style';
  activeClass: string;     // Tailwind classes when active
}

const DECISION_TAG_META: DecisionTagMeta[] = [
  { id: TAG_SPIN_WHEEL,    label: TAG_SPIN_WHEEL,    category: 'layout', activeClass: 'bg-indigo-500 text-white' },
  { id: TAG_CAR_BG,        label: TAG_CAR_BG,        category: 'layout', activeClass: 'bg-indigo-500 text-white' },
  { id: TAG_MAGAZINE_FLOW, label: TAG_MAGAZINE_FLOW, category: 'layout', activeClass: 'bg-indigo-500 text-white' },
  { id: TAG_LUXURY_GREEN,  label: TAG_LUXURY_GREEN,  category: 'style',  activeClass: 'bg-emerald-500 text-white' },
  { id: TAG_VIRAL_COLOR,   label: TAG_VIRAL_COLOR,   category: 'style',  activeClass: 'bg-amber-500 text-white' },
  { id: TAG_FELLOW_TONE,   label: TAG_FELLOW_TONE,   category: 'style',  activeClass: 'bg-emerald-500 text-white' },
];
```

### State additions in `DemoLayout`

No new `useState` calls are needed. All new values are derived at render time:

| Value | Derivation | Type |
|-------|-----------|------|
| `hasGenerated` | `previewKey >= 1` | `boolean` |
| `activeTagSet` | `deriveActiveTags(layoutMatrix, config.theme)` | `Set<string>` |

`MultiTurnInput` manages its own `value` and `error` state internally (controlled textarea). The parent (`DemoLayout`) clears the textarea by passing a `multiTurnKey` prop that increments on success, causing `MultiTurnInput` to reset its internal state via `useEffect` or by using the key as a React key.

Alternatively, `Workbench` can expose a `clearMultiTurnInput` ref callback — but the simpler approach is to pass `multiTurnKey: number` as a prop to `MultiTurnInput` and use it as the component's React `key`, which forces a remount and clears state automatically.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

The project has `fast-check` v4 installed. All property-based tests use `fc.assert(fc.property(...))` with a minimum of 100 runs.

**Property Reflection:** After reviewing all prework items, the following consolidations were made:
- Requirements 1.1 and 1.2 (tag derivation correctness + output set membership) are combined into one comprehensive property — verifying both the correct tags are active AND no extra tags appear covers both criteria simultaneously.
- Requirements 3.1, 3.2, and 3.3 (active tag colour, inactive tag colour) are combined into one property — a single render with a random activeTagSet verifies all three colour rules at once.
- Requirements 8.4 and 9.3 (`resolveAnimateProps` opacity) are the same underlying function — one property covers both.
- Requirements 6.2 and 6.3 (API input validation) are kept separate because they test different fields with different generators.

---

### Property 1: Tag derivation correctness and closure

*For any* `LayoutMatrix` (with any `componentOrder` and `componentSettings`) and any `theme` string, `deriveActiveTags` must return a `Set<string>` where:
- Every element is one of the six canonical tag identifiers (closure — no extra tags)
- Each of the six tags is present if and only if its derivation rule evaluates to true for the given inputs

**Validates: Requirements 1.1, 1.2**

---

### Property 2: Tag derivation determinism (proxy for purity)

*For any* `LayoutMatrix` and `theme` string, calling `deriveActiveTags` twice with identical arguments must return two Sets with identical contents.

**Validates: Requirements 1.4**

---

### Property 3: Decision tag visual state matches active set

*For any* subset of the six canonical tag identifiers used as `activeTagSet`, rendering `AIDecisionManifest` must produce DOM elements where:
- Every tag whose identifier is in `activeTagSet` has the category-specific active CSS class (indigo for layout tags, emerald/amber for style tags) and does not have the inactive grey class
- Every tag whose identifier is NOT in `activeTagSet` has the inactive grey/opacity class and does not have any active colour class

**Validates: Requirements 2.3, 3.1, 3.2, 3.3**

---

### Property 4: Multi-turn textarea whitespace rejection

*For any* string composed entirely of whitespace characters (spaces, tabs, newlines), attempting to submit it via `MultiTurnInput` must not invoke the `onSubmit` handler and must display the validation error `"请输入追问内容"`.

**Validates: Requirements 5.2**

---

### Property 5: Multi-turn character counter accuracy

*For any* string of length `n` (where `0 ≤ n ≤ 500`) typed into the `MultiTurnInput` textarea, the character counter must display exactly `"{n}/500"`.

**Validates: Requirements 4.5**

---

### Property 6: API multi-turn `currentInput` length validation

*For any* string that is either empty, whitespace-only, or longer than 500 characters (after trimming), a POST to `/api/generate` with `isMultiTurn: true` and that string as `currentInput` must return HTTP 400. *For any* string of trimmed length between 1 and 500 inclusive, the request must not be rejected for this reason.

**Validates: Requirements 6.2**

---

### Property 7: API multi-turn `previousJson` field validation

*For any* object that is missing one or more of the required fields (`theme`, `carModel`, `layoutMatrix`, `title`, `subtitle`, `sellingPoints`, `prizes`), a POST to `/api/generate` with `isMultiTurn: true` and that object as `previousJson` must return HTTP 400.

**Validates: Requirements 6.3**

---

### Property 8: API multi-turn user message format

*For any* `DemoConfig` object and any non-empty `currentInput` string, `buildMultiTurnUserMessage(previousJson, currentInput)` must return a string that starts with `"上一版布局数据："`, contains the JSON-serialised `previousJson`, then `"\n\n新追问："`, then `currentInput`.

**Validates: Requirements 7.3**

---

### Property 9: `resolveAnimateProps` opacity invariant

*For any* `ComponentSettings` object, `resolveAnimateProps` must return:
- `opacity: 0.35` when `isBackground === true`
- `opacity: 1.0` when `highlight === true` (and `isBackground` is not true)
- `opacity: 0.85` otherwise

**Validates: Requirements 8.4, 9.3**

---

### Property 10: API response `layoutMatrix` is always normalised

*For any* AI response body (mocked) with any `layoutMatrix` shape (including malformed, missing, or partially valid), the `/api/generate` handler must return a `DemoConfig` whose `layoutMatrix.componentOrder` contains all six canonical `ComponentId` values exactly once, in a valid order.

**Validates: Requirements 6.5**

---

## Error Handling

### Client-side (`DemoLayout`)

| Scenario | Handling |
|----------|---------|
| Multi-turn API returns 4xx | Map error body to user-facing message; set `apiError`; `isGenerating → false` |
| Multi-turn API returns 5xx | Display `"AI 服务暂时不可用，请稍后重试"`; `isGenerating → false` |
| Client-side 30s timeout | Display `"请求超时，请重试"`; `isGenerating → false` |
| Network error | Display raw error message; `isGenerating → false` |

The same `AbortController` + `Promise.race` timeout pattern used in `handleGenerate` is reused in `handleMultiTurnGenerate`.

### `MultiTurnInput` component

| Scenario | Handling |
|----------|---------|
| Empty / whitespace-only submit | Show inline error `"请输入追问内容"`; do not call `onSubmit` |
| New submission starts | Clear previous inline error before request is sent |
| API error returned | Display `apiError` prop below the `MultiTurnInput` area |

### Server-side (`/api/generate`)

| Scenario | HTTP status | Error body |
|----------|------------|-----------|
| `isMultiTurn=true`, `currentInput` invalid | 400 | `{ error: 'currentInput is required and must be 1–500 characters' }` |
| `isMultiTurn=true`, `previousJson` missing/invalid | 400 | `{ error: 'previousJson is missing required fields' }` |
| `isMultiTurn=true`, `carModel` absent/invalid | 400 | `{ error: 'Invalid carModel' }` |
| `JSON.stringify(previousJson)` throws | 500 | `{ error: 'Failed to construct multi-turn prompt' }` |
| DeepSeek API timeout | 502 | `{ error: 'AI service timeout' }` |
| DeepSeek API non-2xx | 502 | `{ error: 'AI service unavailable: ...' }` |
| AI returns non-JSON | 500 | `{ error: 'Invalid JSON from AI' }` |

All existing first-turn error handling is preserved unchanged.

---

## Testing Strategy

### Overview

The project uses Jest v30 with two test environments:
- `jsdom` — component tests (`__tests__/**/*.test.tsx`, `__tests__/**/*.test.ts` excluding `api/`)
- `node` — API route tests (`__tests__/api/**/*.test.ts`)

Property-based tests use `fast-check` v4 (already installed). Each property test runs a minimum of 100 iterations (`numRuns: 100` or the fast-check default).

### Unit Tests (example-based)

**`__tests__/tagDerivation.test.ts`** (node or jsdom)
- `deriveActiveTags(null)` → empty Set
- `deriveActiveTags(undefined)` → empty Set
- Each of the six tags activates correctly with a minimal triggering LayoutMatrix
- Unrecognised theme string → no theme tags active, no throw
- Multiple tags active simultaneously

**`__tests__/AIDecisionManifest.test.tsx`** (jsdom)
- Renders all six tag labels when `activeTagSet` is non-empty
- Tags not in `activeTagSet` have inactive grey class
- No `onClick`, `tabIndex`, or `role="button"` on any tag element

**`__tests__/MultiTurnInput.test.tsx`** (jsdom)
- Renders when `hasGenerated=true`
- Does not render when `hasGenerated=false`
- Button and textarea disabled when `isGenerating=true`
- Button label is `"✏️ 追问微调"` when idle
- Button shows spinner + `"生成中..."` when `isGenerating=true`
- Submitting empty string shows `"请输入追问内容"` error
- Submitting valid text calls `onSubmit` with trimmed value

**`__tests__/api/generate.test.ts`** (node) — additions to existing file
- Multi-turn request with valid body → 200
- Multi-turn request with missing `currentInput` → 400
- Multi-turn request with whitespace-only `currentInput` → 400
- Multi-turn request with `currentInput` > 500 chars → 400
- Multi-turn request with missing `previousJson` → 400
- Multi-turn request with `previousJson` missing `theme` field → 400
- Multi-turn request with invalid `carModel` → 400
- Multi-turn request with `previousJson.carModel` valid, body `carModel` invalid → uses `previousJson.carModel`
- Multi-turn response has normalised `layoutMatrix`

### Property-Based Tests

Each property test is tagged with a comment referencing the design property it validates.
Tag format: `// Feature: ai-decision-manifest-multiturn, Property N: <property_text>`

**`__tests__/tagDerivation.property.test.ts`** (node or jsdom)

- **Property 1** — Tag derivation correctness and closure
  - Generator: `fc.record({ componentOrder: fc.shuffledSubarray([...ATOMIC_COMPONENT_IDS], { minLength: 6 }), componentSettings: fc.record({...}) })` + `fc.string()`
  - Assert: returned Set ⊆ ALL_TAGS; each tag present iff its rule is true

- **Property 2** — Tag derivation determinism
  - Generator: same LayoutMatrix + theme
  - Assert: two calls return Sets with identical contents

**`__tests__/AIDecisionManifest.property.test.tsx`** (jsdom)

- **Property 3** — Decision tag visual state matches active set
  - Generator: `fc.subarray([...ALL_TAGS])` as `activeTagSet`
  - Assert: active tags have category colour class; inactive tags have grey class

**`__tests__/MultiTurnInput.property.test.tsx`** (jsdom)

- **Property 4** — Whitespace rejection
  - Generator: `fc.stringMatching(/^\s+$/)` (non-empty whitespace-only strings)
  - Assert: `onSubmit` not called; error `"请输入追问内容"` shown

- **Property 5** — Character counter accuracy
  - Generator: `fc.string({ maxLength: 500 })`
  - Assert: counter text equals `"${str.length}/500"`

**`__tests__/api/generate.property.test.ts`** (node)

- **Property 6** — `currentInput` length validation
  - Generator: invalid strings (empty, whitespace-only, length > 500) + valid strings (1–500 trimmed)
  - Assert: invalid → 400; valid → not 400 for this reason

- **Property 7** — `previousJson` field validation
  - Generator: `fc.record({...all fields...})` with random fields omitted
  - Assert: any missing required field → 400

- **Property 8** — Multi-turn user message format
  - Generator: `fc.record({...DemoConfig shape...})` + `fc.string({ minLength: 1, maxLength: 500 })`
  - Assert: message matches `"上一版布局数据：${JSON.stringify(prev)}\n\n新追问：${input}"`

- **Property 10** — API response `layoutMatrix` always normalised
  - Generator: arbitrary `layoutMatrix` shapes (missing, malformed, partial)
  - Assert: returned `layoutMatrix.componentOrder` contains all 6 ComponentIds exactly once

**`__tests__/PhonePreview.property.test.tsx`** (jsdom)

- **Property 9** — `resolveAnimateProps` opacity invariant
  - Generator: `fc.record({ scale: fc.option(fc.constantFrom('large','small')), highlight: fc.option(fc.boolean()), isBackground: fc.option(fc.boolean()) })`
  - Assert: opacity matches the three-case rule exactly

### Integration Tests

- `DemoLayout` renders `Workbench` with `hasGenerated=true` after a successful generation
- `DemoLayout` passes `activeTagSet` computed from current `config` to `Workbench`
- `DemoLayout.handleMultiTurnGenerate` does not reset `isFormSubmitted`
- `PhonePreview` `motion.div` elements have `initial={{ opacity: 0, scale: 0.95 }}` and `exit={{ opacity: 0, scale: 0.95 }}`

### What is NOT tested with PBT

- `AIDecisionManifest` positioning (visual inspection only)
- Framer Motion layout animation smoothness (Framer Motion's own test suite covers this)
- `SPRING` constant value (verified by reading the source constant)
- `previewKey` scroll reset behaviour (DOM scroll position, not a logic property)
