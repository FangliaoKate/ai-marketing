# Implementation Plan: AI Decision Manifest & Multi-turn Prompt

## Overview

Implement four interconnected capabilities on top of the existing Next.js / React / TypeScript / Tailwind CSS / Framer Motion stack:

1. **Tag Derivation Logic** — pure `deriveActiveTags` function in `app/lib/tagDerivation.ts`
2. **AI Decision Manifest Panel** — read-only capsule-tag panel in `Workbench`
3. **Multi-turn Prompt Workspace** — follow-up textarea + submit in `Workbench`
4. **Context-Aware API** — multi-turn branch inside `/api/generate`

Additionally, `PhonePreview` needs `initial` and `exit` props added to its `motion.div` wrappers to complete the Fluid UI.

All property-based tests use `fast-check` v4 (already installed). Tests run under Jest v30 with `jsdom` (components) and `node` (API) environments.

---

## Tasks

- [ ] 1. Create `app/lib/tagDerivation.ts` — pure tag derivation module
  - Define the six `TAG_*` string constants and `ALL_TAGS` array
  - Define the `DecisionTag` type
  - Implement `deriveActiveTags(layoutMatrix, theme)` following the six derivation rules exactly as specified in Requirements 1.1–1.5 and the design
  - Return an empty `Set<string>` for `null`/`undefined` input without throwing
  - No React imports — module must be safe to import from both client components and API routes
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 1.1 Write unit tests for `deriveActiveTags` in `__tests__/tagDerivation.test.ts`
    - `deriveActiveTags(null)` → empty Set
    - `deriveActiveTags(undefined)` → empty Set
    - Each of the six tags activates with a minimal triggering LayoutMatrix
    - Unrecognised theme string → no theme tags active, no throw
    - Multiple tags active simultaneously
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

  - [ ]* 1.2 Write property test — Property 1: Tag derivation correctness and closure (`__tests__/tagDerivation.property.test.ts`)
    - **Property 1: Tag derivation correctness and closure**
    - Generator: arbitrary `LayoutMatrix` (shuffled componentOrder, random componentSettings) + arbitrary theme string
    - Assert: every element of the returned Set is one of the six canonical tag identifiers; each tag is present if and only if its derivation rule evaluates to true
    - **Validates: Requirements 1.1, 1.2**

  - [ ]* 1.3 Write property test — Property 2: Tag derivation determinism (`__tests__/tagDerivation.property.test.ts`)
    - **Property 2: Tag derivation determinism (proxy for purity)**
    - Generator: same LayoutMatrix + theme string
    - Assert: two calls with identical arguments return Sets with identical contents
    - **Validates: Requirements 1.4**

- [ ] 2. Add `AnimatePresence` enter/exit props to `PhonePreview`
  - In `app/components/PhonePreview.tsx`, add `initial={{ opacity: 0, scale: 0.95 }}` and `exit={{ opacity: 0, scale: 0.95 }}` to the existing `motion.div` inside `AnimatePresence`
  - No other changes to `PhonePreview` are required
  - _Requirements: 8.1, 8.2, 9.4_

  - [ ]* 2.1 Write property test — Property 9: `resolveAnimateProps` opacity invariant (`__tests__/PhonePreview.property.test.tsx`)
    - **Property 9: `resolveAnimateProps` opacity invariant**
    - Generator: `fc.record({ scale: fc.option(fc.constantFrom('large','small')), highlight: fc.option(fc.boolean()), isBackground: fc.option(fc.boolean()) })`
    - Assert: `resolveAnimateProps` returns `opacity: 0.35` when `isBackground === true`; `opacity: 1.0` when `highlight === true` (and `isBackground` is not true); `opacity: 0.85` otherwise
    - **Validates: Requirements 8.4, 9.3**

- [ ] 3. Implement `AIDecisionManifest` sub-component
  - Create `AIDecisionManifest` as a named export inside `app/components/Workbench.tsx` (or as a separate file `app/components/AIDecisionManifest.tsx` imported by `Workbench`)
  - Props: `activeTagSet: Set<string>`
  - Define `DECISION_TAG_META` array with all six tags, their `category` (`'layout'` | `'style'`), and `activeClass` Tailwind strings per the design
  - Render all six tags simultaneously; active tags use category-specific colour (`bg-indigo-500` for layout, `bg-emerald-500` / `bg-amber-500` for style); inactive tags use `opacity-[0.35] bg-gray-700 text-gray-400`
  - No `onClick`, `onKeyDown`, `tabIndex`, or `role="button"` on any tag element
  - _Requirements: 2.2, 2.3, 2.4, 3.1, 3.2, 3.3_

  - [ ]* 3.1 Write unit tests for `AIDecisionManifest` in `__tests__/AIDecisionManifest.test.tsx`
    - Renders all six tag labels when `activeTagSet` is non-empty
    - Tags not in `activeTagSet` have the inactive grey class
    - No `onClick`, `tabIndex`, or `role="button"` on any tag element
    - _Requirements: 2.2, 2.3, 2.4_

  - [ ]* 3.2 Write property test — Property 3: Decision tag visual state matches active set (`__tests__/AIDecisionManifest.property.test.tsx`)
    - **Property 3: Decision tag visual state matches active set**
    - Generator: `fc.subarray([...ALL_TAGS])` as `activeTagSet`
    - Assert: every tag in `activeTagSet` has its category-specific active CSS class and does not have the inactive grey class; every tag not in `activeTagSet` has the inactive grey/opacity class and does not have any active colour class
    - **Validates: Requirements 2.3, 3.1, 3.2, 3.3**

- [ ] 4. Implement `MultiTurnInput` sub-component
  - Create `MultiTurnInput` as a named export inside `app/components/Workbench.tsx` (or as a separate file imported by `Workbench`)
  - Props: `isGenerating: boolean`, `onSubmit: (currentInput: string) => void`
  - Internal state: `value: string`, `error: string | null`
  - `maxLength={500}`, character counter `{value.length}/500`
  - On submit: trim value; if empty/whitespace → set error `"请输入追问内容"`, do not call `onSubmit`
  - On submit with valid input: clear error, call `onSubmit(trimmedValue)`
  - Button label: `"✏️ 追问微调"` (idle) / spinner + `"生成中..."` (isGenerating)
  - Both textarea and button `disabled` when `isGenerating`
  - Accept a `multiTurnKey` prop (number) used as the React `key` on the component to force remount and clear internal state after a successful submission
  - _Requirements: 4.4, 4.5, 5.2, 5.3_

  - [ ]* 4.1 Write unit tests for `MultiTurnInput` in `__tests__/MultiTurnInput.test.tsx`
    - Button and textarea disabled when `isGenerating=true`
    - Button label is `"✏️ 追问微调"` when idle
    - Button shows spinner + `"生成中..."` when `isGenerating=true`
    - Submitting empty string shows `"请输入追问内容"` error
    - Submitting valid text calls `onSubmit` with trimmed value
    - _Requirements: 4.4, 4.5, 5.2, 5.3_

  - [ ]* 4.2 Write property test — Property 4: Whitespace rejection (`__tests__/MultiTurnInput.property.test.tsx`)
    - **Property 4: Multi-turn textarea whitespace rejection**
    - Generator: `fc.stringMatching(/^\s+$/)` (non-empty whitespace-only strings)
    - Assert: `onSubmit` is not called; error `"请输入追问内容"` is shown
    - **Validates: Requirements 5.2**

  - [ ]* 4.3 Write property test — Property 5: Character counter accuracy (`__tests__/MultiTurnInput.property.test.tsx`)
    - **Property 5: Multi-turn character counter accuracy**
    - Generator: `fc.string({ maxLength: 500 })`
    - Assert: counter text equals `"${str.length}/500"`
    - **Validates: Requirements 4.5**

- [ ] 5. Checkpoint — Ensure all tests pass so far
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Update `Workbench` props interface and render logic
  - Extend `WorkbenchProps` in `app/components/Workbench.tsx` with: `hasGenerated: boolean`, `currentConfig: DemoConfig`, `activeTagSet: Set<string>`, `onMultiTurnGenerate: (currentInput: string) => void`
  - Import `DemoConfig` from `../config`
  - Render `MultiTurnInput` below the generate button and `apiError` only when `hasGenerated && !isGenerating`; pass `onMultiTurnGenerate` as `onSubmit` and a `multiTurnKey` prop
  - Render `AIDecisionManifest` below `MultiTurnInput` only when `hasGenerated && activeTagSet.size > 0 && !isGenerating`; pass `activeTagSet`
  - Hide both panels immediately when `isGenerating` transitions to `true` (conditional render, no transition delay)
  - _Requirements: 2.1, 2.5, 2.6, 2.7, 4.1, 4.2, 4.3, 10.1, 10.2, 10.3_

- [ ] 7. Update `DemoLayout` — derived state and multi-turn handler
  - Import `deriveActiveTags` from `app/lib/tagDerivation`
  - Derive `hasGenerated: boolean = previewKey >= 1` at render time (no new `useState`)
  - Derive `activeTagSet: Set<string> = deriveActiveTags(layoutMatrix, config.theme)` at render time (no new `useState`)
  - Add a `multiTurnKey` state (`useState<number>(0)`) that increments on each successful multi-turn submission to reset `MultiTurnInput`
  - Implement `handleMultiTurnGenerate(currentInput: string)` using the same `AbortController` + `Promise.race` timeout pattern as `handleGenerate`:
    - POST body: `{ isMultiTurn: true, previousJson: config, currentInput, carModel: selectedCarModel }`
    - On success: `setConfig(newConfig)`, `setPreviewKey(prev + 1)`, `setMultiTurnKey(prev + 1)`, `setIsGenerating(false)` — do NOT call `setIsFormSubmitted`
    - On failure: `setApiError(message)`, `setIsGenerating(false)`
  - Pass new props to `Workbench`: `hasGenerated`, `currentConfig={config}`, `activeTagSet`, `onMultiTurnGenerate={handleMultiTurnGenerate}`, `multiTurnKey`
  - _Requirements: 4.1, 4.6, 5.1, 5.4, 5.5, 5.6, 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 8. Upgrade `/api/generate` route — multi-turn branch
  - In `app/api/generate/route.ts`, add `buildMultiTurnSystemPrompt(carModel: CarModelId): string` that extends `buildSystemPrompt` with three additional instructions (preserve unchanged fields, make only targeted changes, return pure JSON with no Markdown wrapping)
  - Add `buildMultiTurnUserMessage(previousJson: DemoConfig, currentInput: string): string` that returns `"上一版布局数据：${JSON.stringify(previousJson)}\n\n新追问：${currentInput}"`; let `JSON.stringify` throw naturally (caller catches and returns HTTP 500)
  - In the `POST` handler, parse `isMultiTurn` from the request body before the existing first-turn validation
  - When `isMultiTurn === true`:
    - Validate `currentInput` (trimmed length 1–500) → 400 if invalid
    - Validate `previousJson` has all seven required fields (`theme`, `carModel`, `layoutMatrix`, `title`, `subtitle`, `sellingPoints`, `prizes`) → 400 if any missing
    - Resolve `carModel`: try `previousJson.carModel` first, fall back to `body.carModel`, return 400 if both invalid
    - Call `buildMultiTurnUserMessage` inside a try/catch → 500 if it throws
    - Call DeepSeek API with multi-turn system prompt + user message
    - Normalise `layoutMatrix` and return `DemoConfig`
  - When `isMultiTurn` is `false` or absent: existing first-turn logic is unchanged
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 8.1 Add multi-turn unit tests to `__tests__/api/generate.test.ts`
    - Multi-turn request with valid body → 200
    - Multi-turn request with missing `currentInput` → 400
    - Multi-turn request with whitespace-only `currentInput` → 400
    - Multi-turn request with `currentInput` > 500 chars → 400
    - Multi-turn request with missing `previousJson` → 400
    - Multi-turn request with `previousJson` missing `theme` field → 400
    - Multi-turn request with invalid `carModel` → 400
    - Multi-turn request with `previousJson.carModel` valid, body `carModel` invalid → uses `previousJson.carModel`
    - Multi-turn response has normalised `layoutMatrix`
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.6, 7.5_

  - [ ]* 8.2 Write property test — Property 6: API `currentInput` length validation (`__tests__/api/generate.property.test.ts`)
    - **Property 6: API multi-turn `currentInput` length validation**
    - Generator: invalid strings (empty, whitespace-only, trimmed length > 500) and valid strings (trimmed length 1–500)
    - Assert: invalid → HTTP 400; valid → not rejected for this reason
    - **Validates: Requirements 6.2**

  - [ ]* 8.3 Write property test — Property 7: API `previousJson` field validation (`__tests__/api/generate.property.test.ts`)
    - **Property 7: API multi-turn `previousJson` field validation**
    - Generator: `fc.record({...all seven fields...})` with random subsets of fields omitted
    - Assert: any missing required field → HTTP 400
    - **Validates: Requirements 6.3**

  - [ ]* 8.4 Write property test — Property 8: Multi-turn user message format (`__tests__/api/generate.property.test.ts`)
    - **Property 8: API multi-turn user message format**
    - Generator: arbitrary `DemoConfig`-shaped object + `fc.string({ minLength: 1, maxLength: 500 })`
    - Assert: `buildMultiTurnUserMessage(prev, input)` starts with `"上一版布局数据："`, contains `JSON.stringify(prev)`, then `"\n\n新追问："`, then `input`
    - **Validates: Requirements 7.3**

  - [ ]* 8.5 Write property test — Property 10: API response `layoutMatrix` always normalised (`__tests__/api/generate.property.test.ts`)
    - **Property 10: API response `layoutMatrix` is always normalised**
    - Generator: arbitrary `layoutMatrix` shapes (missing, malformed, partial) injected via mocked AI response
    - Assert: returned `layoutMatrix.componentOrder` contains all six canonical `ComponentId` values exactly once
    - **Validates: Requirements 6.5**

- [ ] 9. Final checkpoint — Ensure all tests pass
  - Run `jest --testPathPattern="tagDerivation|AIDecisionManifest|MultiTurnInput|generate"` (or the full suite) and confirm all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- `deriveActiveTags` must have zero React imports — it is imported by both client components and the API route
- The multi-turn handler in `DemoLayout` must NOT call `setIsFormSubmitted` (Requirement 10.5)
- `MultiTurnInput` clears its internal state via React `key` remount (`multiTurnKey` prop), not via a ref callback
- `PhonePreview` changes are minimal: only `initial` and `exit` props on the existing `motion.div`
- Property tests use `fast-check` v4 with `fc.assert(fc.property(...))` and a minimum of 100 runs
- The existing first-turn logic in `/api/generate` must remain completely unchanged

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1", "3.1", "3.2", "4.1", "4.2", "4.3"] },
    { "id": 2, "tasks": ["8.1", "8.2", "8.3", "8.4", "8.5"] }
  ]
}
```
