import Ajv from 'ajv';
import type { DemoConfig } from '@/app/config';
import { CAR_MODEL_MAP, CAR_MODEL_IDS } from '../../config';
import type { CarModelId } from '../../config';
import { normalizeLayoutMatrix } from '@/app/lib/atomicLayout';
import { LAYOUT_MATRIX_SCHEMA, LAYOUT_MATRIX_SCHEMA_FOR_PROMPT } from '@/app/lib/layoutMatrixSchema';

// Compile the validator once at module load time (not per-request)
const ajv = new Ajv({ allErrors: true });
const validateLayoutMatrix = ajv.compile(LAYOUT_MATRIX_SCHEMA);

export const maxDuration = 30;

// ─── First-turn system prompt ─────────────────────────────────────────────────

function buildSystemPrompt(carModel: CarModelId): string {
  const meta = CAR_MODEL_MAP[carModel];
  const sellingPointsList = meta.sellingPoints.join('、');

  return `你是小鹏汽车官方活动文案生成助手。
当前车型：${meta.displayName}，官方标签：${meta.tag}。
核心卖点关键词：${sellingPointsList}。
视觉主题：${meta.theme}。

你必须输出一个纯 JSON 字符串，不得包含任何 Markdown 代码块（不得有 \`\`\`json 或 \`\`\` 包裹）。
JSON 必须包含以下字段：theme, carModel, tag, title, subtitle, sellingPoints, prizes。
prizes 数组必须恰好包含 4 个对象（格式：{"id": number, "name": string}）。
sellingPoints 数组必须恰好包含 3 个字符串。
carModel 字段必须固定为"${meta.displayName}"，theme 字段必须固定为"${meta.theme}"。
请根据用户输入的活动主题，生成符合 ${meta.displayName} 品牌调性的活动文案，充分体现以下卖点：${sellingPointsList}。

你还必须在 JSON 中输出一个 layoutMatrix 字段，用于控制手机预览页的组件排列顺序和视觉权重。
这是你展示创意的核心字段——不同车型、不同活动主题，布局应该有明显差异。

layoutMatrix 必须严格符合以下 JSON Schema（输出会被自动验证，不合规将被拒绝）：
${LAYOUT_MATRIX_SCHEMA_FOR_PROMPT}

组件说明：
- "brand_header"   品牌标识栏
- "car_stage"      车型展示舞台（光晕+车名）
- "campaign_info"  活动标题与副标题
- "selling_points" 卖点卡片列表
- "lucky_wheel"    幸运大转盘
- "lead_form"      留资表单

布局决策指导原则：
- 科技感/性能主题：car_stage 靠前，selling_points 用 grid，lucky_wheel 用 large
- 家庭/舒适主题：campaign_info 靠前，selling_points 用 list，lead_form 靠近顶部
- 限时促销主题：lucky_wheel 靠前且 highlight:true，lead_form 紧随其后
- 品牌发布主题：brand_header 靠前，car_stage 用 isBackground:true 作背景层

示例（仅供格式参考，实际顺序和配置必须由你根据活动主题自主决定）：
{
  "layoutMatrix": {
    "componentOrder": ["brand_header", "car_stage", "campaign_info", "selling_points", "lucky_wheel", "lead_form"],
    "componentSettings": {
      "car_stage": { "scale": "large", "highlight": true },
      "selling_points": { "displayType": "grid" },
      "lucky_wheel": { "scale": "small" }
    }
  }
}`;
}

// ─── Multi-turn system prompt ─────────────────────────────────────────────────

function buildMultiTurnSystemPrompt(carModel: CarModelId): string {
  const base = buildSystemPrompt(carModel);
  return `${base}

【重要：多轮增量修改规范】
你现在扮演一个"UI 重构架构师"，接收到的是一次追问微调请求。
1. 不要完全推翻上一版数据（previousJson），保留销售已满意的核心营销文案（title、subtitle、sellingPoints、prizes）。
2. 深度解析用户的新追问（currentInput），仅针对用户明确提出的部分进行修改。
3. 如果用户要求调整布局（如"把转盘放底部"），重组 layoutMatrix.componentOrder 并更新 componentSettings。
4. 如果用户要求调整风格或语气，同步修正相关文案字段。
5. 严格返回修改后的完整纯 JSON 对象，不得包含任何 Markdown 代码块。`;
}

// ─── Multi-turn user message builder ─────────────────────────────────────────

function buildMultiTurnUserMessage(previousJson: DemoConfig, currentInput: string): string {
  return `上一版布局数据：${JSON.stringify(previousJson)}\n\n新追问：${currentInput}`;
}

// ─── Shared: call DeepSeek and return raw AI content ─────────────────────────

async function callDeepSeek(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
): Promise<string> {
  const deepseekResponse = await fetch(
    'https://api.deepseek.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      }),
      signal: AbortSignal.timeout(30000),
    }
  );

  if (!deepseekResponse.ok) {
    const errText = await deepseekResponse.text();
    throw new Error(`AI service unavailable: ${errText}`);
  }

  const deepseekData = await deepseekResponse.json();
  return deepseekData?.choices?.[0]?.message?.content ?? '';
}

// ─── Shared: parse + validate + normalize AI response ────────────────────────

function parseAndNormalize(aiContent: string): Response | DemoConfig {
  let parsed: DemoConfig;
  try {
    parsed = JSON.parse(aiContent);
  } catch {
    return Response.json({ error: 'Invalid JSON from AI' }, { status: 500 });
  }

  if (parsed?.layoutMatrix !== undefined) {
    const valid = validateLayoutMatrix(parsed.layoutMatrix);
    if (!valid) {
      const errors = validateLayoutMatrix.errors
        ?.map((e) => `${e.instancePath || '/'} ${e.message}`)
        .join('; ');
      console.warn('[generate] layoutMatrix schema validation failed:', errors);
    }
  }

  const normalized = normalizeLayoutMatrix(parsed?.layoutMatrix);
  return { ...parsed, layoutMatrix: normalized } as DemoConfig;
}

// ─── Required fields for previousJson validation ──────────────────────────────

const REQUIRED_PREVIOUS_JSON_FIELDS = [
  'theme', 'carModel', 'layoutMatrix', 'title', 'subtitle', 'sellingPoints', 'prizes',
] as const;

function validatePreviousJson(obj: unknown): obj is DemoConfig {
  if (obj === null || typeof obj !== 'object') return false;
  const record = obj as Record<string, unknown>;
  return REQUIRED_PREVIOUS_JSON_FIELDS.every((field) => field in record && record[field] !== undefined);
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // 1. Parse request body
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // 2. Check API key early (shared by both paths)
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'API key not configured' }, { status: 500 });
  }

  // ── Multi-turn branch ──────────────────────────────────────────────────────
  if (body?.isMultiTurn === true) {
    // 3a. Validate currentInput
    const currentInputRaw = body?.currentInput;
    if (typeof currentInputRaw !== 'string' || currentInputRaw.trim().length === 0 || currentInputRaw.trim().length > 500) {
      return Response.json(
        { error: 'currentInput is required and must be 1–500 characters' },
        { status: 400 }
      );
    }
    const currentInput = currentInputRaw.trim();

    // 3b. Validate previousJson
    const previousJsonRaw = body?.previousJson;
    if (!validatePreviousJson(previousJsonRaw)) {
      return Response.json(
        { error: 'previousJson is missing required fields' },
        { status: 400 }
      );
    }
    const previousJson = previousJsonRaw as DemoConfig;

    // 3c. Resolve carModel: try previousJson.carModel first, fall back to body.carModel
    const carModelCandidate =
      (CAR_MODEL_IDS as string[]).includes(previousJson.carModel as string)
        ? (previousJson.carModel as CarModelId)
        : (CAR_MODEL_IDS as string[]).includes(body?.carModel as string)
          ? (body.carModel as CarModelId)
          : null;

    if (!carModelCandidate) {
      return Response.json({ error: 'Invalid carModel' }, { status: 400 });
    }

    // 3d. Build multi-turn prompt + user message
    let userMessage: string;
    try {
      userMessage = buildMultiTurnUserMessage(previousJson, currentInput);
    } catch {
      return Response.json({ error: 'Failed to construct multi-turn prompt' }, { status: 500 });
    }

    const systemPrompt = buildMultiTurnSystemPrompt(carModelCandidate);

    // 3e. Call DeepSeek
    let aiContent: string;
    try {
      aiContent = await callDeepSeek(apiKey, systemPrompt, userMessage);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'TimeoutError') {
        return Response.json({ error: 'AI service timeout' }, { status: 502 });
      }
      if (err instanceof Error && err.name === 'AbortError') {
        return Response.json({ error: 'AI service timeout' }, { status: 502 });
      }
      const message = err instanceof Error ? err.message : String(err);
      return Response.json({ error: message }, { status: 502 });
    }

    // 3f. Parse, validate, normalize
    const result = parseAndNormalize(aiContent);
    if (result instanceof Response) return result;
    return Response.json(result, { status: 200 });
  }

  // ── First-turn branch (existing logic, unchanged) ──────────────────────────

  // 4. Validate userInput
  const userInput: string = (body?.userInput as string) ?? '';
  if (!userInput || !userInput.trim()) {
    return Response.json({ error: 'userInput is required' }, { status: 400 });
  }

  // 5. Validate carModel presence
  const carModelRaw: unknown = body?.carModel;
  if (carModelRaw === undefined || carModelRaw === null || carModelRaw === '') {
    return Response.json({ error: 'carModel is required' }, { status: 400 });
  }

  // 6. Validate carModel is a string and within max length
  if (typeof carModelRaw !== 'string' || carModelRaw.length > 100) {
    return Response.json({ error: 'Invalid carModel' }, { status: 400 });
  }

  // 7. Validate carModel is in the allowed enum
  if (!(CAR_MODEL_IDS as string[]).includes(carModelRaw)) {
    return Response.json({ error: 'Invalid carModel' }, { status: 400 });
  }

  const carModel = carModelRaw as CarModelId;

  // 8. Build system prompt
  const systemPrompt = buildSystemPrompt(carModel);

  // 9. Call DeepSeek
  let aiContent: string;
  try {
    aiContent = await callDeepSeek(apiKey, systemPrompt, userInput);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      return Response.json({ error: 'AI service timeout' }, { status: 502 });
    }
    if (err instanceof Error && err.name === 'AbortError') {
      return Response.json({ error: 'AI service timeout' }, { status: 502 });
    }
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: `AI service unavailable: ${message}` }, { status: 502 });
  }

  // 10. Parse, validate, normalize
  const result = parseAndNormalize(aiContent);
  if (result instanceof Response) return result;
  return Response.json(result, { status: 200 });
}
