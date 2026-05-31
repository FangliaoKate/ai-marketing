# Requirements Document

## Introduction

本功能将现有的单车型（小鹏 GX）AI 营销 H5 Demo 系统扩展为支持五款车型的多车型平台。系统在左侧工作台新增车型切换组件，AI 后端根据所选车型动态生成品牌调性匹配的活动文案，右侧手机预览区根据返回的 `theme` 字段实时切换全局视觉皮肤，实现"一键生成、全场景覆盖"的 AI 营销赋能闭环。

支持车型：小鹏 GX（luxury_ai）、小鹏 X9（cyber_future）、小鹏 G6（pop_active）、小鹏 P7i（sport_tech）、小鹏 MONA M03（youth_trend）。

## Glossary

- **System**：整个小鹏 AI 营销 H5 Demo 系统（Next.js 应用）
- **Workbench**：左侧 AI 智能配置后台，即 `Workbench` 组件
- **ModelSelector**：工作台内的车型切换组件
- **PromptInput**：工作台内的提示词输入框（textarea）
- **GenerateButton**：工作台内的一键生成按钮
- **ReasoningLog**：等待 API 期间展示 AI 思考痕迹的步骤条组件（现有 `StepsUI`）
- **PhonePreview**：右侧 iPhone 真机外壳预览容器，即 `PhonePreview` 组件
- **ThemeEngine**：根据 `theme` 字段切换全局视觉皮肤的机制
- **SellingPointCards**：展示三个核心卖点的毛玻璃卡片区域
- **SpinWheel**：四等分互动大转盘组件
- **LeadForm**：预约留资表单组件（姓名 + 手机号）
- **ConfettiEffect**：表单提交成功后触发的 canvas-confetti 全屏彩带效果
- **WinnerModal**：彩带触发后弹出的毛玻璃中奖弹窗
- **GenerateAPI**：后端 `/api/generate` POST 路由
- **DemoConfig**：前后端共享的 JSON 数据契约，包含 `theme`、`carModel`、`tag`、`title`、`subtitle`、`sellingPoints[]`、`prizes[]` 字段
- **CarModel**：车型标识符，取值为 `gx` | `x9` | `g6` | `p7i` | `m03`
- **Theme**：视觉主题标识符，取值为 `luxury_ai` | `cyber_future` | `pop_active` | `sport_tech` | `youth_trend`

---

## Requirements

### Requirement 1: 车型切换组件

**User Story:** As a 一线销售，I want 在工作台顶部快速切换目标车型，so that AI 能自动对齐该车型的官方标签与卖点，并更新输入框提示语。

#### Acceptance Criteria

1. THE ModelSelector SHALL 展示五款车型的可点击选项：小鹏 GX、小鹏 X9、小鹏 G6、小鹏 P7i、小鹏 MONA M03。
2. WHEN 用户点击某一车型选项，THE ModelSelector SHALL 将该车型设为当前选中状态，并以与未选中项视觉上可区分的高亮样式（如背景色或边框色变化）显示选中项。
3. WHEN 用户切换车型，THE PromptInput SHALL 将 placeholder 文本更新为该车型在预设映射表中对应的专属示例提示语。
4. WHEN 页面初始加载完成，THE ModelSelector SHALL 默认选中"小鹏 GX"，并同步将 PromptInput 的 placeholder 设置为小鹏 GX 的专属示例提示语。
5. IF 当前正在生成（GenerateButton 处于 loading 状态），THEN THE ModelSelector SHALL 禁用所有车型切换操作，并在视觉上呈现禁用态；WHEN GenerateButton 恢复可点击状态，THE ModelSelector SHALL 自动解除禁用。

---

### Requirement 2: 提示词输入框

**User Story:** As a 一线销售，I want 在输入框中用大白话描述活动想法，so that AI 能理解我的意图并生成对应文案。

#### Acceptance Criteria

1. THE PromptInput SHALL 提供一个多行文本输入区域（textarea），供用户输入活动需求描述，最大输入长度为 500 个字符。
2. WHEN 页面初始加载完成，THE PromptInput SHALL 将小鹏 GX 对应的默认示例文本设置为 textarea 的初始 value（而非 placeholder）。
3. WHEN 用户切换车型，THE PromptInput SHALL 仅更新 placeholder 文本为该车型的专属示例提示语，不清空用户已输入的内容。
4. THE PromptInput SHALL 在右下角实时显示当前输入的字符数，格式为"当前字符数/500"。
5. IF 用户点击 GenerateButton 时 PromptInput 的值为空字符串或仅包含空白字符（trim 后为空），THEN THE System SHALL 阻止 API 请求，并在工作台内显示内联错误提示"请输入活动想法"。

---

### Requirement 3: 一键生成按钮

**User Story:** As a 一线销售，I want 点击一个按钮触发 AI 生成，so that 无需了解技术细节即可获得完整的活动页文案。

#### Acceptance Criteria

1. WHEN 用户点击 GenerateButton，THE System SHALL 在 30 秒超时限制内向 GenerateAPI 发送包含 `userInput` 和 `carModel` 的 POST 请求。
2. WHILE GenerateAPI 请求进行中，THE GenerateButton SHALL 进入禁用状态并展示 loading 动画。
3. WHEN GenerateAPI 请求成功返回，THE GenerateButton SHALL 恢复为可点击状态。
4. IF GenerateAPI 返回错误或请求超时，THEN THE System SHALL 在工作台内显示错误提示信息，该提示持续显示直到用户主动关闭或下一次生成触发；同时 THE GenerateButton SHALL 恢复为可点击状态。

---

### Requirement 4: AI 思考树（ReasoningLog）

**User Story:** As a 一线销售，I want 在等待 AI 生成时看到思考过程动画，so that 感知到系统正在工作，提升对 AI 能力的信任感。

#### Acceptance Criteria

1. WHEN GenerateButton 被点击，THE ReasoningLog SHALL 在工作台内可见，并以步骤条形式每隔约 1000ms 依次展示 AI 思考步骤文本。
2. THE ReasoningLog SHALL 展示至少三个步骤，步骤文本需包含当前选中车型的名称及其对应的 `tag` 字段值（官方标签）。
3. WHILE ReasoningLog 动画播放中，THE System SHALL 同步等待 GenerateAPI 响应。
4. WHEN ReasoningLog 动画播放完毕且 GenerateAPI 已成功返回数据，THE System SHALL 将新的 DemoConfig 数据渲染到 PhonePreview。
5. WHEN GenerateButton 恢复可点击状态（无论成功或失败），THE ReasoningLog SHALL 隐藏。
6. IF GenerateAPI 返回错误，THEN THE ReasoningLog SHALL 立即停止动画并隐藏，同时 THE System SHALL 显示错误提示信息。

---

### Requirement 5: 动态换肤引擎（ThemeEngine）

**User Story:** As a 一线销售，I want 手机预览区的视觉风格随车型自动切换，so that 演示效果与品牌调性高度匹配，增强说服力。

#### Acceptance Criteria

1. WHEN PhonePreview 接收到新的 DemoConfig，THE ThemeEngine SHALL 根据 `theme` 字段切换 PhonePreview 内的全局配色方案。
2. THE ThemeEngine SHALL 支持以下五种主题的配色切换，每种主题覆盖品牌头部光晕色、卖点卡片边框色、表单按钮渐变色、转盘扇面色四类元素：
   - `luxury_ai`：深黑背景 + 翠绿（#00D4AA）+ 琥珀金（#F5A623）
   - `cyber_future`：深空背景 + 蓝紫渐变（#6366F1 / #8B5CF6）
   - `pop_active`：浅色背景 + 活力橙（#F97316）
   - `sport_tech`：碳黑背景 + 赛道红（#EF4444）
   - `youth_trend`：浅灰白背景 + 时尚浅色调（#64748B）
3. WHEN 主题切换时，THE ThemeEngine SHALL 在同一渲染帧内同时更新品牌头部光晕色、卖点卡片边框色、表单按钮渐变色、转盘扇面色。
4. WHEN PhonePreview 以新的 `previewKey` 重新挂载，THE ThemeEngine SHALL 应用新主题并触发持续 200ms 至 400ms 的淡入动画。
5. IF DemoConfig 中的 `theme` 字段缺失或不在枚举值（`luxury_ai` | `cyber_future` | `pop_active` | `sport_tech` | `youth_trend`）内，THEN THE ThemeEngine SHALL 回退到 `luxury_ai` 主题。

---

### Requirement 6: 文案展示区（SellingPointCards）

**User Story:** As a 一线销售，I want 手机预览区展示 AI 生成的标题、副标题和卖点卡片，so that 客户能直观看到活动亮点。

#### Acceptance Criteria

1. THE PhonePreview SHALL 展示 DemoConfig 中的 `tag` 字段作为活动标签徽章。
2. THE PhonePreview SHALL 展示 DemoConfig 中的 `title` 字段作为活动主标题。
3. THE PhonePreview SHALL 展示 DemoConfig 中的 `subtitle` 字段作为活动副标题。
4. THE SellingPointCards SHALL 渲染 DemoConfig 中 `sellingPoints` 数组的全部条目，每条以独立的毛玻璃卡片（backdrop-blur）展示。
5. WHEN DemoConfig 更新时，THE PhonePreview SHALL 以淡入动画重新渲染所有文案内容，动画时长与 ThemeEngine 淡入动画保持一致（200ms 至 400ms）。

---

### Requirement 7: 互动大转盘（SpinWheel）

**User Story:** As a 潜在客户，I want 填写信息后参与大转盘抽奖，so that 获得参与感和获奖期待，提升留资意愿。

#### Acceptance Criteria

1. THE SpinWheel SHALL 渲染与 DemoConfig 中 `prizes` 数组长度相等的等分扇面，扇面文字读取每个 prize 对象的 `name` 字段。
2. WHEN 用户在未提交 LeadForm 的情况下点击抽奖按钮，THE SpinWheel SHALL 显示提示文本"请先锁定品鉴名额"，不触发旋转。
3. WHEN 用户已提交 LeadForm 后点击抽奖按钮，THE SpinWheel SHALL 触发旋转动画，动画时长不少于 3 秒且不超过 8 秒。
4. WHEN 旋转动画结束，THE SpinWheel SHALL 使指针精准停留在随机选中的奖品扇面中心（偏差不超过 ±5°），并在转盘下方展示该奖品的 `name` 字段作为获奖结果文本。
5. WHILE SpinWheel 正在旋转，THE SpinWheel SHALL 禁用抽奖按钮，防止重复触发。
6. WHEN DemoConfig 更新时，THE SpinWheel SHALL 使用新的 `prizes` 数组重新渲染扇面内容，并重置获奖结果文本。
7. WHEN 旋转动画结束后，THE SpinWheel 抽奖按钮 SHALL 恢复为可点击状态，允许用户再次抽奖。

---

### Requirement 8: 预约留资表单（LeadForm）

**User Story:** As a 潜在客户，I want 填写姓名和手机号提交预约，so that 锁定品鉴名额并解锁抽奖资格。

#### Acceptance Criteria

1. THE LeadForm SHALL 提供"您的姓名"（最大 20 个字符）和"手机号码"（最大 11 位数字）两个输入字段及一个提交按钮。
2. IF 用户点击提交时姓名字段为空，THEN THE LeadForm SHALL 阻止提交流程，并在姓名字段下方显示错误提示"请输入姓名"。
3. IF 用户点击提交时手机号字段为空，THEN THE LeadForm SHALL 阻止提交流程，并在手机号字段下方显示错误提示"请输入手机号码"。
4. IF 用户点击提交时手机号字段非空但不符合 11 位数字且首位为 1 的格式，THEN THE LeadForm SHALL 阻止提交流程，并在手机号字段下方显示错误提示"请输入有效的手机号码"。
5. WHEN 用户成功提交 LeadForm（姓名非空且手机号符合格式），THE ConfettiEffect SHALL 触发全屏彩带动画。
6. WHEN 用户成功提交 LeadForm，THE WinnerModal SHALL 弹出，展示"[Mock] 提交成功！"文本及演示说明。
7. WHEN 用户关闭 WinnerModal，THE LeadForm SHALL 切换为提交成功状态视图，展示包含已提交姓名的预约成功确认信息。
8. WHEN LeadForm 切换为提交成功状态，THE SpinWheel 抽奖按钮 SHALL 变为可点击状态。

---

### Requirement 9: 后端 GenerateAPI

**User Story:** As a System，I want 后端 API 根据车型和用户输入调用大模型并返回标准 JSON，so that 前端可直接解析并驱动页面渲染。

#### Acceptance Criteria

1. THE GenerateAPI SHALL 接受 POST 请求，请求体包含 `userInput`（string，最大 500 字符）和 `carModel`（string，最大 100 字符）字段。
2. IF 请求体缺少 `userInput`、`userInput` 为空字符串，或缺少 `carModel`、`carModel` 为空字符串，THEN THE GenerateAPI SHALL 返回 HTTP 400 状态码及错误描述。
3. IF 请求体中的 `carModel` 不在预设枚举值（`gx` | `x9` | `g6` | `p7i` | `m03`）内，THEN THE GenerateAPI SHALL 返回 HTTP 400 状态码及错误描述。
4. WHERE `carModel` 在预设枚举值内，THE GenerateAPI SHALL 根据 `carModel` 字段在 System Prompt 中注入对应车型的官方标签、核心卖点和视觉主题。
5. THE GenerateAPI SHALL 强制大模型返回纯 JSON 字符串，不包含任何 Markdown 代码块包裹（不含 \`\`\`json 或 \`\`\`）。
6. THE GenerateAPI 返回的 JSON SHALL 包含以下字段：`theme`、`carModel`、`tag`、`title`、`subtitle`、`sellingPoints`（恰好 3 个字符串）、`prizes`（恰好 4 个对象，每个对象含 `id`（number）和 `name`（string））。
7. THE GenerateAPI 返回的 `theme` 字段 SHALL 与请求中 `carModel` 对应的预设主题一致。
8. IF 大模型返回的内容无法被 `JSON.parse` 解析，THEN THE GenerateAPI SHALL 返回 HTTP 500 状态码及错误描述。
9. IF 环境变量 `DEEPSEEK_API_KEY` 未配置，THEN THE GenerateAPI SHALL 返回 HTTP 500 状态码及错误描述。
10. IF 大模型调用超时（超过 30 秒未响应）或返回非成功状态码，THEN THE GenerateAPI SHALL 返回 HTTP 502 状态码及错误描述。

---

### Requirement 10: 车型知识库与主题映射

**User Story:** As a System，I want 内置完整的五车型知识库和主题映射表，so that 每次生成都能精准对齐官方品牌调性。

#### Acceptance Criteria

1. THE System SHALL 内置以下车型到主题的映射关系，且映射关系不可在运行时被用户输入覆盖：
   - `gx` → `luxury_ai`（小鹏 GX，AI新豪华大六座SUV旗舰）
   - `x9` → `cyber_future`（小鹏 X9，明日星舰超智驾大七座MPV）
   - `g6` → `pop_active`（小鹏 G6，超智驾纯电SUV）
   - `p7i` → `sport_tech`（小鹏 P7i，超智驾轿跑旗舰）
   - `m03` → `youth_trend`（小鹏 MONA M03，智能纯电掀背轿跑）
2. THE GenerateAPI SHALL 在 System Prompt 中为每个 `carModel` 注入对应的官方核心卖点关键词，关键词来源于 docs/new-feture.md 中定义的"注入 AI 的核心卖点库"。
3. THE ModelSelector SHALL 使用与 GenerateAPI 相同的车型标识符（`gx`、`x9`、`g6`、`p7i`、`m03`）作为内部 ID，确保前后端车型标识符完全一致。
