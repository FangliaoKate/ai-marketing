# Implementation Plan: 小鹏 AI 营销 Demo 多车型平台

## Overview

本实现计划将现有单车型（小鹏 GX）AI 营销 H5 Demo 扩展为支持五款车型的多车型平台。核心改动分为四个层次：

1. **共享知识库**：在 `app/config.ts` 中扩展 `CAR_MODEL_MAP` 和 `THEME_MAP`，作为前后端唯一数据源
2. **后端 API 升级**：`/api/generate` 路由支持 `carModel` 参数，动态注入车型专属 System Prompt
3. **工作台升级**：新增 `ModelSelector` 组件，`Workbench` 和 `StepsUI` 联动车型状态
4. **预览区换肤**：`PhonePreview`、`SpinWheel`、`LeadForm` 通过 `ThemeTokens` 实现动态配色

---

## Tasks

- [x] 1. 扩展 `app/config.ts` 共享知识库
  - 新增并导出类型：`CarModelId`、`Theme`、`CarModelMeta`、`ThemeTokens`
  - 新增并导出常量 `CAR_MODEL_MAP`，包含五款车型的完整元数据（id、displayName、tag、sellingPoints、theme、promptPlaceholder）
  - 新增并导出常量 `THEME_MAP`，包含五种主题的完整 token（bg、primary、secondary、haloColor、cardBorder、buttonGradient、sectorColors、pointerColor、ringColor）
  - 新增并导出纯函数 `getThemeTokens(theme: string): ThemeTokens`，对无效 theme 回退到 `luxury_ai`
  - 保留现有 `Prize`、`DemoConfig`、`config` 导出，确保向后兼容
  - _Requirements: 5.1, 5.2, 10.1, 10.3_

  - [x] 1.1 为 `getThemeTokens` 编写属性测试
    - 新建 `__tests__/config.test.ts`，安装 `fast-check` 依赖
    - **Property 9: ThemeEngine 对任意有效 theme 返回正确 token**
      - `fc.constantFrom(...THEME_IDS)` → 验证 `primary`、`secondary`、`bg`、`buttonGradient`、`sectorColors` 与预定义调色板一致
      - **Validates: Requirements 5.1, 5.2**
    - **Property 10: 无效 theme 回退到 luxury_ai**
      - `fc.string().filter(s => !THEME_IDS.includes(s))` → 验证返回值等于 `THEME_MAP['luxury_ai']`
      - **Validates: Requirements 5.5**
    - **Property 19: carModel→theme 映射不可变**
      - `fc.constantFrom(...CAR_MODEL_IDS)` → 验证 `CAR_MODEL_MAP[id].theme` 始终返回预定义值
      - **Validates: Requirements 10.1**
    - _Requirements: 5.1, 5.2, 5.5, 10.1_

- [x] 2. 升级 `/api/generate` 路由支持多车型
  - 在 `app/api/generate/route.ts` 中，从请求体解析 `carModel` 字段（string，最大 100 字符）
  - 验证 `carModel` 非空且在 `['gx','x9','g6','p7i','m03']` 枚举内，否则返回 HTTP 400
  - 从 `app/config.ts` 导入 `CAR_MODEL_MAP`，根据 `carModel` 动态构建 System Prompt，注入对应车型的 `displayName`、`tag`、`sellingPoints`、`theme`
  - 在 System Prompt 中锁定 `theme` 和 `carModel` 字段值，确保 AI 返回的 JSON 与请求车型一致
  - 新增 `AbortSignal.timeout(30000)` 包裹 DeepSeek fetch 调用，超时返回 HTTP 502
  - 验证 `DEEPSEEK_API_KEY` 环境变量存在，否则返回 HTTP 500
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10, 10.2_

  - [x]* 2.1 为 GenerateAPI 编写属性测试
    - 新建 `__tests__/api/generate.test.ts`，使用 `testEnvironment: 'node'`
    - **Property 16: 缺少或空 userInput / carModel 返回 HTTP 400**
      - `fc.record({ userInput: fc.option(fc.string()), carModel: fc.option(fc.string()) })` → 验证缺失或空字段时响应状态为 400
      - **Validates: Requirements 9.2**
    - **Property 17: 无效 carModel 枚举值返回 HTTP 400**
      - `fc.string().filter(s => !CAR_MODEL_IDS.includes(s as CarModelId))` → 验证响应状态为 400
      - **Validates: Requirements 9.3**
    - **Property 18: System Prompt 包含车型专属元数据**
      - `fc.constantFrom(...CAR_MODEL_IDS)` → mock DeepSeek fetch，捕获 System Prompt，验证包含对应 `tag` 和全部三个 `sellingPoints` 关键词
      - **Validates: Requirements 9.4, 10.2**
    - _Requirements: 9.2, 9.3, 9.4, 10.2_

- [x] 3. 新建 `ModelSelector` 组件
  - 新建文件 `app/components/ModelSelector.tsx`，顶部添加 `'use client'`
  - Props：`models: CarModelMeta[]`、`selectedId: CarModelId`、`onChange: (id: CarModelId) => void`、`disabled: boolean`
  - 渲染横向 Tab 条，每个选项显示车型 `displayName`
  - 选中项使用对应主题 `primary` 色高亮（背景色或边框色），未选中项使用中性灰色
  - `disabled` 为 true 时，整个 Tab 条应用 `opacity-50 pointer-events-none`
  - _Requirements: 1.1, 1.2, 1.5_

  - [x]* 3.1 为 `ModelSelector` 编写属性测试
    - 新建 `__tests__/ModelSelector.test.tsx`，使用 `@testing-library/react`
    - **Property 1: 点击任意车型选项后该车型成为选中状态**
      - `fc.constantFrom(...CAR_MODEL_IDS)` → 模拟点击，验证 `onChange` 被调用且参数为对应 ID
      - **Validates: Requirements 1.2**
    - **Property 3: isGenerating 时 ModelSelector 禁用状态与 isGenerating 一致**
      - `fc.boolean()` → 验证 `disabled` prop 等于 `isGenerating` 时，Tab 条的 `pointer-events` 状态正确
      - **Validates: Requirements 1.5**
    - _Requirements: 1.2, 1.5_

- [x] 4. 升级 `Workbench.tsx` 集成车型选择与输入联动
  - 新增 props：`selectedCarModel: CarModelId`、`onModelChange: (id: CarModelId) => void`
  - 在工作台顶部渲染 `<ModelSelector models={Object.values(CAR_MODEL_MAP)} selectedId={selectedCarModel} onChange={onModelChange} disabled={isGenerating} />`
  - `<textarea>` 改为受控组件：初始 `value` 设为 GX 默认示例文本；`placeholder` 随 `selectedCarModel` 变化更新为对应 `promptPlaceholder`；切换车型时不清空已输入内容
  - 字符计数改为显示 `{userInput.length}/500`，并添加 `maxLength={500}`
  - 点击生成按钮前验证 `userInput.trim()` 非空，否则显示内联错误"请输入活动想法"，阻止 API 调用
  - `onGenerate` 调用签名改为 `onGenerate(userInput: string, carModel: CarModelId)`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2_

  - [x]* 4.1 为 `Workbench` 编写属性测试
    - 新建 `__tests__/Workbench.test.tsx`
    - **Property 2: 切换车型时 textarea value 不变，placeholder 更新**
      - `fc.string({ minLength: 1 })` + `fc.constantFrom(...CAR_MODEL_IDS)` → 预填内容后切换车型，验证 `value` 不变、`placeholder` 等于新车型的 `promptPlaceholder`
      - **Validates: Requirements 1.3, 2.3**
    - **Property 4: 字符计数显示与实际输入长度一致**
      - `fc.string({ maxLength: 500 })` → 验证显示文本为 `"{n}/500"`
      - **Validates: Requirements 2.4**
    - **Property 5: 纯空白输入阻止 API 调用并显示错误**
      - `fc.stringOf(fc.constantFrom(' ', '\t', '\n'))` → 验证 `onGenerate` 未被调用，错误文本"请输入活动想法"可见
      - **Validates: Requirements 2.5**
    - _Requirements: 1.3, 2.3, 2.4, 2.5_

- [x] 5. 升级 `StepsUI.tsx` 动态注入车型信息
  - 新增 prop：`carModel: CarModelMeta`（替换硬编码的 GX 文本）
  - 将 `STEPS` 常量改为根据 `carModel` 动态生成的函数或 useMemo：
    1. `"正在解析您的活动想法..."`
    2. `"已拦截车型上下文，正在注入 {carModel.displayName} {carModel.tag} 核心卖点..."`
    3. `"正在根据 {carModel.displayName} 调性匹配专属 H5 视觉皮肤..."`
  - 当 `isVisible` 变为 true 时，使用当前 `carModel` 快照生成步骤文本（避免动画中途切换车型导致文本跳变）
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x]* 5.1 为 `StepsUI` 编写属性测试
    - 新建 `__tests__/StepsUI.test.tsx`
    - **Property 8: 步骤文本包含当前车型的 displayName 和 tag**
      - `fc.constantFrom(...Object.values(CAR_MODEL_MAP))` → 渲染 `StepsUI`，等待步骤激活，验证步骤 2 文本同时包含 `carModel.displayName` 和 `carModel.tag`
      - **Validates: Requirements 4.2**
    - _Requirements: 4.2_

- [x] 6. Checkpoint — 工作台与 API 联调验证
  - 确认 `CAR_MODEL_MAP` 和 `THEME_MAP` 在 `app/config.ts` 中完整定义，TypeScript 无编译错误
  - 确认 `/api/generate` 路由对五款车型均能正确构建 System Prompt（可通过单元测试或手动 curl 验证）
  - 确认 `ModelSelector` 渲染五个选项，切换时 `placeholder` 正确更新
  - 运行 `npm run build` 确认无构建错误，如有问题请向用户说明并等待指示

- [x] 7. 升级 `PhonePreview.tsx` 接入 ThemeTokens
  - 新增 prop：`themeTokens: ThemeTokens`（由父组件 `DemoLayout` 通过 `getThemeTokens(config.theme)` 派生后传入）
  - 将品牌头部光晕区的硬编码颜色 `#00D4AA` 替换为 `themeTokens.haloColor`（径向渐变）和 `themeTokens.primary`（文字色）
  - 将 tag 徽章背景色从硬编码 `#F5A623` 替换为 `themeTokens.secondary`
  - 将 `subtitle` 文字色从硬编码 `#00D4AA` 替换为 `themeTokens.primary`
  - 将 `themeTokens` 向下传递给 `<LeadForm>` 和 `<SpinWheel>`
  - 确保 `previewKey` 变化时触发 `animate-fade-in` 淡入动画（200ms–400ms），与主题切换同帧完成
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.5_

  - [x]* 7.1 为 `PhonePreview` 编写属性测试
    - 新建 `__tests__/PhonePreview.test.tsx`
    - **Property 11: PhonePreview 渲染 DemoConfig 的全部文本字段**
      - `fc.record({ tag: fc.string({minLength:1}), title: fc.string({minLength:1}), subtitle: fc.string({minLength:1}), sellingPoints: fc.array(fc.string({minLength:1}), {minLength:1, maxLength:5}), prizes: fc.array(fc.record({id: fc.nat(), name: fc.string({minLength:1})}), {minLength:1, maxLength:8}) })` → 验证渲染输出包含 `tag`、`title`、`subtitle` 及所有 `sellingPoints` 文本
      - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 8. 升级 `SpinWheel.tsx` 接入 ThemeTokens 并修复旋转精度
  - 新增 prop：`themeTokens: ThemeTokens`
  - 将扇面颜色从硬编码 `sectorColors` 数组替换为 `themeTokens.sectorColors[index % 2]`
  - 将指针颜色从硬编码 `#F5A623` 替换为 `themeTokens.pointerColor`
  - 将外圈描边颜色从硬编码 `#F5A623` 替换为 `themeTokens.ringColor`
  - 旋转时长改为每次随机取 3000ms–8000ms 之间的值（`Math.random() * 5000 + 3000`），CSS transition duration 同步更新
  - 验证旋转角度计算：指针固定在 12 点（0°），目标扇区中心角 = `selectedIndex * sectorAngle + sectorAngle / 2`，最终偏差不超过 ±5°
  - `prizes` prop 变化时重置 `winnerIndex` 为 `null`（使用 `useEffect` 监听 `prizes`）
  - 旋转结束后恢复抽奖按钮为可点击状态
  - _Requirements: 7.1, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [x]* 8.1 为 `SpinWheel` 编写属性测试
    - 新建 `__tests__/SpinWheel.test.tsx`
    - **Property 12: SpinWheel 渲染的扇面数量等于 prizes 数组长度**
      - `fc.array(fc.record({id: fc.nat(), name: fc.string({minLength:1})}), {minLength:1, maxLength:8})` → 验证 SVG `<path>` 数量等于 `prizes.length`，且每个 prize 的 `name` 出现在渲染输出中
      - **Validates: Requirements 7.1**
    - **Property 13: 旋转角度计算使指针精准落在目标扇区中心 ±5° 内**
      - `fc.nat({max: 3})` → 对四等分转盘，验证 `(targetRotation % 360)` 使指针偏差不超过 ±5°
      - **Validates: Requirements 7.4**
    - **Property 14: prizes 更新时 winnerIndex 重置为 null**
      - `fc.array(fc.record({id: fc.nat(), name: fc.string({minLength:1})}), {minLength:1, maxLength:8})` → 传入新 prizes prop，验证 `winnerIndex` 状态为 null，获奖结果文本不可见
      - **Validates: Requirements 7.6**
    - _Requirements: 7.1, 7.4, 7.6_

- [x] 9. 升级 `LeadForm.tsx` 接入 ThemeTokens 并修复手机号验证
  - 新增 prop：`themeTokens: ThemeTokens`
  - 将提交按钮背景渐变从硬编码 `linear-gradient(135deg, #00D4AA, #00A882)` 替换为 `themeTokens.buttonGradient`
  - 将表单容器顶部边框颜色从硬编码 `#00D4AA` 替换为 `themeTokens.primary`
  - 将输入框 focus ring 颜色从硬编码 `#00D4AA` 替换为 `themeTokens.primary`
  - 手机号验证逻辑升级：将空值检查替换为正则 `/^1\d{10}$/.test(phone)`，非空但格式不符时显示"请输入有效的手机号码"
  - 成功提交后的确认卡片中，将姓名 `name` 展示在确认信息中（"预约成功！{name} 的品鉴名额已锁定"）
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

  - [x]* 9.1 为 `LeadForm` 编写属性测试
    - 新建 `__tests__/LeadForm.test.tsx`
    - **Property 15: 不符合格式的手机号被拒绝并显示正确错误信息**
      - `fc.string().filter(s => !/^1\d{10}$/.test(s) && s.length > 0)` → 验证 `onSubmitSuccess` 未被调用，错误文本"请输入有效的手机号码"可见
      - **Validates: Requirements 8.4**
    - _Requirements: 8.4_

- [x] 10. 升级 `DemoLayout.tsx` 管理多车型状态与 ThemeTokens 派生
  - 新增状态：`selectedCarModel: CarModelId`（初始值 `'gx'`）
  - 派生值：`const themeTokens = getThemeTokens(config.theme)`（每次渲染时从 `config.theme` 计算，无需额外 state）
  - 实现 `handleModelChange(id: CarModelId)` 函数：更新 `selectedCarModel` 状态
  - 更新 `handleGenerate` 签名为 `(userInput: string, carModel: CarModelId)`，在 POST body 中加入 `carModel` 字段
  - 客户端 30 秒超时：使用 `AbortController` + `Promise.race([fetchPromise, timeoutPromise])` 实现，超时时显示"请求超时，请重试"
  - 将 `selectedCarModel` 和 `onModelChange` 传递给 `<Workbench>`
  - 将 `themeTokens` 传递给 `<PhonePreview>`
  - 生成成功后重置 `isFormSubmitted` 为 `false`（新车型生成后表单状态应重置）
  - _Requirements: 1.4, 3.1, 3.2, 3.3, 3.4, 5.3, 5.4_

  - [x]* 10.1 为 `DemoLayout` 编写属性测试
    - 新建 `__tests__/DemoLayout.test.tsx`
    - **Property 6: POST 请求体同时包含 userInput 和 carModel 且值正确**
      - `fc.string({minLength:1})` + `fc.constantFrom(...CAR_MODEL_IDS)` → mock `fetch`，验证请求体 JSON 包含正确的 `userInput` 和 `carModel` 字段
      - **Validates: Requirements 3.1**
    - **Property 7: API 错误或超时后 GenerateButton 恢复可点击且错误信息可见**
      - `fc.constantFrom(400, 500, 502)` → mock `fetch` 返回对应状态码，验证 `isGenerating` 变为 false，错误文本在 DOM 中可见
      - **Validates: Requirements 3.4**
    - _Requirements: 3.1, 3.4_

- [x] 11. 安装测试依赖并配置测试环境
  - 执行 `npm install --save-dev fast-check jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom ts-jest`
  - 新建 `jest.config.ts`，配置两个 project：`jsdom`（组件测试）和 `node`（API 路由测试）
  - 新建 `jest.setup.ts`，导入 `@testing-library/jest-dom`
  - 确认 `tsconfig.json` 的 `include` 覆盖 `__tests__/` 目录
  - _Requirements: （测试基础设施，覆盖所有需求）_

- [x] 12. Checkpoint — 完整功能验证
  - 确认所有已编写的属性测试通过（`npx jest --run` 或 `npx jest --passWithNoTests`）
  - 确认 `npm run build` 无 TypeScript 编译错误
  - 手动验证五款车型完整交互流程：
    1. 页面加载 → ModelSelector 默认选中"小鹏 GX"，textarea 显示 GX 默认示例文本
    2. 切换到"小鹏 X9" → placeholder 更新，已输入内容不清空，ModelSelector 高亮切换
    3. 输入活动描述 → 点击"一键生成" → StepsUI 步骤文本包含"小鹏 X9"和"明日星舰超智驾大七座MPV"
    4. API 返回后 → 右侧手机预览 fade-in 刷新，配色切换为 cyber_future 蓝紫主题
    5. 切换到"小鹏 G6" → 生成后预览切换为 pop_active 活力橙主题
    6. 填写姓名和有效手机号 → 提交 → 彩带 + MockSubmit 弹窗 → 关闭后转盘可抽奖
    7. 输入无效手机号（如"12345"）→ 显示"请输入有效的手机号码"
  - 如有问题，请向用户说明并等待指示

---

## Notes

- 标有 `*` 的子任务为可选测试任务，可跳过以加快 MVP 交付
- `CAR_MODEL_MAP` 是前后端唯一数据源，前端 `ModelSelector` 和后端 `route.ts` 均从 `app/config.ts` 导入，消除前后端漂移风险
- `ThemeTokens` 通过 inline styles 传递（而非动态 Tailwind 类名），避免 JIT purge 问题
- 所有交互组件必须包含 `'use client'` 指令（Next.js App Router 要求）
- `getThemeTokens` 是纯函数，对无效 theme 静默回退到 `luxury_ai`，不抛出异常
- 客户端 30 秒超时通过 `AbortController` + `Promise.race` 实现，与 `AbortSignal.timeout(30000)` 服务端超时双重保障
- `isFormSubmitted` 在每次新生成成功后重置为 `false`，确保新车型预览下表单状态干净
- 旋转时长每次随机 3000ms–8000ms，CSS `transition-duration` 需与 `setTimeout` 延迟保持一致
- 手机号验证正则 `/^1\d{10}$/` 匹配首位为 1 的 11 位数字

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["1.1", "2", "11"] },
    { "id": 2, "tasks": ["2.1", "3"] },
    { "id": 3, "tasks": ["3.1", "4", "5"] },
    { "id": 4, "tasks": ["4.1", "5.1"] },
    { "id": 5, "tasks": ["7", "8", "9", "10"] },
    { "id": 6, "tasks": ["7.1", "8.1", "9.1", "10.1"] },
    { "id": 7, "tasks": ["6"] },
    { "id": 8, "tasks": ["12"] }
  ]
}
```
