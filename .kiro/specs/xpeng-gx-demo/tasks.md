# Implementation Plan: 小鹏 GX Demo 平台

## Overview

按照设计文档，将整个单页 Demo 拆分为以下实现阶段：
1. 安装依赖 & 全局样式扩展
2. Config 类型定义与数据文件
3. DemoLayout 双栏骨架
4. Workbench 工作台组件
5. AILogPanel 日志动画组件
6. PhonePreview 手机外壳与品牌区
7. 内容区文案渲染（tag / title / subtitle / 卖点卡片）
8. SpinWheel 互动大转盘
9. LeadForm 留资表单 + Confetti
10. 组装 app/page.tsx 入口
11. 测试

---

## Tasks

- [x] 1. 安装依赖并扩展全局样式
  - 在项目根目录执行 `npm install canvas-confetti @types/canvas-confetti`
  - 在 `app/globals.css` 中，在 `@theme inline` 块内追加以下 CSS 变量，供组件通过 Tailwind 任意值引用：
    ```css
    --color-xpeng-green: #00D4AA;
    --color-xpeng-gold: #F5A623;
    --color-xpeng-dark: #0A0A0A;
    --color-xpeng-card: #111827;
    ```
  - 同时追加以下自定义动画 keyframes（用于 PhonePreview 刷新过渡和 AILog 淡入）：
    ```css
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    .animate-fade-in-up {
      animation: fadeInUp 0.5s ease-out both;
    }
    .animate-fade-in {
      animation: fadeIn 0.4s ease-out both;
    }
    ```
  - _Requirements: 9.3, 8.2_

- [x] 2. 创建 Config 类型定义与数据文件
  - 新建文件 `app/config.ts`（无需 `'use client'`，纯数据文件）
  - 定义并导出 `Prize` 接口和 `DemoConfig` 接口（参见设计文档 Components and Interfaces 第 1 节）
  - 定义并导出 `config` 常量，写入设计文档中的完整静态数据
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 9.5_

- [x] 3. 创建 DemoLayout 双栏骨架组件
  - 新建文件 `app/components/DemoLayout.tsx`，顶部添加 `'use client'`
  - 使用 `useState` 定义三个状态：`isGenerating: boolean`、`isFormSubmitted: boolean`、`previewKey: number`
  - 实现 `handleGenerate` 函数：
    - 设置 `isGenerating = true`
    - `setTimeout` 2600ms 后：设置 `isGenerating = false`，`previewKey += 1`
  - 实现 `handleFormSubmit` 函数：设置 `isFormSubmitted = true`
  - 渲染结构：
    ```
    <div className="flex h-screen bg-[#0A0A0A] overflow-hidden">
      <div className="w-2/5 ..."> {/* 左侧工作台占位 */} </div>
      <div className="w-3/5 ..."> {/* 右侧预览占位 */} </div>
    </div>
    ```
  - 暂时用 `<div>` 占位，后续步骤替换为真实组件
  - _Requirements: 1.1, 1.2, 1.4_

- [x] 4. 创建 Workbench 工作台组件
  - 新建文件 `app/components/Workbench.tsx`，顶部添加 `'use client'`
  - 接收 props：`isGenerating: boolean`、`onGenerate: () => void`
  - 渲染结构：
    - 顶部标题区：显示"AI 工作台"标签（带小鹏翠绿色点缀）
    - `<textarea>` 元素：
      - `defaultValue` 设为预设文案（见需求 2.1）
      - 样式：深色背景、翠绿色边框 focus 效果、白色文字、圆角
      - 高度约 `h-40`，宽度 `w-full`
    - "一键生成"按钮：
      - `disabled={isGenerating}`
      - loading 时显示旋转 spinner 图标 + "生成中..."文字
      - 非 loading 时显示"⚡ 一键生成活动页"文字
      - 样式：琥珀金背景（`bg-[#F5A623]`）、黑色文字、圆角、hover 效果
    - 条件渲染 `<AILogPanel isVisible={isGenerating} />`（步骤 5 实现后替换）
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6_

- [x] 5. 创建 AILogPanel 日志动画组件
  - 新建文件 `app/components/AILogPanel.tsx`，顶部添加 `'use client'`
  - 接收 props：`isVisible: boolean`
  - 定义常量 `LOG_MESSAGES` 数组（4 条日志，见需求 3.2）
  - 使用 `useState<number>` 维护 `visibleCount`（已显示的日志条数）
  - 使用 `useEffect`：当 `isVisible` 变为 `true` 时，重置 `visibleCount = 0`，然后用 `setInterval` 每 600ms 递增 `visibleCount`，当 `visibleCount >= LOG_MESSAGES.length` 时清除 interval
  - 当 `isVisible` 变为 `false` 时，重置 `visibleCount = 0`
  - 渲染：`isVisible` 为 true 时，显示一个深色面板，逐条渲染 `LOG_MESSAGES.slice(0, visibleCount)`，每条消息应用 `animate-fade-in-up` 类
  - 每条日志前显示绿色"●"指示点
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 6. 在 DemoLayout 中集成 Workbench 和 AILogPanel
  - 在 `DemoLayout.tsx` 中导入 `Workbench` 组件
  - 将左侧占位 `<div>` 替换为 `<Workbench isGenerating={isGenerating} onGenerate={handleGenerate} />`
  - 确认 `handleGenerate` 的 2600ms 延迟与 AILogPanel 的 4×600ms=2400ms 时序匹配
  - _Requirements: 2.3, 2.4, 3.4, 3.5_

- [x] 7. 创建 PhonePreview 手机外壳与品牌区组件
  - 新建文件 `app/components/PhonePreview.tsx`，顶部添加 `'use client'`
  - 接收 props：`config: DemoConfig`、`previewKey: number`、`isFormSubmitted: boolean`、`onFormSubmit: () => void`
  - 渲染 iPhone 外壳容器：
    - 外层：`w-[375px]` 宽度、`h-[780px]` 高度、`rounded-[48px]`、`border-4 border-gray-700`、`bg-[#0A0A0A]`、`shadow-2xl`、`overflow-hidden`、`relative`
    - 顶部刘海区：`h-8`、`bg-black`、居中显示一个 `w-24 h-5 bg-black rounded-b-2xl`（刘海形状）
    - 内容区：`flex-1 overflow-y-auto`，使用 `key={previewKey}` 触发重新挂载，应用 `animate-fade-in` 类
  - 品牌标题区（内容区顶部）：
    - 渐变背景：`bg-gradient-to-b from-[#00D4AA]/20 to-transparent`
    - 显示"⚡ XPENG 小鹏汽车官方活动"，翠绿色文字，居中
    - 下方显示 `config.tag` 作为徽章（琥珀金背景、黑色文字、圆角 pill）
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1_

- [x] 8. 实现 PhonePreview 内容区文案渲染
  - 在 `PhonePreview.tsx` 的内容区中，品牌区下方继续添加：
  - 标题区块：
    - `config.title`：大号白色粗体文字（`text-2xl font-bold text-white`）
    - `config.subtitle`：小号翠绿色文字（`text-[#00D4AA] text-sm`）
  - 卖点卡片区块：
    - 遍历 `config.sellingPoints`，每项渲染一个卡片 `<div>`
    - 卡片样式：`bg-[#111827]`、`rounded-xl`、`p-4`、`border border-[#00D4AA]/20`
    - 卡片内文字：白色，`text-sm`
    - 每张卡片左侧有翠绿色竖线装饰（`border-l-2 border-[#00D4AA]`）
  - _Requirements: 5.2, 5.3, 5.4_

- [ ]* 8.1 为 PhonePreview 文案渲染编写属性测试
  - 使用 fast-check 生成随机 DemoConfig（tag/title/subtitle 为任意非空字符串，sellingPoints 为 1-10 项的字符串数组）
  - **Property 1: Config 文本字段完整渲染** — 验证渲染输出包含 tag、title、subtitle 的文本内容
  - **Property 2: 卖点卡片数量与 Config 一致** — 验证渲染的卡片数量等于 sellingPoints.length
  - **Property 3: Config 响应式更新** — 验证切换 Config 后所有字段更新
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 9. 创建 SpinWheel 互动大转盘组件
  - 新建文件 `app/components/SpinWheel.tsx`，顶部添加 `'use client'`
  - 接收 props：`prizes: Prize[]`、`isFormSubmitted: boolean`
  - 使用 `useState` 维护：`rotation: number`（当前旋转角度）、`isSpinning: boolean`、`winnerIndex: number | null`、`showPrompt: boolean`
  - SVG 转盘实现（`viewBox="0 0 200 200"`，圆心 100,100，半径 90）：
    - 使用 SVG `<path>` 绘制 4 个扇形，每个 90°
    - 扇形颜色交替：`#00D4AA`（翠绿）和 `#1A2744`（深蓝黑）
    - 每个扇形内用 SVG `<text>` 显示奖品名（沿扇形中线，`fontSize="8"`，`fill="white"`，需要 `transform` 旋转到对应角度）
    - 外圈：`<circle>` 描边，`stroke="#F5A623"`（琥珀金）
    - 整个 SVG 应用 `style={{ transform: \`rotate(\${rotation}deg)\`, transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none' }}`
  - 中心"抽奖"按钮：绝对定位在转盘中心，圆形，琥珀金背景，`disabled={isSpinning}`
  - 顶部指针：一个小三角形 SVG，固定在转盘顶部中心，指向 12 点方向
  - `handleSpin` 函数逻辑：
    - 若 `!isFormSubmitted`：设置 `showPrompt = true`，2 秒后清除
    - 若 `isFormSubmitted && !isSpinning`：
      - 随机选择 winnerIndex（0-3）
      - 计算 targetRotation：`rotation + 360 * 5 + (360 - winnerIndex * 90 - 45)`（使指针指向该扇区中心）
      - 设置 `isSpinning = true`，`rotation = targetRotation`
      - `setTimeout` 4100ms 后：设置 `isSpinning = false`，`winnerIndex = selectedIndex`
  - 获奖后在转盘下方显示获奖奖品名（琥珀金文字）
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ]* 9.1 为 SpinWheel 编写属性测试
  - 使用 fast-check 生成随机 prizes 数组（固定 4 项，名称为任意非空字符串）
  - **Property 4: 转盘奖品渲染与抽奖结果合法性** — 验证所有奖品名出现在渲染输出中，且模拟多次 handleSpin 后 winnerIndex 始终在 [0, 3] 范围内
  - _Requirements: 6.1, 6.4_

- [x] 10. 创建 LeadForm 留资表单组件
  - 新建文件 `app/components/LeadForm.tsx`，顶部添加 `'use client'`
  - 接收 props：`onSubmitSuccess: () => void`
  - 使用 `useState` 维护：`name: string`、`phone: string`、`errors: { name?: string; phone?: string }`、`isSubmitted: boolean`
  - 渲染（`isSubmitted` 为 false 时）：
    - 标题："锁定品鉴名额"（白色粗体）
    - 姓名输入框：label "您的姓名"，`value={name}`，`onChange` 更新 name，错误时显示红色提示
    - 手机号输入框：label "手机号码"，`value={phone}`，`onChange` 更新 phone，错误时显示红色提示
    - 提交按钮："立即锁定品鉴名额"，翠绿色背景
    - 输入框样式：深色背景、翠绿色 focus 边框、白色文字
  - `handleSubmit` 函数：
    - 验证 name.trim() 非空，否则设置 errors.name
    - 验证 phone.trim() 非空，否则设置 errors.phone
    - 若验证通过：调用 `launchConfetti()`，设置 `isSubmitted = true`，调用 `onSubmitSuccess()`
  - `launchConfetti` 函数：
    - 动态 import `canvas-confetti`（`import('canvas-confetti')`）
    - 调用 confetti，参数包含 `colors: ['#00D4AA', '#F5A623', '#ffffff']`，`particleCount: 150`，`spread: 70`，`origin: { y: 0.6 }`
    - 用 try/catch 包裹，静默处理异常
  - 渲染（`isSubmitted` 为 true 时）：
    - 显示成功消息卡片：翠绿色边框，内容"🎉 预约成功！中奖短信已发送，线索已同步企业微信"
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 8.1, 8.2, 8.3_

- [ ]* 10.1 为 LeadForm 编写属性测试
  - 使用 fast-check 生成各种空/非空字段组合
  - **Property 5: 空字段表单验证** — 对任意至少一个字段为空或纯空白的输入，验证 onSubmitSuccess 未被调用且错误信息显示
  - **Property 6: 彩带动画使用主题色** — mock canvas-confetti，对任意成功提交，验证调用参数的 colors 数组包含 #00D4AA 和 #F5A623
  - _Requirements: 7.5, 8.2_

- [x] 11. 在 PhonePreview 中集成 SpinWheel 和 LeadForm
  - 在 `PhonePreview.tsx` 中导入 `SpinWheel` 和 `LeadForm`
  - 在卖点卡片区块下方，依次添加：
    - `<SpinWheel prizes={config.prizes} isFormSubmitted={isFormSubmitted} />`
    - `<LeadForm onSubmitSuccess={onFormSubmit} />`
  - 两个组件之间添加适当间距（`mt-6`）
  - _Requirements: 6.1, 7.1_

- [x] 12. 在 DemoLayout 中集成 PhonePreview
  - 在 `DemoLayout.tsx` 中导入 `PhonePreview` 组件
  - 将右侧占位 `<div>` 替换为：
    ```tsx
    <div className="w-3/5 flex items-center justify-center bg-[#0D0D0D]">
      <PhonePreview
        config={config}
        previewKey={previewKey}
        isFormSubmitted={isFormSubmitted}
        onFormSubmit={handleFormSubmit}
      />
    </div>
    ```
  - 左侧工作台区域添加适当内边距和背景（`bg-[#111111] p-8`）
  - _Requirements: 1.1, 1.3, 3.5_

- [x] 13. 更新 app/page.tsx 入口文件
  - 修改 `app/page.tsx`，删除现有 Next.js 默认内容
  - 导入 `DemoLayout` 和 `config`
  - 渲染：
    ```tsx
    import DemoLayout from './components/DemoLayout';
    import { config } from './config';

    export default function Home() {
      return <DemoLayout config={config} />;
    }
    ```
  - 确认 `app/page.tsx` 本身不需要 `'use client'`（它是 Server Component，只渲染 DemoLayout）
  - _Requirements: 1.1, 9.1, 9.2_

- [x] 14. Checkpoint — 基础渲染验证
  - 确认所有组件文件已创建且无 TypeScript 编译错误
  - 确认 `canvas-confetti` 和 `@types/canvas-confetti` 已安装
  - 确认 `app/globals.css` 中的自定义 CSS 变量和动画已添加
  - 确认页面可以正常渲染双栏布局（运行 `npm run build` 验证无构建错误）
  - 如有问题，请向用户说明并等待指示

- [x] 15. 视觉精修与细节完善
  - [x] 15.1 Workbench 视觉精修
    - 添加工作台顶部标题栏：显示"🤖 AI 营销工作台"，带翠绿色下划线装饰
    - textarea 添加字符计数显示（右下角，灰色小字）
    - 生成按钮添加 hover 时的琥珀金光晕效果（`hover:shadow-[0_0_20px_#F5A623/50]`）
    - AILogPanel 面板添加终端风格样式（等宽字体、绿色文字、黑色背景）
    - _Requirements: 2.1, 2.2, 3.1_

  - [x] 15.2 PhonePreview 视觉精修
    - iPhone 外壳添加侧边按钮细节（左侧音量键、右侧电源键，用细长 `<div>` 模拟）
    - 手机外壳添加微妙的金属质感边框渐变（`border-gradient` 或 `ring` 效果）
    - 品牌区添加动态光晕背景（翠绿色径向渐变，低透明度）
    - 卖点卡片添加 hover 时的翠绿色边框高亮
    - _Requirements: 4.1, 4.3_

  - [x] 15.3 SpinWheel 视觉精修
    - 转盘外圈添加琥珀金光晕阴影（`filter: drop-shadow(0 0 8px #F5A623)`）
    - 中心抽奖按钮添加脉冲动画（`animate-pulse`，仅在 isFormSubmitted 且未抽奖时）
    - 获奖扇区添加高亮效果（亮度提升或边框描边）
    - _Requirements: 6.2, 6.6_

  - [x] 15.4 LeadForm 视觉精修
    - 表单容器添加翠绿色顶部渐变边框（`border-t-2 border-[#00D4AA]`）
    - 输入框 focus 时添加翠绿色外发光（`focus:ring-2 focus:ring-[#00D4AA]/50`）
    - 提交按钮添加渐变背景（从翠绿到深翠绿）
    - 成功消息卡片添加淡入动画（`animate-fade-in`）
    - _Requirements: 7.1, 7.2, 7.3, 7.7_

- [x] 16. Final Checkpoint — 完整功能验证
  - 确认所有测试通过（如已编写）
  - 手动验证完整交互流程：
    1. 页面加载 → 双栏布局正常显示
    2. 点击"一键生成" → loading 状态 + AI 日志逐条出现 → 右侧预览 fade-in 刷新
    3. 点击转盘"抽奖" → 提示"请先锁定品鉴名额"
    4. 填写姓名和手机号 → 点击提交 → 全屏彩带 + 成功消息
    5. 再次点击转盘"抽奖" → 转盘旋转 → 停在随机奖品 → 显示获奖奖品名
  - 确认所有文案均从 config 对象读取，无硬编码
  - 确认 `npm run build` 无错误
  - 如有问题，请向用户说明并等待指示

- [x] 17. 创建 `/api/generate` 后端路由
  - 新建文件 `app/api/generate/route.ts`（无需 `'use client'`，为 Server-side Route Handler）
  - 接收 POST 请求，从 request body 中解析 `{ userInput: string }`
  - 验证 `userInput.trim()` 非空，否则返回 HTTP 400 `{ error: 'userInput is required' }`
  - 构造 `system_prompt`，内容需：
    - 锁定车型为小鹏 GX，强调品牌调性
    - 强制要求输出为纯 JSON 字符串，禁止任何 Markdown 代码块包裹（如 ` ```json ` ）
    - 指定 `prizes` 数组严格为 4 个元素
    - 指定 `sellingPoints` 数组严格为 3 个元素
    - 输出 JSON 结构与 `DemoConfig` 接口一致（tag、title、subtitle、sellingPoints、prizes）
  - 从 `process.env.DEEPSEEK_API_KEY` 读取 API Key，向 `https://api.deepseek.com/v1/chat/completions` 发送 POST 请求
  - 请求体格式：`{ model: 'deepseek-chat', messages: [{ role: 'system', content: system_prompt }, { role: 'user', content: userInput }] }`
  - 提取响应中的 `choices[0].message.content`，尝试 `JSON.parse`，失败则返回 HTTP 500 `{ error: 'Invalid JSON from AI' }`
  - 解析成功则返回 HTTP 200，body 为该 JSON 字符串（`Content-Type: application/json`）
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 18. 创建 `.env.local` 环境变量文件
  - 在项目根目录新建 `.env.local` 文件，内容为：
    ```
    DEEPSEEK_API_KEY=
    ```
  - 检查 `.gitignore`，确认 `.env.local` 已被忽略（Next.js 默认模板通常已包含，若缺失则追加一行 `.env.local`）
  - _Requirements: 10.3_

- [x] 19. 创建 StepsUI 组件
  - 新建文件 `app/components/StepsUI.tsx`，顶部添加 `'use client'`
  - 接收 props：`isVisible: boolean`、`onAnimationComplete: () => void`
  - 定义常量 `STEPS` 数组，包含三条步骤文案：
    1. `"正在解析您的活动想法..."`
    2. `"正在注入小鹏 GX AI新豪华大六座SUV旗舰核心卖点..."`
    3. `"页面文案组装完毕，正在渲染预览..."`
  - 使用 `useState<number>` 维护 `activeStep`（当前已激活的步骤数，初始为 0）
  - 使用 `useEffect`：当 `isVisible` 变为 `true` 时，重置 `activeStep = 0`，然后用 `setInterval` 每 1000ms 递增 `activeStep`；当 `activeStep >= STEPS.length` 时清除 interval 并调用 `onAnimationComplete()`
  - 当 `isVisible` 变为 `false` 时，重置 `activeStep = 0`
  - 渲染：`isVisible` 为 true 时，显示深色面板，逐条渲染 `STEPS.slice(0, activeStep)`，已激活步骤前显示绿色"✓"，未激活步骤前显示灰色"○"
  - 每条步骤应用 `animate-fade-in-up` 类
  - _Requirements: 11.1, 11.2, 11.3_

- [x] 20. 更新 DemoLayout 集成真实 API 调用
  - 在 `DemoLayout.tsx` 中：
    - 新增 `config` state（`useState<DemoConfig>`，初始值为从 `app/config.ts` 导入的静态 `config`）
    - 新增 `apiError` state（`useState<string | null>`，初始为 `null`）
    - 新增 `animationDone` ref 或 state，用于协调 StepsUI 动画与 API 请求的并行完成
  - 将 `handleGenerate` 改为接收 `userInput: string` 参数，逻辑改为：
    - 设置 `isGenerating = true`，清空 `apiError`
    - 并行启动两件事：
      1. StepsUI 动画（通过 `isGenerating` prop 驱动，动画完成时触发 `onAnimationComplete` 回调）
      2. `fetch('/api/generate', { method: 'POST', body: JSON.stringify({ userInput }), headers: { 'Content-Type': 'application/json' } })`
    - 两者都完成后（使用 `Promise.all` 或状态协调）：更新 `config` state 为 API 返回的新 config，递增 `previewKey`，设置 `isGenerating = false`
    - 若 API 请求失败（非 2xx 或 JSON.parse 失败）：设置 `apiError` 为错误信息，设置 `isGenerating = false`
  - 将 `onGenerate` prop 类型更新为 `(userInput: string) => void`，传递给 `Workbench`
  - _Requirements: 10.5, 11.3, 12.1, 12.2, 12.3_

- [x] 21. 更新 Workbench 传递 userInput 并显示 StepsUI
  - 在 `Workbench.tsx` 中：
    - 将 `<textarea>` 改为受控组件：新增 `useState<string>` 维护 `userInput`，`value={userInput}`，`onChange` 更新 state
    - 将 `onGenerate` prop 类型更新为 `(userInput: string) => void`
    - "一键生成"按钮的 `onClick` 改为调用 `onGenerate(userInput)`
    - 将条件渲染的 `<AILogPanel isVisible={isGenerating} />` 替换为 `<StepsUI isVisible={isGenerating} onAnimationComplete={onAnimationComplete} />`
    - 新增 prop `onAnimationComplete: () => void`，透传给 `StepsUI`
    - 新增 prop `apiError: string | null`，在生成按钮下方条件渲染内联错误信息（红色文字，`text-sm text-red-400`）
  - _Requirements: 11.1, 11.2, 12.1, 12.3_

- [x] 22. 创建 MockSubmit Modal 组件
  - 新建文件 `app/components/MockSubmit.tsx`，顶部添加 `'use client'`
  - 接收 props：`isOpen: boolean`、`onClose: () => void`
  - 弹窗在 `isOpen` 变为 `true` 后 300ms 内完成显示（使用 `useEffect` + `setTimeout` 或 CSS transition）
  - 渲染：半透明黑色遮罩层（`fixed inset-0 bg-black/60`）+ 居中白色卡片
  - 卡片内容：精确文本 `"[Mock] 提交成功！"`（粗体，居中），以及一个关闭按钮（"✕" 或 "确认"）
  - 点击关闭按钮或遮罩层时调用 `onClose()`
  - 关闭后 `formSubmitted` 状态在父组件中保持 `true`（MockSubmit 本身不管理此状态）
  - _Requirements: 12.4, 12.5_

- [x] 23. 更新 LeadForm 集成 MockSubmit 弹窗
  - 在 `LeadForm.tsx` 中：
    - 新增 `useState<boolean>` 维护 `showMockSubmit`（初始为 `false`）
    - 在 `handleSubmit` 验证通过后，将原来直接设置 `isSubmitted = true` 的逻辑改为：先设置 `showMockSubmit = true`
    - 导入并渲染 `<MockSubmit isOpen={showMockSubmit} onClose={handleMockClose} />`
    - 实现 `handleMockClose` 函数：设置 `showMockSubmit = false`，设置 `isSubmitted = true`，调用 `onSubmitSuccess()`
    - 成功消息卡片（`isSubmitted` 为 true 时）保持原有渲染逻辑不变
  - _Requirements: 12.4, 12.5_

- [x] 24. Final Checkpoint — API 集成完整验证
  - 确认 `.env.local` 已创建且 `DEEPSEEK_API_KEY` 占位符存在
  - 确认 `.gitignore` 包含 `.env.local`
  - 确认 `npm run build` 无 TypeScript 编译错误
  - 手动验证完整新交互流程：
    1. 在 textarea 输入活动描述 → 点击"一键生成" → StepsUI 三步动画依次出现
    2. API 返回后 → 右侧手机预览 fade-in 刷新，显示 AI 生成的新文案
    3. 填写姓名手机号 → 点击提交 → 弹出 MockSubmit 弹窗显示"[Mock] 提交成功！"
    4. 关闭弹窗 → 显示成功消息卡片 → 转盘可正常抽奖
  - 如有问题，请向用户说明并等待指示

## Notes

- 标有 `*` 的子任务为可选测试任务，可跳过以加快 MVP 交付
- 每个任务均引用了对应的需求条款，便于追溯
- 所有交互组件必须包含 `'use client'` 指令（Next.js 16 App Router 要求）
- Tailwind CSS v4 使用 `@import "tailwindcss"` 语法，自定义颜色通过 `@theme inline` 块或任意值语法（`bg-[#00D4AA]`）实现
- canvas-confetti 使用动态 import 以避免 SSR 问题
- SpinWheel 的旋转角度计算需确保指针（固定在 12 点方向）最终指向目标扇区中心
- `.env.local` 中的 `DEEPSEEK_API_KEY` 需在本地填入真实 Key 后方可调用 DeepSeek API
- StepsUI 动画时长约 3000ms（3 步 × 1000ms），与 DeepSeek API 典型响应时间（2-4s）并行，两者均完成后才更新预览
- MockSubmit 弹窗仅作演示用途，不写入任何数据库

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2"] },
    { "id": 2, "tasks": ["3"] },
    { "id": 3, "tasks": ["4", "7"] },
    { "id": 4, "tasks": ["5", "8"] },
    { "id": 5, "tasks": ["6", "8.1", "9"] },
    { "id": 6, "tasks": ["9.1", "10"] },
    { "id": 7, "tasks": ["10.1", "11"] },
    { "id": 8, "tasks": ["12"] },
    { "id": 9, "tasks": ["13"] },
    { "id": 10, "tasks": ["14"] },
    { "id": 11, "tasks": ["15.1", "15.2", "15.3", "15.4"] },
    { "id": 12, "tasks": ["16"] },
    { "id": 13, "tasks": ["17", "18", "19"] },
    { "id": 14, "tasks": ["20", "22"] },
    { "id": 15, "tasks": ["21", "23"] },
    { "id": 16, "tasks": ["24"] }
  ]
}
```
