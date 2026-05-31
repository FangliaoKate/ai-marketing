# Design Document: xpeng-ai-marketing-demo

## Overview

This feature extends the existing single-model (小鹏 GX) AI marketing H5 demo into a five-model platform. The core change is introducing a shared car-model knowledge base that drives three interconnected subsystems: the Workbench (model selection + prompt input), the GenerateAPI (dynamic system-prompt injection), and the PhonePreview (theme-driven visual rendering).

The architecture follows the existing data-contract pattern: `DemoConfig` JSON flows from the API through `DemoLayout` state down to `PhonePreview` child components. The extension adds a `selectedCarModel` state at the `DemoLayout` level that propagates to both `Workbench` (for UI) and the fetch call (for the API request body).

**Key design decisions:**

- A single `CAR_MODEL_MAP` constant in `app/config.ts` is the single source of truth for all car-model metadata (ID, display name, tag, selling points, theme). Both the frontend and the API route import from this map, eliminating any risk of front/back-end drift.
- The ThemeEngine is a pure function `getThemeTokens(theme: Theme): ThemeTokens` that maps a theme ID to a set of CSS color strings. Components consume these tokens via inline styles, avoiding Tailwind's JIT purge limitations with dynamic class names.
- The 30-second API timeout is implemented client-side using `AbortController` + `Promise.race`, since `maxDuration` is a deployment-platform hint and not a reliable runtime guard in local dev.


## Architecture

The system is a Next.js 16 App Router application. All UI is client-side (`'use client'`); the only server-side code is the Route Handler at `app/api/generate/route.ts`.

```mermaid
graph TD
    subgraph Client
        DL[DemoLayout\nstate: selectedCarModel, config, isGenerating, previewKey, isFormSubmitted]
        WB[Workbench\nModelSelector + PromptInput + GenerateButton + StepsUI]
        PP[PhonePreview\nThemeEngine + SellingPointCards + LeadForm + SpinWheel]
    end

    subgraph Server
        API[/api/generate\nPOST Route Handler]
        KB[CAR_MODEL_MAP\nshared config]
    end

    DL -->|selectedCarModel, isGenerating| WB
    WB -->|onModelChange, onGenerate| DL
    DL -->|config, previewKey, themeTokens| PP
    PP -->|onFormSubmit| DL
    DL -->|POST {userInput, carModel}| API
    API -->|DemoConfig JSON| DL
    KB -.->|imported by| API
    KB -.->|imported by| WB
```

**Data flow for a generation cycle:**

1. User selects a car model in `ModelSelector` → `DemoLayout.selectedCarModel` updates
2. User types in `PromptInput` and clicks `GenerateButton`
3. `DemoLayout.handleGenerate` fires: sets `isGenerating=true`, starts `AbortController` timer, sends `POST /api/generate` with `{userInput, carModel}`
4. `StepsUI` animates; API calls DeepSeek with a model-specific system prompt
5. Both animation and API resolve → `DemoLayout` sets new `config`, increments `previewKey`, sets `isGenerating=false`
6. `PhonePreview` remounts (new `previewKey`), `ThemeEngine` derives tokens from `config.theme`, all child components re-render with new data


## Components and Interfaces

### `app/config.ts` — Shared Knowledge Base

Extended to export the car-model map and theme token map used by both frontend and backend.

```typescript
export type CarModelId = 'gx' | 'x9' | 'g6' | 'p7i' | 'm03';
export type Theme = 'luxury_ai' | 'cyber_future' | 'pop_active' | 'sport_tech' | 'youth_trend';

export interface CarModelMeta {
  id: CarModelId;
  displayName: string;       // e.g. "小鹏 GX"
  tag: string;               // official tag, e.g. "AI新豪华大六座SUV旗舰"
  sellingPoints: string[];   // 3 core selling point keywords for system prompt
  theme: Theme;
  promptPlaceholder: string; // example prompt shown as textarea placeholder
}

export interface ThemeTokens {
  bg: string;          // page background color
  primary: string;     // primary accent color
  secondary: string;   // secondary accent color
  haloColor: string;   // brand header radial gradient color (rgba)
  cardBorder: string;  // selling point card border color
  buttonGradient: string; // CSS gradient for form submit button
  sectorColors: [string, string]; // alternating spin wheel sector colors
  pointerColor: string;  // spin wheel pointer fill color
  ringColor: string;     // spin wheel outer ring stroke color
}

export const CAR_MODEL_MAP: Record<CarModelId, CarModelMeta> = { /* ... */ };
export const THEME_MAP: Record<Theme, ThemeTokens> = { /* ... */ };

export function getThemeTokens(theme: string): ThemeTokens {
  return THEME_MAP[theme as Theme] ?? THEME_MAP['luxury_ai'];
}
```

### `ModelSelector` (new component)

Props: `{ models: CarModelMeta[], selectedId: CarModelId, onChange: (id: CarModelId) => void, disabled: boolean }`

Renders a horizontal tab strip of 5 car model buttons. Selected item has a highlighted border/background using the model's associated theme primary color. Disabled state applies `opacity-50 pointer-events-none` to the entire strip.

### `Workbench.tsx` — Updated

New props: `selectedCarModel: CarModelId`, `onModelChange: (id: CarModelId) => void`

- Renders `ModelSelector` at the top
- `PromptInput` textarea: initial value = GX default text; `placeholder` updates on model change; `maxLength={500}`; character counter shows `{length}/500`
- Validates non-empty prompt before calling `onGenerate(userInput, selectedCarModel)`

### `StepsUI.tsx` — Updated

New props: `carModel: CarModelMeta` (replaces hardcoded GX text)

Steps are generated dynamically:
1. `"正在解析您的活动想法..."`
2. `"已拦截车型上下文，正在注入 {carModel.displayName} {carModel.tag} 核心卖点..."`
3. `"正在根据 {carModel.displayName} 调性匹配专属 H5 视觉皮肤..."`

### `PhonePreview.tsx` — Updated

New prop: `themeTokens: ThemeTokens` (derived by parent from `config.theme`)

Passes `themeTokens` down to `SellingPointCards`, `LeadForm`, and `SpinWheel`. All hardcoded `#00D4AA` / `#F5A623` color references are replaced with `themeTokens.primary` / `themeTokens.secondary`.

### `SpinWheel.tsx` — Updated

Receives `themeTokens: ThemeTokens`. Sector colors use `themeTokens.sectorColors[index % 2]`. Pointer uses `themeTokens.pointerColor`. Outer ring uses `themeTokens.ringColor`. Spin duration is randomized between 3000ms and 8000ms per spin. Winner precision: the target rotation is computed so the pointer (at 12 o'clock / 0°) lands within the center ±5° of the selected sector.

### `LeadForm.tsx` — Updated

Phone validation upgraded: `!/^1\d{10}$/.test(phone)` replaces the empty-only check. Receives `themeTokens: ThemeTokens` for button gradient and border-top color.

### `DemoLayout.tsx` — Updated

New state: `selectedCarModel: CarModelId` (default `'gx'`). Derives `themeTokens` from `config.theme` via `getThemeTokens`. Passes `selectedCarModel` and `onModelChange` to `Workbench`; passes `themeTokens` to `PhonePreview`. The `handleGenerate` function now accepts `(userInput: string, carModel: CarModelId)` and includes `carModel` in the POST body.


## Data Models

### `CAR_MODEL_MAP` — Complete Definition

```typescript
export const CAR_MODEL_MAP: Record<CarModelId, CarModelMeta> = {
  gx: {
    id: 'gx',
    displayName: '小鹏 GX',
    tag: 'AI新豪华大六座SUV旗舰',
    sellingPoints: ['六座宽奢大空间', '全感官高定座舱', '空间美学'],
    theme: 'luxury_ai',
    promptPlaceholder: '我是广州正佳广场店的销售阿强，周末想办个小鹏 GX「AI新豪华大六座SUV旗舰」的门店首批品鉴抽奖活动，语气要高级、吸引人。',
  },
  x9: {
    id: 'x9',
    displayName: '小鹏 X9',
    tag: '明日星舰超智驾大七座MPV',
    sellingPoints: ['全系后轮转向', '冰箱彩电大沙发', '魔方三排空间'],
    theme: 'cyber_future',
    promptPlaceholder: '我是正佳店Fellow，周末想针对家庭用户办个小鹏 X9「明日星舰大七座」星舰体验日活动，突出科技感和家庭空间。',
  },
  g6: {
    id: 'g6',
    displayName: '小鹏 G6',
    tag: '超智驾纯电SUV',
    sellingPoints: ['800V高压SiC碳化硅平台', 'XNGP全场景智驾', '超快充'],
    theme: 'pop_active',
    promptPlaceholder: '我是深圳南山店销售，想办一个小鹏 G6「超智驾纯电SUV」的试驾体验活动，主打年轻活力和智能科技。',
  },
  p7i: {
    id: 'p7i',
    displayName: '小鹏 P7i',
    tag: '超智驾轿跑旗舰',
    sellingPoints: ['经典美学轿跑身姿', '鹏翼门瞩目设计', '瞬时操控'],
    theme: 'sport_tech',
    promptPlaceholder: '我是上海徐汇店销售，想为小鹏 P7i「超智驾轿跑旗舰」策划一场赛道风格的品鉴活动，突出运动性能和设计美学。',
  },
  m03: {
    id: 'm03',
    displayName: '小鹏 MONA M03',
    tag: '智能纯电掀背轿跑',
    sellingPoints: ['全系标配高阶智驾', '年轻人的第一台轿跑', '高颜值掀背设计'],
    theme: 'youth_trend',
    promptPlaceholder: '我是北京朝阳店销售，想为小鹏 MONA M03「智能纯电掀背轿跑」策划一场面向年轻人的潮流发布活动。',
  },
};
```

### `THEME_MAP` — Complete Definition

```typescript
export const THEME_MAP: Record<Theme, ThemeTokens> = {
  luxury_ai: {
    bg: '#0A0A0A',
    primary: '#00D4AA',
    secondary: '#F5A623',
    haloColor: 'rgba(0,212,170,0.20)',
    cardBorder: 'rgba(0,212,170,0.20)',
    buttonGradient: 'linear-gradient(135deg, #00D4AA, #00A882)',
    sectorColors: ['#00D4AA', '#1A2744'],
    pointerColor: '#F5A623',
    ringColor: '#F5A623',
  },
  cyber_future: {
    bg: '#0A0A1A',
    primary: '#6366F1',
    secondary: '#8B5CF6',
    haloColor: 'rgba(99,102,241,0.20)',
    cardBorder: 'rgba(99,102,241,0.20)',
    buttonGradient: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
    sectorColors: ['#6366F1', '#1E1B4B'],
    pointerColor: '#8B5CF6',
    ringColor: '#8B5CF6',
  },
  pop_active: {
    bg: '#F8F9FA',
    primary: '#F97316',
    secondary: '#FB923C',
    haloColor: 'rgba(249,115,22,0.15)',
    cardBorder: 'rgba(249,115,22,0.25)',
    buttonGradient: 'linear-gradient(135deg, #F97316, #FB923C)',
    sectorColors: ['#F97316', '#FED7AA'],
    pointerColor: '#F97316',
    ringColor: '#F97316',
  },
  sport_tech: {
    bg: '#0D0D0D',
    primary: '#EF4444',
    secondary: '#DC2626',
    haloColor: 'rgba(239,68,68,0.20)',
    cardBorder: 'rgba(239,68,68,0.20)',
    buttonGradient: 'linear-gradient(135deg, #EF4444, #DC2626)',
    sectorColors: ['#EF4444', '#1C0A0A'],
    pointerColor: '#EF4444',
    ringColor: '#EF4444',
  },
  youth_trend: {
    bg: '#F1F5F9',
    primary: '#64748B',
    secondary: '#94A3B8',
    haloColor: 'rgba(100,116,139,0.12)',
    cardBorder: 'rgba(100,116,139,0.20)',
    buttonGradient: 'linear-gradient(135deg, #64748B, #94A3B8)',
    sectorColors: ['#64748B', '#E2E8F0'],
    pointerColor: '#64748B',
    ringColor: '#64748B',
  },
};
```

### API Request / Response Contract

**Request body:**
```typescript
interface GenerateRequest {
  userInput: string;   // max 500 chars, must be non-empty after trim
  carModel: CarModelId; // must be in ['gx','x9','g6','p7i','m03']
}
```

**Response body (success 200):** `DemoConfig` — unchanged interface, same as current.

**Error responses:**
- `400` — missing/empty `userInput`, missing/empty `carModel`, or `carModel` not in enum
- `500` — `DEEPSEEK_API_KEY` not set, or AI response is not valid JSON
- `502` — DeepSeek API returned non-2xx, or request timed out (>30s)


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Model selection sets selected state

*For any* car model ID in the valid set `['gx','x9','g6','p7i','m03']`, clicking that model in `ModelSelector` should result in that model being the currently selected model.

**Validates: Requirements 1.2**

---

### Property 2: Model switch updates placeholder without clearing value

*For any* non-empty string already typed in `PromptInput` and *for any* car model ID switched to, the textarea's `value` should remain unchanged while the `placeholder` updates to the new model's mapped example text.

**Validates: Requirements 1.3, 2.3**

---

### Property 3: ModelSelector disabled during generation

*For any* `isGenerating` boolean value, the `ModelSelector` component's interactive elements should have their disabled state equal to `isGenerating`.

**Validates: Requirements 1.5**

---

### Property 4: Character count display is accurate

*For any* string of length `n` (where `0 ≤ n ≤ 500`) entered into `PromptInput`, the displayed character counter should show `"n/500"`.

**Validates: Requirements 2.4**

---

### Property 5: Whitespace-only prompt is rejected

*For any* string where `str.trim() === ''` (including the empty string and any all-whitespace string), clicking `GenerateButton` should not invoke the API and should display the inline error `"请输入活动想法"`.

**Validates: Requirements 2.5**

---

### Property 6: Generate request includes both userInput and carModel

*For any* valid `userInput` string and *for any* valid `carModel` ID, the POST request body sent to `/api/generate` should contain both `userInput` and `carModel` fields with the correct values.

**Validates: Requirements 3.1**

---

### Property 7: Error response re-enables GenerateButton

*For any* error response from the API (any non-2xx status code) or a timeout, the `GenerateButton` should return to an enabled state and an error message should be visible in the workbench.

**Validates: Requirements 3.4**

---

### Property 8: ReasoningLog steps contain current model name and tag

*For any* selected car model in the valid set, the step texts rendered by `StepsUI` should contain both the model's `displayName` and its `tag` string.

**Validates: Requirements 4.2**

---

### Property 9: ThemeEngine applies correct tokens for any valid theme

*For any* `theme` value in `['luxury_ai','cyber_future','pop_active','sport_tech','youth_trend']`, `getThemeTokens(theme)` should return the `ThemeTokens` object whose `primary`, `secondary`, `bg`, `buttonGradient`, and `sectorColors` match the predefined palette for that theme.

**Validates: Requirements 5.1, 5.2**

---

### Property 10: Invalid theme falls back to luxury_ai

*For any* string not in the valid theme enum (including `undefined`, `null`, empty string, or arbitrary strings), `getThemeTokens(value)` should return the `luxury_ai` token set.

**Validates: Requirements 5.5**

---

### Property 11: PhonePreview renders all DemoConfig text fields

*For any* `DemoConfig` object, the rendered `PhonePreview` should display the `tag`, `title`, `subtitle`, and all entries of `sellingPoints` from that config.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

---

### Property 12: SpinWheel renders exactly as many sectors as prizes

*For any* `prizes` array of length `n`, the `SpinWheel` should render exactly `n` SVG sector paths, each containing the corresponding prize's `name` text.

**Validates: Requirements 7.1**

---

### Property 13: Spin pointer precision

*For any* prize index `i` (where `0 ≤ i < prizes.length`), the computed final rotation value should place the pointer (fixed at 12 o'clock / 0°) within ±5° of the center angle of sector `i`.

**Validates: Requirements 7.4**

---

### Property 14: SpinWheel resets on DemoConfig update

*For any* new `prizes` array passed to `SpinWheel`, the `winnerIndex` state should be `null` and the sector texts should reflect the new prizes array.

**Validates: Requirements 7.6**

---

### Property 15: Invalid phone number is rejected

*For any* non-empty phone string that does not match `/^1\d{10}$/`, submitting `LeadForm` should display `"请输入有效的手机号码"` and not proceed to the success state.

**Validates: Requirements 8.4**

---

### Property 16: API returns 400 for missing or empty required fields

*For any* request body where `userInput` is absent or empty after trim, or where `carModel` is absent or empty, the `GenerateAPI` should return HTTP 400.

**Validates: Requirements 9.2**

---

### Property 17: API returns 400 for invalid carModel enum value

*For any* string not in `['gx','x9','g6','p7i','m03']` supplied as `carModel`, the `GenerateAPI` should return HTTP 400.

**Validates: Requirements 9.3**

---

### Property 18: System prompt contains model-specific metadata

*For any* valid `carModel` ID, the system prompt constructed by `GenerateAPI` should contain that model's `tag` and all three `sellingPoints` keywords from `CAR_MODEL_MAP`.

**Validates: Requirements 9.4, 10.2**

---

### Property 19: carModel→theme mapping is immutable

*For any* valid `carModel` ID, `CAR_MODEL_MAP[carModel].theme` should always return the predefined theme value, regardless of any runtime state or user input.

**Validates: Requirements 10.1**


## Error Handling

### Client-side

| Scenario | Handling |
|---|---|
| Empty / whitespace-only prompt | Block API call; show inline error `"请输入活动想法"` below textarea |
| API returns 4xx | Show error message from response body in workbench; re-enable GenerateButton |
| API returns 5xx / 502 | Show `"AI 服务暂时不可用，请稍后重试"` in workbench; re-enable GenerateButton |
| 30-second client timeout | `AbortController` cancels the fetch; show `"请求超时，请重试"` in workbench; re-enable GenerateButton |
| `JSON.parse` of API response fails | Treat as 500 error; show generic error message |
| Invalid `theme` in DemoConfig | `getThemeTokens` silently falls back to `luxury_ai`; no user-visible error |
| LeadForm: empty name | Show `"请输入姓名"` below name field; block submission |
| LeadForm: empty phone | Show `"请输入手机号码"` below phone field; block submission |
| LeadForm: invalid phone format | Show `"请输入有效的手机号码"` below phone field; block submission |
| SpinWheel clicked before form submit | Show `"请先锁定品鉴名额"` prompt for 2 seconds; no spin |

### Server-side (`app/api/generate/route.ts`)

| Scenario | HTTP Status | Response body |
|---|---|---|
| Missing / empty `userInput` | 400 | `{ "error": "userInput is required" }` |
| Missing / empty `carModel` | 400 | `{ "error": "carModel is required" }` |
| `carModel` not in enum | 400 | `{ "error": "Invalid carModel" }` |
| `DEEPSEEK_API_KEY` not set | 500 | `{ "error": "API key not configured" }` |
| DeepSeek returns non-2xx | 502 | `{ "error": "AI service unavailable: ..." }` |
| DeepSeek request times out (>30s) | 502 | `{ "error": "AI service timeout" }` |
| AI response is not valid JSON | 500 | `{ "error": "Invalid JSON from AI" }` |

The route handler uses `export const maxDuration = 30` as a deployment-platform hint, and additionally wraps the DeepSeek `fetch` call with `AbortSignal.timeout(30000)` for runtime enforcement.


## Testing Strategy

### Overview

This feature has a mix of pure logic (theme mapping, phone validation, spin wheel geometry, system prompt construction) and UI behavior (model selection, form submission, animation triggers). The testing strategy uses:

- **Property-based tests** for pure functions and universal invariants
- **Unit tests** for specific examples, edge cases, and error conditions
- **Integration tests** for the API route end-to-end behavior

PBT is appropriate here because the core logic — `getThemeTokens`, `CAR_MODEL_MAP` lookups, phone validation regex, spin wheel angle calculation, and system prompt construction — are all pure functions with well-defined input spaces where varied inputs reveal edge cases.

### Property-Based Testing Library

Use **[fast-check](https://github.com/dubzzz/fast-check)** (TypeScript-native, no additional setup beyond `npm install fast-check --save-dev`). Each property test runs a minimum of **100 iterations**.

Tag format for each property test:
```
// Feature: xpeng-ai-marketing-demo, Property N: <property_text>
```

### Property Tests

Each of the 19 correctness properties maps to one `fc.assert(fc.property(...))` test:

| Property | Test file | Arbitraries used |
|---|---|---|
| P1: Model selection sets selected state | `__tests__/ModelSelector.test.tsx` | `fc.constantFrom(...CAR_MODEL_IDS)` |
| P2: Model switch preserves value | `__tests__/Workbench.test.tsx` | `fc.string()`, `fc.constantFrom(...CAR_MODEL_IDS)` |
| P3: ModelSelector disabled during generation | `__tests__/ModelSelector.test.tsx` | `fc.boolean()` |
| P4: Character count display | `__tests__/Workbench.test.tsx` | `fc.string({ maxLength: 500 })` |
| P5: Whitespace prompt rejected | `__tests__/Workbench.test.tsx` | `fc.stringOf(fc.constantFrom(' ','\t','\n'))` |
| P6: Request includes both fields | `__tests__/DemoLayout.test.tsx` | `fc.string()`, `fc.constantFrom(...CAR_MODEL_IDS)` |
| P7: Error re-enables button | `__tests__/DemoLayout.test.tsx` | `fc.constantFrom(400,500,502)` |
| P8: ReasoningLog contains model name+tag | `__tests__/StepsUI.test.tsx` | `fc.constantFrom(...Object.values(CAR_MODEL_MAP))` |
| P9: ThemeEngine correct tokens | `__tests__/config.test.ts` | `fc.constantFrom(...THEME_IDS)` |
| P10: Invalid theme fallback | `__tests__/config.test.ts` | `fc.string().filter(s => !THEME_IDS.includes(s))` |
| P11: PhonePreview renders all fields | `__tests__/PhonePreview.test.tsx` | `fc.record({ tag: fc.string(), title: fc.string(), ... })` |
| P12: SpinWheel sector count | `__tests__/SpinWheel.test.tsx` | `fc.array(fc.record({id: fc.nat(), name: fc.string()}), {minLength:1, maxLength:8})` |
| P13: Spin pointer precision | `__tests__/SpinWheel.test.ts` | `fc.nat({max: 3})` (for 4-sector wheel) |
| P14: SpinWheel resets on config update | `__tests__/SpinWheel.test.tsx` | `fc.array(...)` |
| P15: Invalid phone rejected | `__tests__/LeadForm.test.tsx` | `fc.string().filter(s => !/^1\d{10}$/.test(s) && s.length > 0)` |
| P16: API 400 for missing fields | `__tests__/api/generate.test.ts` | `fc.record({ userInput: fc.option(fc.string()), carModel: fc.option(fc.string()) })` |
| P17: API 400 for invalid carModel | `__tests__/api/generate.test.ts` | `fc.string().filter(s => !CAR_MODEL_IDS.includes(s))` |
| P18: System prompt contains metadata | `__tests__/api/generate.test.ts` | `fc.constantFrom(...CAR_MODEL_IDS)` |
| P19: carModel→theme immutable | `__tests__/config.test.ts` | `fc.constantFrom(...CAR_MODEL_IDS)` |

### Unit Tests

Focused on specific examples and error conditions not covered by properties:

- `ModelSelector`: initial GX selection on mount; 5 options rendered
- `Workbench`: initial textarea value equals GX default text; char count shows `0/500` on empty
- `StepsUI`: steps appear sequentially at ~1000ms intervals; hidden when `isVisible=false`
- `DemoLayout`: `previewKey` increments on successful generation; `isFormSubmitted` resets correctly
- `PhonePreview`: fade-in animation class applied on `previewKey` change
- `SpinWheel`: prompt shown when form not submitted; button disabled while spinning; button re-enabled after spin
- `LeadForm`: empty name shows correct error; empty phone shows correct error; confetti called on valid submit
- `API route`: 500 when `DEEPSEEK_API_KEY` missing; 500 when AI returns non-JSON; 502 when DeepSeek returns 503

### Integration Tests

- Full generation cycle: POST `/api/generate` with mocked DeepSeek response → assert `DemoConfig` shape is valid
- All 5 car models: for each `carModel` ID, assert the response `theme` matches the expected mapping

### Test Setup

```bash
npm install --save-dev fast-check jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom ts-jest
```

Tests live in `__tests__/` at the project root, mirroring the `app/` structure. The `jest.config.ts` uses `testEnvironment: 'jsdom'` for component tests and `testEnvironment: 'node'` for API route tests.

