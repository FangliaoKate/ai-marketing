# Requirements Document

## Introduction

This feature extends the existing Next.js AI marketing demo app with four interconnected capabilities:

1. **AI Decision Manifest Panel** — After the phone preview renders, a set of read-only colorful capsule tags lights up in the left workbench, giving sales reps an instant visual explanation of the AI's layout decisions derived from the returned `layoutMatrix`.
2. **Multi-turn Prompt Workspace** — After the first H5 is generated, a follow-up input box unlocks below the generate button, letting sales reps refine the layout in natural language without touching code.
3. **Context-Aware API** — The `/api/generate` endpoint is upgraded from stateless to context-aware: multi-turn requests carry the previous config JSON and the new instruction, and the backend system prompt enforces incremental, non-destructive updates.
4. **Fluid UI with Framer Motion** — All atomic components are wrapped in `<motion.div layout />` containers so that when the AI returns a new layout matrix, components animate smoothly into their new positions rather than flashing.

The app already uses Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, and Framer Motion v12. The atomic component pipeline (`atomicLayout.ts`, `PhonePreview.tsx`, `DemoLayout.tsx`, `Workbench.tsx`) and the `/api/generate` route are the primary integration points.

---

## Glossary

- **AI_Decision_Manifest**: The read-only capsule-tag panel rendered at the bottom of the left workbench that visualises which layout decisions the AI made.
- **Decision_Tag**: A single coloured pill/capsule element inside the AI_Decision_Manifest. Each tag has a fixed label and lights up (active state) or stays dim (inactive state) based on the current `LayoutMatrix`.
- **Tag_Derivation_Rule**: The pure mapping function that reads a `LayoutMatrix` and a `theme` string and returns the set of active `Decision_Tag` identifiers.
- **Multi_Turn_Input**: The follow-up text input that unlocks in the left workbench after the first successful generation.
- **Multi_Turn_Request**: A POST body sent to `/api/generate` that includes `isMultiTurn: true`, `previousJson`, and `currentInput`.
- **Context_Aware_API**: The upgraded `/api/generate` endpoint that handles both first-turn and multi-turn requests.
- **Fluid_UI**: The Framer Motion–powered animation layer that interpolates component positions and sizes when the `LayoutMatrix` changes.
- **LayoutMatrix**: The existing `{ componentOrder, componentSettings }` object defined in `app/lib/atomicLayout.ts`.
- **DemoConfig**: The full JSON config object returned by the API, defined in `app/config.ts`.
- **Workbench**: The left-panel React component (`app/components/Workbench.tsx`).
- **PhonePreview**: The right-panel React component (`app/components/PhonePreview.tsx`).
- **DemoLayout**: The orchestrating React component (`app/components/DemoLayout.tsx`) that owns shared state.
- **AtomicComponent**: Any of the six components rendered inside `PhonePreview`: `brand_header`, `car_stage`, `campaign_info`, `selling_points`, `lucky_wheel`, `lead_form`.

---

## Requirements

### Requirement 1: Tag Derivation Logic

**User Story:** As a sales rep (Fellow), I want to see which layout decisions the AI made, so that I can instantly understand why the phone preview looks the way it does.

#### Acceptance Criteria

1. THE `Tag_Derivation_Rule` SHALL derive the active tag set from a `LayoutMatrix` and a `theme` string using the following rules (absent keys evaluate to false):
   - `[🎯 大转盘视觉 C 位]` is active WHEN `lucky_wheel` appears at index 0 of `componentOrder` OR `componentSettings.lucky_wheel.scale` equals `"large"`.
   - `[🚗 车身退为科技背景]` is active WHEN `componentSettings.car_stage.isBackground` equals `true`.
   - `[📖 触发横滑杂志画册流]` is active WHEN `componentSettings.selling_points.displayType` equals `"grid"`.
   - `[💎 注入新豪华绿金调]` is active WHEN the `theme` parameter equals `"luxury_ai"`.
   - `[🔥 开启高频裂变色系]` is active WHEN the `theme` parameter equals `"pop_active"` OR `"sport_tech"`.
   - `[☕ 匹配接地气 Fellow 话术]` is active WHEN `componentSettings.campaign_info` exists AND `componentSettings.campaign_info.highlight` equals `true`.
2. THE `Tag_Derivation_Rule` SHALL return a `Set<string>` containing exactly the tag identifiers from the six tags enumerated in criterion 1 that evaluate to active; no other identifiers SHALL appear in the returned set.
3. WHEN the `LayoutMatrix` is `null` or `undefined`, THE `Tag_Derivation_Rule` SHALL return an empty set.
4. THE `Tag_Derivation_Rule` SHALL be a pure function with no side effects.
5. WHEN the `theme` parameter is a string that does not match any of the recognised values (`"luxury_ai"`, `"pop_active"`, `"sport_tech"`), THE `Tag_Derivation_Rule` SHALL treat all theme-based tag conditions as false and SHALL NOT throw an error.

---

### Requirement 2: AI Decision Manifest Panel — Display

**User Story:** As a Fellow, I want to see the AI's decision tags light up after the phone preview renders, so that I can explain the layout logic to customers.

#### Acceptance Criteria

1. WHEN `previewKey` has incremented to a value ≥ 1 AND the active tag set derived by `Tag_Derivation_Rule` is non-empty, THE `AI_Decision_Manifest` SHALL become visible in the left workbench.
2. WHILE the `AI_Decision_Manifest` is visible, THE `AI_Decision_Manifest` SHALL display all six `Decision_Tag` elements simultaneously: `[🎯 大转盘视觉 C 位]`, `[🚗 车身退为科技背景]`, `[📖 触发横滑杂志画册流]`, `[💎 注入新豪华绿金调]`, `[🔥 开启高频裂变色系]`, `[☕ 匹配接地气 Fellow 话术]`.
3. WHILE the `AI_Decision_Manifest` is visible, each `Decision_Tag` SHALL render in an active (opacity 1.0, category-specific colour) state if its tag identifier is in the active set returned by `Tag_Derivation_Rule`, and in an inactive (opacity ≤ 0.35, neutral grey) state otherwise.
4. THE `AI_Decision_Manifest` SHALL NOT render any interactive controls — tags MUST NOT be clickable or focusable by the user (no `onClick`, `onKeyDown`, `tabIndex`, or `role="button"` attributes).
5. WHEN `isGenerating` transitions to `true`, THE `AI_Decision_Manifest` SHALL immediately become hidden (no transition delay).
6. THE `AI_Decision_Manifest` SHALL be positioned at the bottom of the left workbench panel, below the generate button and any error messages.
7. WHEN the active tag set is empty, THE `AI_Decision_Manifest` SHALL NOT be rendered (the entire panel is hidden, not shown with all tags dimmed).
8. THE active tag set for a given render SHALL be computed by calling `Tag_Derivation_Rule(layoutMatrix, config.theme)` where `layoutMatrix` and `config` are the current values held in `DemoLayout` state.

---

### Requirement 3: AI Decision Manifest Panel — Tag Styling

**User Story:** As a Fellow, I want each tag category to have a distinct colour, so that I can visually distinguish layout tags from style tags at a glance.

#### Acceptance Criteria

1. IF a layout-control tag (`[🎯 大转盘视觉 C 位]`, `[🚗 车身退为科技背景]`, `[📖 触发横滑杂志画册流]`) is active, THEN THE `Decision_Tag` SHALL render with a blue or indigo background colour (e.g., `bg-indigo-500` or equivalent) and white or light text, visually distinct from inactive tags and from style/tone tags.
2. IF a style/tone tag (`[💎 注入新豪华绿金调]`, `[🔥 开启高频裂变色系]`, `[☕ 匹配接地气 Fellow 话术]`) is active, THEN THE `Decision_Tag` SHALL render with a green or amber background colour (e.g., `bg-emerald-500` or `bg-amber-500`) and white or dark text, visually distinct from inactive tags and from layout-control tags.
3. WHEN a `Decision_Tag` is inactive, THE `Decision_Tag` SHALL render with opacity ≤ 0.35 and a neutral grey colour in the range #9CA3AF–#D1D5DB (Tailwind `gray-400` to `gray-300`); WHEN a `Decision_Tag` is active, THE `Decision_Tag` SHALL render at opacity 1.0 using its category-specific colour and SHALL NOT use neutral grey.
4. IF the section label text (e.g., "🧠 AI 决策解读") is empty or undefined at render time, THEN THE `AI_Decision_Manifest` SHALL hide the entire panel.
5. A `Decision_Tag` is considered "active" for styling purposes if and only if its tag identifier string is present in the active tag set returned by `Tag_Derivation_Rule` for the current `LayoutMatrix` and `theme`.

---

### Requirement 4: Multi-turn Prompt Workspace — Unlock

**User Story:** As a Fellow, I want a follow-up input box to appear after the first H5 is generated, so that I can refine the layout without starting over.

#### Acceptance Criteria

1. WHEN `previewKey` is ≥ 1 (at least one successful API response has been received), THE `Workbench` SHALL render the `Multi_Turn_Input` area below the generate button.
2. WHILE `isGenerating` is `true`, THE `Multi_Turn_Input` textarea SHALL have the `disabled` attribute set and the submit button SHALL have the `disabled` attribute set, making both non-interactive.
3. WHEN `previewKey` equals `0` (no generation has occurred yet), THE `Multi_Turn_Input` area SHALL NOT be rendered in the DOM.
4. THE `Multi_Turn_Input` area SHALL include a textarea for the refinement instruction and a submit button labelled "✏️ 追问微调".
5. THE `Multi_Turn_Input` textarea SHALL have a `maxLength` of 500 characters and display a character counter in the format `{n}/500`.
6. WHEN the Fellow clicks "✏️ 追问微调" with a non-empty, non-whitespace-only refinement instruction, THE `Workbench` SHALL invoke the multi-turn submit handler provided by `DemoLayout`.

---

### Requirement 5: Multi-turn Prompt Workspace — Submission

**User Story:** As a Fellow, I want my refinement instruction to be sent to the AI along with the previous layout, so that the AI makes targeted changes rather than starting from scratch.

#### Acceptance Criteria

1. WHEN the Fellow clicks "✏️ 追问微调" with a non-empty, non-whitespace-only refinement instruction, THE `DemoLayout` SHALL call the generate handler with `isMultiTurn: true`, `previousJson` set to the current `DemoConfig`, and `currentInput` set to the trimmed refinement text.
2. IF the refinement instruction textarea is empty or whitespace-only at submit time, THEN THE `Workbench` SHALL NOT invoke the submit handler and SHALL display the inline validation error "请输入追问内容".
3. WHEN a multi-turn submission is in progress (`isGenerating` is `true`), THE `Workbench` SHALL render the submit button with a spinner icon, the label "生成中...", and the `disabled` attribute set.
4. WHEN a multi-turn submission succeeds, THE `Multi_Turn_Input` textarea SHALL be cleared to an empty string.
5. WHEN a multi-turn submission fails, THE `Workbench` SHALL display the mapped API error message below the `Multi_Turn_Input` area, replacing any previously displayed multi-turn error.
6. WHEN a new multi-turn submission begins, THE `Workbench` SHALL clear any previously displayed multi-turn error message before the request is sent.

---

### Requirement 6: Context-Aware API — Request Contract

**User Story:** As a developer, I want the `/api/generate` endpoint to accept multi-turn context, so that the AI can make incremental layout changes.

#### Acceptance Criteria

1. THE `Context_Aware_API` SHALL accept a POST body with the following shape for multi-turn requests:
   ```json
   {
     "isMultiTurn": true,
     "previousJson": { "...full DemoConfig..." },
     "currentInput": "user refinement instruction"
   }
   ```
2. WHEN `isMultiTurn` is `true`, THE `Context_Aware_API` SHALL validate that `currentInput` is a string with length between 1 and 500 characters (inclusive, after trimming); IF `currentInput` is absent, empty, whitespace-only, or exceeds 500 characters, THEN THE `Context_Aware_API` SHALL return HTTP 400.
3. WHEN `isMultiTurn` is `true`, THE `Context_Aware_API` SHALL validate that `previousJson` is a non-null object containing at minimum the fields `theme` (string), `carModel` (string), `layoutMatrix` (object), `title` (string), `subtitle` (string), `sellingPoints` (array), and `prizes` (array); IF `previousJson` is absent, not an object, or missing any of these fields, THEN THE `Context_Aware_API` SHALL return HTTP 400.
4. WHEN `isMultiTurn` is `false` or absent, THE `Context_Aware_API` SHALL require `userInput` (non-empty string, max 500 chars) and `carModel` (string matching a recognised car model identifier); SHALL return HTTP 400 if either is absent or invalid; and SHALL ignore any `previousJson` or `currentInput` fields that may be present.
5. THE `Context_Aware_API` SHALL normalise the `layoutMatrix` in the returned `DemoConfig` using `normalizeLayoutMatrix` for both first-turn and multi-turn responses.
6. WHEN `isMultiTurn` is `true`, THE `Context_Aware_API` SHALL also require `carModel` to be present and match a recognised car model identifier; IF `carModel` is absent or does not match any identifier in the `CAR_MODEL_IDS` set, THE `Context_Aware_API` SHALL return HTTP 400.

---

### Requirement 7: Context-Aware API — Multi-turn System Prompt

**User Story:** As a developer, I want the backend system prompt to enforce incremental updates, so that the AI preserves marketing copy the Fellow was happy with.

#### Acceptance Criteria

1. WHEN `isMultiTurn` is `true`, THE `Context_Aware_API` SHALL append the following observable behaviours to the system prompt sent to the DeepSeek API:
   - Instruction to preserve all fields from `previousJson` that the user did not explicitly request to change.
   - Instruction to make only targeted changes based on `currentInput` (e.g., reorder `componentOrder`, adjust `componentSettings` scale/highlight values, or update `theme`).
   - Instruction to return only the modified pure JSON object with no Markdown wrapping.
2. IF the multi-turn system prompt cannot be constructed (e.g., `previousJson` serialisation throws), THEN THE `Context_Aware_API` SHALL return HTTP 500 and SHALL NOT forward the request to the DeepSeek API.
3. WHEN `isMultiTurn` is `true`, THE `Context_Aware_API` SHALL include the serialised `previousJson` in the user message sent to the DeepSeek API, formatted as: `"上一版布局数据：{serialised previousJson}\n\n新追问：{currentInput}"`.
4. WHEN `isMultiTurn` is `true`, THE `Context_Aware_API` SHALL use `currentInput` as the primary user instruction in the user message, not `userInput`.
5. WHEN `isMultiTurn` is `true`, THE `Context_Aware_API` SHALL derive the `carModel` for system prompt construction from `previousJson.carModel`; IF `previousJson.carModel` is absent or not a recognised car model identifier, THE `Context_Aware_API` SHALL fall back to the `carModel` field in the request body; IF both are absent or invalid, THE `Context_Aware_API` SHALL return HTTP 400.

---

### Requirement 8: Fluid UI — Motion Wrappers

**User Story:** As a Fellow, I want components to animate smoothly when the layout changes, so that the AI's role as "chief designer" is visually evident.

#### Acceptance Criteria

1. THE `PhonePreview` SHALL wrap each `AtomicComponent` in a `<motion.div>` with the `layout` prop and a `layoutId` equal to the component's `ComponentId` string.
2. WHEN the `LayoutMatrix.componentOrder` changes between renders, THE `PhonePreview` SHALL animate each `AtomicComponent` continuously from its previous rendered position to its new position using Framer Motion's layout animation; no component SHALL disappear and reappear at the new position without an intermediate animation.
3. WHEN `componentSettings.lucky_wheel.scale` changes between renders, THE `PhonePreview` SHALL animate the `lucky_wheel` component's scale using a spring transition with `stiffness: 200` and `damping: 25`; IF the scale value is unchanged, no scale animation SHALL be triggered.
4. WHEN `componentSettings.car_stage.isBackground` transitions from `false` (or absent) to `true`, THE `PhonePreview` SHALL animate the `car_stage` component's opacity from `0.85` to `0.35` using a spring transition with `stiffness: 200` and `damping: 25`.
5. THE `PhonePreview` SHALL NOT remount individual `AtomicComponent` wrappers when `previewKey` changes — the `previewKey` prop SHALL only reset the scroll container's scroll offset to 0px and trigger the fade-in CSS animation on the scroll container element.

---

### Requirement 9: Fluid UI — Animation Parameters

**User Story:** As a Fellow, I want the animations to feel physical and premium, so that the demo impresses customers.

#### Acceptance Criteria

1. THE `PhonePreview` SHALL use a single shared spring transition constant (`stiffness: 200, damping: 25`) for all `AtomicComponent` layout, scale, and opacity animations.
2. WHEN `lucky_wheel` moves from the first position in `componentOrder` to a later position, THE `PhonePreview` SHALL animate the component downward using Framer Motion's `layout` prop (no manual `transform` or `top`/`translateY` style).
3. WHEN `car_stage` transitions from `isBackground: false` (or absent, treated as false) to `isBackground: true`, THE `PhonePreview` SHALL animate its opacity from `0.85` to `0.35` using the shared spring constant.
4. THE `PhonePreview` SHALL use `AnimatePresence` to handle components entering and leaving the visible order; entering components SHALL animate in with `opacity: 0 → 1` and `scale: 0.95 → 1` using the shared spring constant; exiting components SHALL animate out with `opacity: 1 → 0` and `scale: 1 → 0.95` using the shared spring constant.

---

### Requirement 10: Integration — DemoLayout State Management

**User Story:** As a developer, I want DemoLayout to own all shared state for the new features, so that Workbench and PhonePreview remain focused on presentation.

#### Acceptance Criteria

1. THE `DemoLayout` SHALL derive a `hasGenerated` boolean (true when `previewKey ≥ 1`) and pass it to `Workbench` as a prop to control `Multi_Turn_Input` visibility.
2. THE `DemoLayout` SHALL pass the current `DemoConfig` to `Workbench` as a prop so that `Workbench` can include it as `previousJson` in multi-turn submissions without `Workbench` maintaining its own copy of the config.
3. THE `DemoLayout` SHALL compute the active tag set by calling `Tag_Derivation_Rule(layoutMatrix, config.theme)` and pass the result to `Workbench` as a prop for rendering in the `AI_Decision_Manifest`.
4. WHEN a multi-turn submission succeeds, THE `DemoLayout` SHALL update `config` with the new `DemoConfig` returned by the API and increment `previewKey` by 1.
5. THE `DemoLayout` SHALL NOT reset `isFormSubmitted` to `false` when processing a multi-turn update — the form submission state is independent of layout changes.
