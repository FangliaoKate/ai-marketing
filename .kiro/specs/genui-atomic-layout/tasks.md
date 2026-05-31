# Implementation Plan: GenUI Atomic Layout System

## Overview

Upgrade the XPENG AI Marketing Demo phone preview from a fixed JSX template to a fully data-driven atomic layout system. The implementation proceeds in five phases: (1) core library and types, (2) AI contract upgrade, (3) atomic components, (4) Matrix Renderer wiring, and (5) integration. Each phase builds on the previous and ends with all code integrated — no orphaned modules.

## Tasks

- [x] 1. Install framer-motion and create the core atomicLayout library
  - Run `npm install framer-motion` to add framer-motion as a production dependency
  - Create `app/lib/atomicLayout.ts` with `ATOMIC_COMPONENT_IDS`, `ComponentId`, `ComponentSettings`, `LayoutMatrix`, `isComponentId`, `DEFAULT_ORDER`, and `normalizeLayoutMatrix`
  - `normalizeLayoutMatrix(raw: unknown): LayoutMatrix` must implement the five-step algorithm: guard → filter → deduplicate → complete → preserve settings
  - The module must have zero React imports — it must be safe to import from both the API route (server) and client components
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 1.1 Create `app/lib/atomicLayout.ts` with all exports
    - Export `ATOMIC_COMPONENT_IDS as const`, `ComponentId` union type, `ComponentSettings` interface, `LayoutMatrix` interface, `isComponentId` type guard, `DEFAULT_ORDER` constant, and `normalizeLayoutMatrix` pure function
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 1.2 Write property test for `isComponentId` (Property 1)
    - **Property 1: `isComponentId` is equivalent to membership in `ATOMIC_COMPONENT_IDS`**
    - **Validates: Requirements 1.5**
    - File: `__tests__/atomicLayout.test.ts`
    - Tag comment: `// Feature: genui-atomic-layout, Property 1: isComponentId is equivalent to membership in ATOMIC_COMPONENT_IDS`
    - Use `fc.string()` to generate arbitrary strings; assert `isComponentId(s) === ATOMIC_COMPONENT_IDS.includes(s as ComponentId)`

  - [ ]* 1.3 Write property test for `normalizeLayoutMatrix` fallback (Property 3)
    - **Property 3: Normalization fallback for invalid/missing `componentOrder`**
    - **Validates: Requirements 2.6, 3.2, 9.1, 9.2**
    - File: `__tests__/atomicLayout.test.ts`
    - Tag comment: `// Feature: genui-atomic-layout, Property 3: Normalization fallback for invalid/missing componentOrder`
    - Use `fc.oneof` with `undefined`, `null`, `{}`, `{ componentOrder: [] }`, `{ componentOrder: fc.string() }` as inputs; assert result equals `DEFAULT_ORDER`

  - [ ]* 1.4 Write property test for `normalizeLayoutMatrix` completeness (Property 4)
    - **Property 4: Normalization filters unknown IDs and completes to six entries**
    - **Validates: Requirements 3.3, 3.4, 3.5, 9.3, 9.5**
    - File: `__tests__/atomicLayout.test.ts`
    - Tag comment: `// Feature: genui-atomic-layout, Property 4: Normalization filters unknown IDs and completes to six entries`
    - Use `fc.array(fc.string())` as input; assert all six IDs present, no duplicates, all valid, exactly six entries

  - [ ]* 1.5 Write property test for round-trip `DemoConfig` field preservation (Property 5)
    - **Property 5: Normalization preserves existing `DemoConfig` fields**
    - **Validates: Requirements 3.6, 3.7**
    - File: `__tests__/atomicLayout.test.ts`
    - Tag comment: `// Feature: genui-atomic-layout, Property 5: Normalization preserves existing DemoConfig fields`
    - Define `arbitraryDemoConfig()` using `fc.record`; assert all non-`layoutMatrix` fields are identical after normalization

- [x] 2. Extend `DemoConfig` type and upgrade the AI system prompt
  - Extend `DemoConfig` interface in `app/config.ts` with `layoutMatrix?: LayoutMatrix` (import `LayoutMatrix` from `./lib/atomicLayout`)
  - Update `buildSystemPrompt()` in `app/api/generate/route.ts` to inject the `layoutMatrix` JSON schema block (in Chinese, matching existing prompt language) with a concrete six-component example
  - Update the POST handler in `app/api/generate/route.ts` to call `normalizeLayoutMatrix(parsed?.layoutMatrix)` and spread the result into the response: `return Response.json({ ...parsed, layoutMatrix: normalized }, { status: 200 })`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 8.1_

  - [x] 2.1 Extend `DemoConfig` in `app/config.ts` with `layoutMatrix?: LayoutMatrix`
    - Add `import type { LayoutMatrix } from './lib/atomicLayout'` at the top of `app/config.ts`
    - Add `layoutMatrix?: LayoutMatrix` as an optional field to the `DemoConfig` interface
    - _Requirements: 8.1_

  - [x] 2.2 Update `buildSystemPrompt()` and POST handler in `app/api/generate/route.ts`
    - Import `normalizeLayoutMatrix` from `@/app/lib/atomicLayout`
    - Append the `layoutMatrix` schema block (Chinese, with concrete example covering all six IDs and at least one `componentSettings` entry) to the system prompt string
    - After `JSON.parse(aiContent)`, call `normalizeLayoutMatrix(parsed?.layoutMatrix)` and return `{ ...parsed, layoutMatrix: normalized }`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ]* 2.3 Write property test for `buildSystemPrompt` containing all six component IDs (Property 2)
    - **Property 2: `buildSystemPrompt` always mentions all six component IDs**
    - **Validates: Requirements 2.1, 2.2**
    - File: `__tests__/api/generate.test.ts` (add to existing file)
    - Tag comment: `// Feature: genui-atomic-layout, Property 2: buildSystemPrompt always mentions all six component IDs`
    - Use `fc.constantFrom(...CAR_MODEL_IDS)` to generate car models; mock `global.fetch`, call `POST`, extract system prompt from captured fetch body, assert all six `ComponentId` values appear in the prompt string

  - [ ]* 2.4 Write unit tests for `normalizeLayoutMatrix` in the API route response
    - File: `__tests__/api/generate.test.ts` (add to existing file)
    - Test: AI response missing `layoutMatrix` → response contains `DEFAULT_ORDER`
    - Test: AI response with partial/invalid `componentOrder` → response contains all six IDs
    - Test: AI response with duplicate IDs → response deduplicates correctly
    - Test: All existing `DemoConfig` fields (`theme`, `carModel`, `tag`, `title`, `subtitle`, `sellingPoints`, `prizes`) are preserved unchanged
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 3. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement the four new atomic components
  - Create `app/components/atomic/` directory
  - Create `app/components/atomic/BrandHeader.tsx`, `CarStage.tsx`, `CampaignInfo.tsx`, `SellingPoints.tsx`
  - Create `app/components/atomic/index.ts` exporting `ATOMIC_COMPONENT_MAP` and all components
  - All components accept `AtomicComponentProps` (`config`, `tokens`, `settings`, `isFormSubmitted?`, `onSubmitSuccess?`) and are pure functions of their props
  - `SpinWheel` and `LeadForm` are NOT moved — they are imported from their existing locations and referenced in `ATOMIC_COMPONENT_MAP`
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10_

  - [x] 4.1 Create `app/components/atomic/BrandHeader.tsx`
    - Add `'use client'` directive
    - Accept `AtomicComponentProps`; render XPENG brand identity bar: logo text (`⚡ XPENG 小鹏汽车官方活动`) and tag badge using `tokens.primary` / `tokens.secondary` / `tokens.haloColor`
    - Extract the brand header JSX from the existing `PhonePreview.tsx` as the starting point
    - _Requirements: 4.1_

  - [x] 4.2 Create `app/components/atomic/CarStage.tsx`
    - Add `'use client'` directive
    - Accept `AtomicComponentProps`; render car model name and halo/gradient visual stage using `tokens.haloColor` and `tokens.primary`
    - WHEN `settings.isBackground === true`, apply `opacity: 0.4` (or lower) via inline style so the component serves as a background texture layer
    - _Requirements: 4.2, 4.3_

  - [x] 4.3 Create `app/components/atomic/CampaignInfo.tsx`
    - Add `'use client'` directive
    - Accept `AtomicComponentProps`; render `config.title` as `<h1>` primary headline and `config.subtitle` as secondary line using `tokens.primary` for subtitle color
    - Extract the title area JSX from the existing `PhonePreview.tsx` as the starting point
    - _Requirements: 4.4_

  - [x] 4.4 Create `app/components/atomic/SellingPoints.tsx`
    - Add `'use client'` directive
    - Accept `AtomicComponentProps`; render `config.sellingPoints` as a card collection
    - WHEN `settings.displayType === "grid"`, render cards in a two-column CSS grid (`grid grid-cols-2`)
    - For all other `displayType` values (including `"list"`, `undefined`, or any unknown value), render cards in a single-column vertical list (`flex flex-col`)
    - Extract the selling points JSX from the existing `PhonePreview.tsx` as the starting point
    - _Requirements: 4.5, 4.6, 4.7_

  - [x] 4.5 Create `app/components/atomic/index.ts`
    - Import `BrandHeader`, `CarStage`, `CampaignInfo`, `SellingPoints` from their respective files
    - Import `SpinWheel` from `../SpinWheel` and `LeadForm` from `../LeadForm` (no file moves)
    - Export `ATOMIC_COMPONENT_MAP: Record<ComponentId, React.ComponentType<AtomicComponentProps>>` mapping all six IDs to their components
    - Export all four new components and re-export `AtomicComponentProps` type
    - _Requirements: 4.8, 4.9, 4.10_

  - [ ]* 4.6 Write unit tests for `BrandHeader` and `CarStage`
    - File: `__tests__/atomic/BrandHeader.test.tsx` and `__tests__/atomic/CarStage.test.tsx`
    - `BrandHeader`: renders `config.tag` badge and brand logo text
    - `CarStage`: renders `config.carModel`; when `settings.isBackground = true`, the wrapper has `opacity ≤ 0.4`
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 4.7 Write property test for `CampaignInfo` (Property 13)
    - **Property 13: `CampaignInfo` renders both `title` and `subtitle` for any config**
    - **Validates: Requirements 4.4**
    - File: `__tests__/atomic/CampaignInfo.test.tsx`
    - Tag comment: `// Feature: genui-atomic-layout, Property 13: CampaignInfo renders both title and subtitle for any config`
    - Use `fc.record({ title: fc.string({ minLength: 1 }), subtitle: fc.string({ minLength: 1 }), ... })` to generate configs; assert both strings appear in rendered output

  - [ ]* 4.8 Write property test for `SellingPoints` (Property 12)
    - **Property 12: `SellingPoints` renders all selling points regardless of `displayType`**
    - **Validates: Requirements 4.5, 4.7**
    - File: `__tests__/atomic/SellingPoints.test.tsx`
    - Tag comment: `// Feature: genui-atomic-layout, Property 12: SellingPoints renders all selling points regardless of displayType`
    - Use `fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 5 })` for selling points and `fc.option(fc.constantFrom('grid', 'list'))` for `displayType`; assert all strings appear in rendered output

- [x] 5. Implement the Matrix Renderer (refactor `PhonePreview`) and wire `DemoLayout`
  - Refactor `app/components/PhonePreview.tsx` to replace all hardcoded JSX sections with the `AnimatePresence` + `motion.div` loop
  - Add `layoutMatrix: LayoutMatrix` prop to `PhonePreview`'s props interface
  - Implement `resolveAnimateProps(settings: ComponentSettings): { scale: number; opacity: number }` as a pure helper inside `PhonePreview.tsx`
  - Apply `layout`, `layoutId={componentId}`, `animate={{ scale, opacity }}`, and `transition={SPRING}` to each `motion.div` wrapper
  - Update `app/components/DemoLayout.tsx` to derive `layoutMatrix` from `config.layoutMatrix` via `normalizeLayoutMatrix` at render time (no new state variable) and pass it to `PhonePreview`
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 8.2, 8.3, 8.4, 8.5_

  - [x] 5.1 Refactor `app/components/PhonePreview.tsx` into the Matrix Renderer
    - Add `'use client'` directive (already present)
    - Import `AnimatePresence`, `motion` from `framer-motion`
    - Import `ATOMIC_COMPONENT_MAP` from `./atomic`
    - Import `LayoutMatrix`, `ComponentSettings`, `normalizeLayoutMatrix` from `@/app/lib/atomicLayout`
    - Add `layoutMatrix: LayoutMatrix` to `PhonePreviewProps`
    - Implement `resolveAnimateProps`: `scale` → `1.15` for `"large"`, `0.9` for `"small"`, `1.0` otherwise; `opacity` → `1.0` if `highlight === true`, `0.35` if `isBackground === true` (and highlight not true), `0.85` otherwise
    - Define `const SPRING = { type: 'spring', stiffness: 200, damping: 25 } as const`
    - Replace all hardcoded JSX sections (brand header, title area, selling points, lead form, spin wheel) with the `AnimatePresence` loop over `layoutMatrix.componentOrder`
    - Each iteration: look up `ATOMIC_COMPONENT_MAP[componentId]`, skip if undefined, wrap in `<motion.div key={componentId} layoutId={componentId} layout animate={{ scale, opacity }} transition={SPRING}>`
    - Pass `config`, `tokens={themeTokens}`, `settings`, `isFormSubmitted`, `onSubmitSuccess={onFormSubmit}` to each component
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 8.2_

  - [x] 5.2 Update `app/components/DemoLayout.tsx` to derive and pass `layoutMatrix`
    - Import `LayoutMatrix`, `normalizeLayoutMatrix` from `@/app/lib/atomicLayout`
    - Add `const layoutMatrix: LayoutMatrix = normalizeLayoutMatrix(config.layoutMatrix)` as a derived value (no `useState`)
    - Pass `layoutMatrix={layoutMatrix}` to `<PhonePreview>`
    - Do NOT introduce any new state variable for `layoutMatrix`
    - _Requirements: 8.3, 8.4, 8.5_

  - [ ]* 5.3 Write property test for `resolveAnimateProps` scale (Property 9)
    - **Property 9: Scale animation value is determined solely by `settings.scale`**
    - **Validates: Requirements 7.1, 7.2, 7.3**
    - File: `__tests__/atomicLayout.test.ts` (or a dedicated `__tests__/resolveAnimateProps.test.ts`)
    - Tag comment: `// Feature: genui-atomic-layout, Property 9: Scale animation value is determined solely by settings.scale`
    - Export `resolveAnimateProps` from `PhonePreview.tsx` or extract it to `atomicLayout.ts`; use `fc.record({ scale: fc.option(fc.constantFrom('large', 'small', 'other')) })` to generate settings; assert scale values match the lookup table

  - [ ]* 5.4 Write property test for `resolveAnimateProps` opacity (Property 10)
    - **Property 10: Opacity animation respects `highlight` and `isBackground` precedence**
    - **Validates: Requirements 7.4, 7.5, 7.7, 7.8**
    - File: same file as 5.3
    - Tag comment: `// Feature: genui-atomic-layout, Property 10: Opacity animation respects highlight and isBackground precedence`
    - Use `fc.record({ highlight: fc.option(fc.boolean()), isBackground: fc.option(fc.boolean()) })` to generate settings; assert opacity follows the precedence table: `highlight=true → 1.0`, `isBackground=true (highlight absent/false) → 0.35`, otherwise `0.85`

  - [ ]* 5.5 Write property test for Matrix Renderer rendering exactly six components (Property 6)
    - **Property 6: Matrix Renderer renders exactly six components for any valid `LayoutMatrix`**
    - **Validates: Requirements 5.5, 9.5**
    - File: `__tests__/PhonePreview.test.tsx` (update existing file)
    - Tag comment: `// Feature: genui-atomic-layout, Property 6: Matrix Renderer renders exactly six components for any valid LayoutMatrix`
    - Generate arbitrary `componentOrder` arrays using `fc.array(fc.string())`; pass through `normalizeLayoutMatrix` to get a valid `LayoutMatrix`; render `PhonePreview`; assert exactly six `motion.div` wrappers (or six atomic component root elements) are in the DOM

  - [ ]* 5.6 Write property test for Matrix Renderer order preservation (Property 7)
    - **Property 7: Matrix Renderer preserves `componentOrder` sequence**
    - **Validates: Requirements 5.1, 5.2**
    - File: `__tests__/PhonePreview.test.tsx`
    - Tag comment: `// Feature: genui-atomic-layout, Property 7: Matrix Renderer preserves componentOrder sequence`
    - Generate permutations of the six valid `ComponentId` values using `fc.shuffledSubarray(ATOMIC_COMPONENT_IDS, { minLength: 6, maxLength: 6 })`; render `PhonePreview`; assert the top-to-bottom DOM order of rendered component wrappers matches the input `componentOrder`

  - [ ]* 5.7 Write property test for Matrix Renderer settings pass-through (Property 8)
    - **Property 8: Matrix Renderer passes correct `settings` to each component**
    - **Validates: Requirements 5.3, 5.4**
    - File: `__tests__/PhonePreview.test.tsx`
    - Tag comment: `// Feature: genui-atomic-layout, Property 8: Matrix Renderer passes correct settings to each component`
    - Generate `LayoutMatrix` with arbitrary `componentSettings` entries; render `PhonePreview`; assert each rendered component receives the correct `settings` (use `data-testid` or accessible roles to identify components and inspect their rendered output)

  - [ ]* 5.8 Write property test for `DemoLayout` always passing a complete `LayoutMatrix` (Property 11)
    - **Property 11: `DemoLayout` always passes a complete `LayoutMatrix` to `PhonePreview`**
    - **Validates: Requirements 8.3, 8.4**
    - File: `__tests__/DemoLayout.test.tsx` (update existing file)
    - Tag comment: `// Feature: genui-atomic-layout, Property 11: DemoLayout always passes a complete LayoutMatrix to PhonePreview`
    - Generate `DemoConfig` objects with and without `layoutMatrix` (including `undefined`, partial, and malformed values); render `DemoLayout`; assert the phone preview always renders exactly six atomic component wrappers

- [x] 6. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- `resolveAnimateProps` should be exported from `app/lib/atomicLayout.ts` (or from `PhonePreview.tsx`) so it can be unit-tested directly without rendering a component
- framer-motion `layout` animations are visual and cannot be unit-tested; manual inspection during development is the verification method
- The `SpinWheel` and `LeadForm` components are reused as-is via cast in `ATOMIC_COMPONENT_MAP` — no file moves required
- The `normalizeLayoutMatrix` function is called at both the API layer (server) and `DemoLayout` render layer (client) as a belt-and-suspenders guarantee
- Property tests use `fast-check` (already in `devDependencies`); minimum 100 runs per property (fast-check default)
- All property test files must include the tag comment: `// Feature: genui-atomic-layout, Property N: <property_text>`
- The `__tests__/atomic/` directory must be created for the four new atomic component test files; Jest's `jsdom` project already matches `**/__tests__/**/*.test.tsx`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "1.5", "2.1"] },
    { "id": 2, "tasks": ["2.2"] },
    { "id": 3, "tasks": ["2.3", "2.4", "4.1", "4.2", "4.3", "4.4"] },
    { "id": 4, "tasks": ["4.5", "4.6", "4.7", "4.8"] },
    { "id": 5, "tasks": ["5.1"] },
    { "id": 6, "tasks": ["5.2", "5.3", "5.4"] },
    { "id": 7, "tasks": ["5.5", "5.6", "5.7", "5.8"] }
  ]
}
```
