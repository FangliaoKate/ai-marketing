/**
 * app/lib/layoutMatrixSchema.ts
 *
 * JSON Schema (draft-07) for the layoutMatrix field returned by the AI.
 * Used by the API route to validate AI output before normalizing.
 *
 * Zero React imports — safe to import from server-side route handlers.
 */

export const LAYOUT_MATRIX_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'LayoutMatrix',
  type: 'object',
  required: ['componentOrder'],
  additionalProperties: false,
  properties: {
    componentOrder: {
      type: 'array',
      description: '六个原子组件 ID 的排列顺序，决定手机预览页从上到下的渲染顺序',
      minItems: 6,
      maxItems: 6,
      uniqueItems: true,
      items: {
        type: 'string',
        enum: [
          'brand_header',
          'car_stage',
          'campaign_info',
          'selling_points',
          'lucky_wheel',
          'lead_form',
        ],
      },
    },
    componentSettings: {
      type: 'object',
      description: '每个组件的视觉权重配置，键为组件 ID，值为 ComponentSettings 对象',
      additionalProperties: false,
      properties: {
        brand_header:   { $ref: '#/$defs/ComponentSettings' },
        car_stage:      { $ref: '#/$defs/ComponentSettings' },
        campaign_info:  { $ref: '#/$defs/ComponentSettings' },
        selling_points: { $ref: '#/$defs/ComponentSettings' },
        lucky_wheel:    { $ref: '#/$defs/ComponentSettings' },
        lead_form:      { $ref: '#/$defs/ComponentSettings' },
      },
    },
  },
  $defs: {
    ComponentSettings: {
      type: 'object',
      additionalProperties: false,
      properties: {
        scale: {
          type: 'string',
          enum: ['large', 'small'],
          description: '"large" 放大突出 | "small" 缩小弱化',
        },
        highlight: {
          type: 'boolean',
          description: 'true → opacity 1.0 高亮 | false → 正常',
        },
        isBackground: {
          type: 'boolean',
          description: 'true → opacity 0.35，作为背景纹理层',
        },
        displayType: {
          type: 'string',
          enum: ['grid', 'list'],
          description: '"grid" 两列网格 | "list" 单列列表（仅 selling_points 有效）',
        },
      },
    },
  },
} as const;

/**
 * Compact JSON Schema string for injection into the LLM system prompt.
 * Strips $schema / $defs / description noise to save tokens.
 */
export const LAYOUT_MATRIX_SCHEMA_FOR_PROMPT = JSON.stringify(
  {
    type: 'object',
    required: ['componentOrder'],
    properties: {
      componentOrder: {
        type: 'array',
        minItems: 6,
        maxItems: 6,
        uniqueItems: true,
        items: {
          type: 'string',
          enum: [
            'brand_header',
            'car_stage',
            'campaign_info',
            'selling_points',
            'lucky_wheel',
            'lead_form',
          ],
        },
      },
      componentSettings: {
        type: 'object',
        properties: {
          brand_header:   { $ref: '#/$defs/ComponentSettings' },
          car_stage:      { $ref: '#/$defs/ComponentSettings' },
          campaign_info:  { $ref: '#/$defs/ComponentSettings' },
          selling_points: { $ref: '#/$defs/ComponentSettings' },
          lucky_wheel:    { $ref: '#/$defs/ComponentSettings' },
          lead_form:      { $ref: '#/$defs/ComponentSettings' },
        },
        $defs: {
          ComponentSettings: {
            type: 'object',
            properties: {
              scale:       { type: 'string', enum: ['large', 'small'] },
              highlight:   { type: 'boolean' },
              isBackground:{ type: 'boolean' },
              displayType: { type: 'string', enum: ['grid', 'list'] },
            },
          },
        },
      },
    },
  },
  null,
  2,
);
