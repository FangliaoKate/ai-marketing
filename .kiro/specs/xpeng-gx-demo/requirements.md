# Requirements Document

## Introduction

本功能为小鹏 GX 门店活动 AI 一键生成 Demo 平台。该平台采用"左侧 AI 工作台 + 右侧手机端 H5 预览"的双栏布局，展示 AI 一键赋能一线销服的提效能力。左侧工作台接收销售人员的自然语言输入，模拟 AI 解析过程，右侧实时渲染符合小鹏品牌调性的活动 H5 页面，包含卖点展示、互动大转盘和留资表单。

## Glossary

- **Demo_Platform**：整个单页 Demo 应用，包含左侧工作台和右侧手机预览两个区域
- **Workbench**：左侧 AI 工作台区域，包含输入框、生成按钮和 AI 日志动画
- **PhonePreview**：右侧手机端 H5 预览区域，模拟 iPhone 外壳内的活动页面
- **Config**：驱动右侧预览内容的数据对象，包含车型信息、文案和奖品列表；初始为静态 const，接入 API 后由大模型返回值替换
- **SpinWheel**：互动大转盘组件，四等分扇面，绑定 Config 中的 prizes 字段
- **LeadForm**：留资表单组件，包含姓名和手机号输入框及提交按钮
- **AILog**：AI 拆解日志动画，在生成 loading 期间展示伪装的 AI 处理步骤
- **Confetti**：基于 canvas-confetti 库的全屏彩带动画效果
- **luxury_ai**：视觉主题，深黑背景 + 小鹏翠绿（#00D4AA）+ 琥珀金（#F5A623）
- **GenerateAPI**：后端 API 路由 `/api/generate`，接收用户输入并调用 DeepSeek API 返回纯 JSON 文案
- **StepsUI**：前端定时器驱动的三步骤加载动画，在等待 API 响应期间依次高亮显示处理进度
- **MockSubmit**：内存态提交行为，不写入数据库，仅弹窗提示"[Mock] 提交成功！"作为演示效果

---

## Requirements

### Requirement 1: 双栏布局与整体页面结构

**User Story:** As a 演示者, I want 看到左侧工作台和右侧手机预览并排展示, so that 评委能直观感受 AI 一键生成的完整视觉闭环。

#### Acceptance Criteria

1. THE Demo_Platform SHALL render a two-column layout with the Workbench on the left and PhonePreview on the right within a single page
2. THE Demo_Platform SHALL occupy the full viewport height without vertical scrolling on the outer container
3. WHEN the page loads, THE Demo_Platform SHALL display the Workbench and PhonePreview simultaneously without requiring any user interaction
4. THE Demo_Platform SHALL apply a dark background color (#0A0A0A or equivalent near-black) to the overall page consistent with the luxury_ai theme

---

### Requirement 2: 左侧工作台 — 输入与生成控制

**User Story:** As a 销售人员, I want 在工作台输入一句话需求并点击生成, so that 系统能模拟 AI 处理并刷新右侧预览内容。

#### Acceptance Criteria

1. THE Workbench SHALL display a textarea pre-filled with the text "我是广州正佳广场店的销售阿强，周末想办个小鹏 GX'AI新豪华大六座SUV旗舰'的门店首批品鉴抽奖活动，语气要高级、吸引人。"
2. THE Workbench SHALL display a "一键生成" button below the textarea
3. WHEN the user clicks the "一键生成" button, THE Workbench SHALL enter a loading state and disable the button to prevent duplicate submissions
4. WHEN the loading state is active, THE Workbench SHALL display the AILog animation sequence
5. WHEN the loading completes, THE Workbench SHALL exit the loading state and re-enable the button
6. THE Workbench SHALL allow the user to edit the textarea content before clicking generate

---

### Requirement 3: AI 拆解日志动画

**User Story:** As a 演示者, I want loading 期间看到逼真的 AI 处理日志, so that 演示效果更具说服力和科技感。

#### Acceptance Criteria

1. WHEN the loading state begins, THE AILog SHALL display a sequence of log messages simulating AI processing steps
2. THE AILog SHALL include at least the following log messages in order:
   - "🔍 正在解析销售需求..."
   - "🎨 正在匹配小鹏官方 VI 规范..."
   - "🚗 正在注入小鹏 GX 车型卖点..."
   - "✅ 活动页面生成完毕，正在渲染..."
3. THE AILog SHALL display each log message with a staggered delay of approximately 600ms between entries
4. THE AILog total duration SHALL be between 2 and 3 seconds before the loading state ends
5. WHEN the loading state ends, THE PhonePreview SHALL play a visual transition animation (fade or slide) to indicate content refresh

---

### Requirement 4: 右侧手机预览 — 外壳与品牌区

**User Story:** As a 演示者, I want 右侧展示一个逼真的 iPhone 外壳包裹活动页面, so that 评委能感受真实手机端 H5 的视觉效果。

#### Acceptance Criteria

1. THE PhonePreview SHALL render a simulated iPhone shell container using Tailwind CSS, with rounded corners, a notch or status bar area, and appropriate aspect ratio
2. THE PhonePreview SHALL display a brand header area at the top of the H5 content with the text "⚡ XPENG 小鹏汽车官方活动"
3. THE PhonePreview SHALL apply the luxury_ai theme: dark background (#0A0A0A), primary accent color #00D4AA (小鹏翠绿), secondary accent color #F5A623 (琥珀金)
4. THE PhonePreview inner content area SHALL be independently scrollable when content exceeds the phone container height

---

### Requirement 5: 右侧手机预览 — 文案渲染

**User Story:** As a 演示者, I want 活动页面的所有文案都从 Config 对象读取, so that 未来接入真实 AI 接口时只需替换 Config 即可。

#### Acceptance Criteria

1. THE PhonePreview SHALL display the Config.tag field as a styled badge/label element
2. THE PhonePreview SHALL display the Config.title field as the main headline
3. THE PhonePreview SHALL display the Config.subtitle field as the sub-headline below the title
4. THE PhonePreview SHALL render each item in Config.sellingPoints as a separate card component
5. WHEN Config data changes, THE PhonePreview SHALL reflect the updated content without requiring a page reload

---

### Requirement 6: 互动大转盘组件

**User Story:** As a 活动参与者, I want 点击转盘抽奖, so that 我能获得随机奖品并感受活动的互动乐趣。

#### Acceptance Criteria

1. THE SpinWheel SHALL render a circular wheel divided into exactly 4 equal sectors, with each sector displaying the name of the corresponding prize from Config.prizes
2. THE SpinWheel SHALL display a clickable "抽奖" button at the center of the wheel
3. WHEN the user clicks the "抽奖" button and the LeadForm has NOT been submitted, THE SpinWheel SHALL display a prompt message "请先锁定品鉴名额" without spinning
4. WHEN the user clicks the "抽奖" button and the LeadForm HAS been submitted, THE SpinWheel SHALL animate a spinning rotation and come to rest on a randomly selected prize sector
5. THE SpinWheel spin animation SHALL last at least 3 seconds and decelerate smoothly before stopping
6. WHEN the SpinWheel stops, THE SpinWheel SHALL visually highlight the winning prize sector
7. WHILE the SpinWheel is spinning, THE SpinWheel SHALL disable the "抽奖" button to prevent re-triggering

---

### Requirement 7: 留资表单

**User Story:** As a 活动参与者, I want 填写姓名和手机号提交留资, so that 我能锁定品鉴名额并参与抽奖。

#### Acceptance Criteria

1. THE LeadForm SHALL display an input field labeled "您的姓名" for the user's name
2. THE LeadForm SHALL display an input field labeled "手机号码" for the user's phone number
3. THE LeadForm SHALL display a submit button labeled "立即锁定品鉴名额"
4. WHEN the user clicks the submit button with both fields filled, THE LeadForm SHALL trigger the Confetti animation and display the success message "预约成功！中奖短信已发送，线索已同步企业微信"
5. IF the user clicks the submit button with any field empty, THEN THE LeadForm SHALL display an inline validation error and prevent submission
6. WHEN the LeadForm is successfully submitted, THE LeadForm SHALL mark the form as completed, enabling SpinWheel interaction
7. WHEN the LeadForm is successfully submitted, THE LeadForm SHALL replace the form fields with the success message display

---

### Requirement 8: 全屏彩带动画

**User Story:** As a 活动参与者, I want 提交留资后看到全屏彩带庆祝效果, so that 活动氛围更加热烈，增强参与感。

#### Acceptance Criteria

1. WHEN the LeadForm is successfully submitted, THE Confetti SHALL launch a full-screen confetti animation using the canvas-confetti library
2. THE Confetti animation SHALL use colors consistent with the luxury_ai theme, including #00D4AA and #F5A623
3. THE Confetti animation SHALL complete within 3 seconds without blocking user interaction with the page

---

### Requirement 9: 技术约束与代码规范

**User Story:** As a 开发者, I want 代码符合项目技术栈规范, so that 代码可维护且与现有项目无缝集成。

#### Acceptance Criteria

1. THE Demo_Platform SHALL be implemented as a Next.js 16 App Router application modifying only `app/page.tsx` and adding new component files under `app/components/`
2. ALL interactive components that use React hooks or browser APIs SHALL include the `'use client'` directive at the top of the file
3. THE Demo_Platform SHALL use Tailwind CSS v4 with `@import "tailwindcss"` syntax (NOT `@tailwind` directives)
4. THE Demo_Platform SHALL install and use the `canvas-confetti` npm package and its `@types/canvas-confetti` type definitions for the Confetti feature
5. THE Demo_Platform SHALL define the Config object as a TypeScript const with explicit type annotations

---

### Requirement 10: 后端 API 路由 — /api/generate

**User Story:** As a 销售人员, I want 点击生成后系统真实调用 AI 大模型, so that 右侧预览内容由 DeepSeek 根据我的输入动态生成，而非写死的静态数据。

#### Acceptance Criteria

1. THE GenerateAPI SHALL be implemented as a Next.js App Router route handler at `app/api/generate/route.ts`, accepting HTTP POST requests with a JSON body containing a `userInput` string field
2. THE GenerateAPI SHALL include a `system_prompt` that locks the model to the 小鹏 GX brand identity, official tag "AI新豪华大六座SUV旗舰", and luxury_ai visual tone
3. THE GenerateAPI SHALL instruct the model to output a pure JSON string with no Markdown code fences (no ` ```json ` wrapping) containing exactly the fields: `theme`, `carModel`, `tag`, `title`, `subtitle`, `sellingPoints`, and `prizes`, so that the client can call `JSON.parse()` directly on the response body
4. THE GenerateAPI SHALL enforce that the model output contains a `prizes` array with exactly 4 items and a `sellingPoints` array with exactly 3 items
5. THE GenerateAPI SHALL call the DeepSeek API using the model's chat completion endpoint, passing the system_prompt and the user's raw input as messages
6. WHEN the DeepSeek API returns a valid response, THE GenerateAPI SHALL return the raw JSON string to the client with HTTP status 200 and `Content-Type: application/json`
7. IF the DeepSeek API call fails or returns a non-parseable response, THEN THE GenerateAPI SHALL return an HTTP 500 response with a descriptive error message
8. THE GenerateAPI SHALL read the DeepSeek API key from an environment variable and SHALL NOT hard-code credentials in source files
9. IF the request body is missing the `userInput` field or `userInput` is an empty string, THEN THE GenerateAPI SHALL return an HTTP 400 response with an error message indicating the field is required

---

### Requirement 11: 流式加载体验 — StepsUI 动画

**User Story:** As a 演示者, I want 点击生成后看到三步骤依次高亮的加载动画, so that 等待 AI 响应的 2–4 秒内演示效果流畅自然，不显突兀。

#### Acceptance Criteria

1. WHEN the user clicks the "一键生成" button, THE StepsUI SHALL immediately display the following three steps in order, each initially in a pending/inactive state:
   - "正在解析您的活动想法..."
   - "正在注入小鹏 GX AI新豪华大六座SUV旗舰核心卖点..."
   - "页面文案组装完毕，正在渲染预览..."
2. THE StepsUI SHALL activate (highlight with a ✓ checkmark) each step sequentially using a pure front-end timer, with an interval of 1000ms (±200ms tolerance) between each step activation
3. THE StepsUI animation SHALL be driven entirely by `setTimeout` or equivalent client-side timer without depending on the actual API response timing
4. WHEN all three steps have been activated AND the GenerateAPI has returned a response, THE Workbench SHALL pass the parsed JSON data to PhonePreview via `useState`, replacing the previous Config content
5. IF the GenerateAPI response arrives before the StepsUI animation completes, THE Workbench SHALL wait for the animation to finish (up to a maximum of 10 seconds from button click) before updating PhonePreview, ensuring a seamless visual transition
6. WHEN the StepsUI is active, THE Workbench SHALL disable the "一键生成" button to prevent duplicate submissions
7. WHEN the update is complete, THE StepsUI SHALL hide or reset, and THE Workbench SHALL re-enable the "一键生成" button
8. IF the GenerateAPI returns an error (HTTP 4xx/5xx) or the response cannot be parsed as valid JSON, THEN THE Workbench SHALL display an inline error message, hide the StepsUI, and re-enable the "一键生成" button without updating PhonePreview

---

### Requirement 12: 内存态互动闭环 — Mock 提交

**User Story:** As a 演示者, I want 手机端留资表单提交后弹出 Mock 成功提示, so that 完整的互动闭环在无数据库的情况下仍能流畅演示。

#### Acceptance Criteria

1. THE LeadForm SHALL operate in a stateless, in-memory mode: submitted form data SHALL NOT be persisted to any database, file system, or external service
2. WHEN the user clicks the submit button with both name and phone fields filled, THE MockSubmit SHALL display a modal or toast notification with the exact text "[Mock] 提交成功！"
3. THE MockSubmit notification SHALL be dismissible by the user (e.g., clicking a close button or clicking outside the modal); WHEN dismissed, the notification SHALL disappear and the page SHALL remain in the post-submission state
4. WHEN the MockSubmit notification is displayed, THE LeadForm SHALL still mark the form as completed so that SpinWheel interaction is enabled (consistent with Requirement 7, Acceptance Criterion 6)
5. THE Demo_Platform SHALL retain the full interactive flow after MockSubmit: the SpinWheel SHALL remain spinnable and the Confetti animation SHALL still trigger, preserving the complete demo experience
6. THE MockSubmit notification SHALL appear within 300ms of the submit button click to ensure a responsive feel
