# Requirements Document

## Introduction

本功能将小鹏汽车 AI 营销 Demo 的手机预览页面从固定模板升级为**数据驱动的原子化布局系统（GenUI Atomic Layout System）**。

核心思路：将 H5 预览页拆解为 6 个无状态原子组件，由 DeepSeek AI 在每次生成时输出一个 `layoutMatrix` 控制字段，前端通过遍历 `componentOrder` 数组动态渲染组件序列，并使用 framer-motion 实现组件换位时的物理滑行动画与尺寸/透明度缓动过渡。

---

## Glossary

- **Atomic Component（原子组件）**：手机预览页中可独立渲染、无内部布局依赖的最小 UI 单元，共 6 个，由 `ComponentId` 枚举标识。
- **ComponentId**：原子组件的唯一字符串标识符，合法值为：`brand_header`、`car_stage`、`campaign_info`、`selling_points`、`lucky_wheel`、`lead_form`。
- **layoutMatrix**：AI 返回 JSON 中的控制流字段，包含 `componentOrder`（渲染序列）和 `componentSettings`（每组件样式权重）。
- **componentOrder**：`ComponentId` 字符串数组，定义原子组件的从上到下渲染顺序。
- **componentSettings**：以 `ComponentId` 为键的对象，值为该组件的样式权重配置（如 `scale`、`highlight`、`displayType`）。
- **Matrix Renderer（矩阵渲染器）**：前端负责遍历 `componentOrder` 并渲染对应原子组件的模块，即升级后的 `PhonePreview` 组件。
- **Layout Transition（换位动画）**：framer-motion `layout` 属性驱动的组件物理位置插值过渡动画。
- **Default Order（默认顺序）**：当 AI 未返回有效 `layoutMatrix` 时使用的兜底渲染序列：`["brand_header", "car_stage", "campaign_info", "selling_points", "lucky_wheel", "lead_form"]`。
- **DemoConfig**：现有的活动配置类型，包含 `theme`、`carModel`、`title`、`subtitle`、`sellingPoints`、`prizes` 等字段。
- **ThemeTokens**：现有的主题色彩令牌类型，由 `getThemeTokens()` 根据 `DemoConfig.theme` 派生。
- **System Prompt**：发送给 DeepSeek API 的系统提示词，位于 `/api/generate/route.ts` 的 `buildSystemPrompt()` 函数中。

---

## Requirements

### Requirement 1: 原子组件注册表

**User Story:** As a frontend developer, I want a single source of truth for all valid atomic component IDs, so that both the renderer and the API contract can reference the same registry without duplication.

#### Acceptance Criteria

1. THE System SHALL define a readonly array `ATOMIC_COMPONENT_IDS` containing exactly the six values: `"brand_header"`, `"car_stage"`, `"campaign_info"`, `"selling_points"`, `"lucky_wheel"`, `"lead_form"`, in that order.
2. THE System SHALL export a TypeScript type `ComponentId` derived as a union of the literal string values in `ATOMIC_COMPONENT_IDS`.
3. THE System SHALL export a TypeScript interface `ComponentSettings` with optional fields: `scale` (`"large" | "small"`), `highlight` (`boolean`), `displayType` (`"grid" | "list"`), `isBackground` (`boolean`).
4. THE System SHALL export a TypeScript interface `LayoutMatrix` with required field `componentOrder` (`ComponentId[]`, between 1 and 6 entries, no duplicates) and optional field `componentSettings` (`Partial<Record<ComponentId, ComponentSettings>>`).
5. THE System SHALL export a type-guard function `isComponentId(s: string): s is ComponentId` that returns `true` if and only if `s` is one of the six values in `ATOMIC_COMPONENT_IDS`, and `false` otherwise.

---

### Requirement 2: AI 契约升级 — System Prompt 注入 layoutMatrix 规范

**User Story:** As a product manager, I want the AI to always return a `layoutMatrix` field alongside the existing content fields, so that the frontend can dynamically reorder and style components based on the campaign context.

#### Acceptance Criteria

1. WHEN `buildSystemPrompt()` is called for any `CarModelId`, THE System SHALL include instructions requiring DeepSeek to output a `layoutMatrix` field in its JSON response.
2. THE System SHALL specify in the System Prompt that `componentOrder` must be an array containing all six `ComponentId` values (`"brand_header"`, `"car_stage"`, `"campaign_info"`, `"selling_points"`, `"lucky_wheel"`, `"lead_form"`) in the AI-determined priority order.
3. THE System SHALL specify in the System Prompt that `componentSettings` is an optional object where keys are `ComponentId` values and values may contain: `scale` (`"large"` or `"small"`), `highlight` (`true` or `false`), `displayType` (`"grid"` or `"list"`), `isBackground` (`true` or `false`).
4. THE System SHALL include a concrete JSON example of a valid `layoutMatrix` in the System Prompt that covers all six `ComponentId` values in `componentOrder` and demonstrates at least one `componentSettings` entry.
5. THE System SHALL instruct DeepSeek that the output must be a single root-level JSON object (no Markdown code fences), with `layoutMatrix` as a top-level field alongside existing fields (`theme`, `carModel`, `title`, etc.).
6. WHEN the AI returns a `layoutMatrix.componentOrder` that is not an array or is missing, THE API Route SHALL treat the response as if `layoutMatrix` were absent and apply the Default Order fallback.

---

### Requirement 3: API 响应解析 — layoutMatrix 提取与验证

**User Story:** As a developer, I want the API route to extract and validate the `layoutMatrix` from the AI response, so that the frontend always receives a well-formed layout contract even when the AI output is incomplete or malformed.

#### Acceptance Criteria

1. WHEN the AI response JSON contains a `layoutMatrix.componentOrder` that is a non-empty array, THE API Route SHALL include the normalized `layoutMatrix` field in the response returned to the client.
2. WHEN the AI response JSON is missing `layoutMatrix`, or `layoutMatrix.componentOrder` is not an array, or `layoutMatrix.componentOrder` is an empty array, THE API Route SHALL set `componentOrder` to the Default Order `["brand_header", "car_stage", "campaign_info", "selling_points", "lucky_wheel", "lead_form"]` before returning the response.
3. WHEN `layoutMatrix.componentOrder` contains strings that are not valid `ComponentId` values (as determined by `isComponentId`), THE API Route SHALL filter out those unknown strings and retain only the valid `ComponentId` values.
4. WHEN `layoutMatrix.componentOrder` after filtering contains fewer than six entries, THE API Route SHALL append the missing `ComponentId` values in Default Order sequence to ensure all six components are present with no duplicates.
5. WHEN `layoutMatrix.componentOrder` after filtering contains duplicate `ComponentId` values, THE API Route SHALL deduplicate by retaining only the first occurrence of each `ComponentId`.
6. THE API Route SHALL preserve all existing `DemoConfig` fields (`theme`, `carModel`, `tag`, `title`, `subtitle`, `sellingPoints`, `prizes`) unchanged when attaching or normalizing `layoutMatrix`.
7. FOR ALL valid `DemoConfig` objects with any `layoutMatrix`, parsing the API response SHALL produce an object where all original `DemoConfig` fields are identical to the input (round-trip preservation property).

---

### Requirement 4: 六个原子组件实现

**User Story:** As a frontend developer, I want each atomic component to be a self-contained, stateless React component that accepts `DemoConfig`, `ThemeTokens`, and its own `ComponentSettings` as props, so that the Matrix Renderer can mount any component without knowing its internal structure.

#### Acceptance Criteria

1. THE System SHALL implement a `BrandHeader` component that accepts `config: DemoConfig`, `tokens: ThemeTokens`, and `settings: ComponentSettings` as props, and renders the XPENG brand identity bar (logo text, tag badge) using `ThemeTokens` for colors.
2. THE System SHALL implement a `CarStage` component that accepts `config: DemoConfig`, `tokens: ThemeTokens`, and `settings: ComponentSettings` as props, and renders the car model name and a dynamic light-shadow visual stage using `ThemeTokens` for halo and gradient effects.
3. WHEN `CarStage` receives `settings.isBackground = true`, THE `CarStage` SHALL render with a CSS opacity value ≤ 0.4 to serve as a background texture layer.
4. THE System SHALL implement a `CampaignInfo` component that accepts `config: DemoConfig`, `tokens: ThemeTokens`, and `settings: ComponentSettings` as props, and renders `config.title` as the primary headline and `config.subtitle` as the secondary line.
5. THE System SHALL implement a `SellingPoints` component that accepts `config: DemoConfig`, `tokens: ThemeTokens`, and `settings: ComponentSettings` as props, and renders `config.sellingPoints` as a card collection.
6. WHEN `SellingPoints` receives `settings.displayType = "grid"`, THE `SellingPoints` SHALL render the cards in a two-column CSS grid layout.
7. WHEN `SellingPoints` receives `settings.displayType = "list"`, no `displayType`, or any value other than `"grid"`, THE `SellingPoints` SHALL render the cards in a single-column vertical list layout.
8. THE System SHALL reuse the existing `SpinWheel` component as the `lucky_wheel` atomic slot, passing `config.prizes`, `isFormSubmitted`, and `tokens` as props.
9. THE System SHALL reuse the existing `LeadForm` component as the `lead_form` atomic slot, passing `onSubmitSuccess` and `tokens` as props.
10. FOR ALL six atomic components, each component SHALL be a pure function of its props (no internal side effects that alter external state), making it independently renderable by the Matrix Renderer.

---

### Requirement 5: 矩阵渲染器 — 数据驱动排版

**User Story:** As a product manager, I want the phone preview to render components in the exact order specified by `componentOrder`, so that the AI can fully control the visual hierarchy of the campaign page.

#### Acceptance Criteria

1. THE Matrix Renderer SHALL accept a `layoutMatrix` prop of type `LayoutMatrix` and render atomic components by iterating over `componentOrder`.
2. WHEN `componentOrder` is `["brand_header", "lucky_wheel", "lead_form", "car_stage", "campaign_info", "selling_points"]`, THE Matrix Renderer SHALL render the components in that exact top-to-bottom visual sequence.
3. WHEN `componentOrder` contains a `ComponentId` that has a corresponding entry in `componentSettings`, THE Matrix Renderer SHALL pass that entry as the `settings` prop to the rendered atomic component.
4. WHEN `componentOrder` contains a `ComponentId` with no entry in `componentSettings`, THE Matrix Renderer SHALL render the component with an empty settings object (`{}`).
5. THE Matrix Renderer SHALL render exactly six components for any valid `LayoutMatrix` input, in the order specified by `componentOrder` (order-preservation property).
6. WHEN `componentOrder` contains a string that is not a valid `ComponentId`, THE Matrix Renderer SHALL skip that entry without rendering anything and without throwing an error.
7. THE Matrix Renderer SHALL render the phone preview using only the data-driven component loop, with no hardcoded positional JSX for any of the six atomic slots.

---

### Requirement 6: Framer Motion 换位动画

**User Story:** As a user, I want components to smoothly slide to their new positions when the AI reorders them, so that the layout change feels physical and fluid rather than an abrupt flash.

#### Acceptance Criteria

1. THE System SHALL include `framer-motion` as a production dependency.
2. THE Matrix Renderer SHALL wrap each atomic component in an animated container element that uses a stable identifier equal to the component's `ComponentId` as its React key.
3. WHEN `componentOrder` changes between renders, each component SHALL animate to its new position within 800ms, with no component jumping or teleporting to its new position.
4. WHEN components animate to new positions, the motion SHALL follow a spring-based curve with visible deceleration — components SHALL overshoot slightly and settle, rather than moving at constant speed.
5. WHEN a new `layoutMatrix` is received from the AI, each atomic component SHALL retain its internal state (e.g., form input values, wheel spin state) across the layout change — no component SHALL unmount and remount solely due to a reorder.

---

### Requirement 7: Framer Motion 尺寸与透明度缓动

**User Story:** As a user, I want components to smoothly scale and fade when the AI changes their visual weight, so that emphasis shifts feel organic rather than jarring.

#### Acceptance Criteria

1. IF `componentSettings[componentId].scale = "large"`, THEN THE Matrix Renderer SHALL animate the component wrapper to a scale of 1.15.
2. IF `componentSettings[componentId].scale = "small"`, THEN THE Matrix Renderer SHALL animate the component wrapper to a scale of 0.9.
3. IF `componentSettings[componentId]` has no `scale` value, or `scale` is any value other than `"large"` or `"small"`, THEN THE Matrix Renderer SHALL animate the component wrapper to a scale of 1.0.
4. IF `componentSettings[componentId].highlight = true`, THEN THE Matrix Renderer SHALL animate the component wrapper to an opacity of 1.0.
5. IF `componentSettings[componentId].highlight` is `false` or absent, THEN THE Matrix Renderer SHALL animate the component wrapper to an opacity of 0.85.
6. THE Matrix Renderer SHALL apply a spring-based transition with stiffness 200 and damping 25 to all scale and opacity animations.
7. IF `componentSettings[componentId].isBackground = true` AND `componentSettings[componentId].highlight` is `false` or absent, THEN THE Matrix Renderer SHALL animate the component wrapper to an opacity of 0.35, overriding the default opacity of 0.85.
8. IF `componentSettings[componentId].isBackground = true` AND `componentSettings[componentId].highlight = true`, THEN THE Matrix Renderer SHALL animate the component wrapper to an opacity of 1.0 (highlight takes precedence over isBackground).

---

### Requirement 8: DemoConfig 类型扩展

**User Story:** As a developer, I want the `DemoConfig` type to include an optional `layoutMatrix` field, so that the existing config state in `DemoLayout` can carry the layout contract without a separate state variable.

#### Acceptance Criteria

1. THE System SHALL extend the `DemoConfig` interface in `app/config.ts` with an optional field `layoutMatrix` of type `LayoutMatrix`.
2. THE `PhonePreview` component SHALL declare a `layoutMatrix` prop of type `LayoutMatrix` on its props interface, so that the Matrix Renderer can receive the layout contract from its parent.
3. WHEN `DemoLayout` receives a new `DemoConfig` from the API that includes a valid `layoutMatrix`, THE `DemoLayout` SHALL pass `config.layoutMatrix` to `PhonePreview` as the `layoutMatrix` prop.
4. IF `config.layoutMatrix` is absent or `undefined`, THEN THE `DemoLayout` SHALL pass a Default Order matrix `{ componentOrder: ["brand_header", "car_stage", "campaign_info", "selling_points", "lucky_wheel", "lead_form"] }` to `PhonePreview`.
5. THE System SHALL NOT introduce a separate React state variable for `layoutMatrix`; it SHALL be derived from `config.layoutMatrix` at render time.

---

### Requirement 9: 兜底与容错

**User Story:** As a developer, I want the system to degrade gracefully when the AI returns an incomplete or malformed `layoutMatrix`, so that the page always renders all six components without crashing.

#### Acceptance Criteria

1. IF `layoutMatrix` is `undefined` or `null`, THEN THE Matrix Renderer SHALL render all six components using the Default Order `["brand_header", "car_stage", "campaign_info", "selling_points", "lucky_wheel", "lead_form"]`.
2. IF `componentOrder` is an empty array, THEN THE Matrix Renderer SHALL render all six components using the Default Order.
3. IF `componentOrder` contains a mix of valid `ComponentId` values and unknown strings, THEN THE Matrix Renderer SHALL render the valid components first (in the order they appear in `componentOrder`), then append the remaining valid `ComponentId` values in Default Order sequence, resulting in exactly six rendered components.
4. IF `componentSettings` contains a key that is not a valid `ComponentId`, THEN THE Matrix Renderer SHALL ignore that key and render all valid components with their correct settings, without throwing an error.
5. IF `componentOrder` is any array of strings (including empty, all-unknown, or mixed valid/invalid), THEN THE Matrix Renderer SHALL always render exactly six components using valid `ComponentId` values (completeness invariant).
