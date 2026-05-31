/**
 * app/lib/tagDerivation.ts
 *
 * Pure TypeScript module — zero React imports.
 * Safe to import from both client components and API routes.
 */

import type { LayoutMatrix } from './atomicLayout';

// ─── Tag constants ────────────────────────────────────────────────────────────

export const TAG_SPIN_WHEEL    = '🎯 大转盘视觉 C 位';
export const TAG_CAR_BG        = '🚗 车身退为科技背景';
export const TAG_MAGAZINE_FLOW = '📖 触发横滑杂志画册流';
export const TAG_LUXURY_GREEN  = '💎 注入新豪华绿金调';
export const TAG_VIRAL_COLOR   = '🔥 开启高频裂变色系';
export const TAG_FELLOW_TONE   = '☕ 匹配接地气 Fellow 话术';

export const ALL_TAGS = [
  TAG_SPIN_WHEEL,
  TAG_CAR_BG,
  TAG_MAGAZINE_FLOW,
  TAG_LUXURY_GREEN,
  TAG_VIRAL_COLOR,
  TAG_FELLOW_TONE,
] as const;

export type DecisionTag = (typeof ALL_TAGS)[number];

// ─── Tag metadata (for rendering) ────────────────────────────────────────────

export interface DecisionTagMeta {
  id: DecisionTag;
  label: string;
  category: 'layout' | 'style';
  activeClass: string;
}

export const DECISION_TAG_META: DecisionTagMeta[] = [
  { id: TAG_SPIN_WHEEL,    label: TAG_SPIN_WHEEL,    category: 'layout', activeClass: 'bg-indigo-500 text-white' },
  { id: TAG_CAR_BG,        label: TAG_CAR_BG,        category: 'layout', activeClass: 'bg-indigo-500 text-white' },
  { id: TAG_MAGAZINE_FLOW, label: TAG_MAGAZINE_FLOW, category: 'layout', activeClass: 'bg-indigo-500 text-white' },
  { id: TAG_LUXURY_GREEN,  label: TAG_LUXURY_GREEN,  category: 'style',  activeClass: 'bg-emerald-500 text-white' },
  { id: TAG_VIRAL_COLOR,   label: TAG_VIRAL_COLOR,   category: 'style',  activeClass: 'bg-amber-500 text-white' },
  { id: TAG_FELLOW_TONE,   label: TAG_FELLOW_TONE,   category: 'style',  activeClass: 'bg-emerald-500 text-white' },
];

// ─── Core derivation function ─────────────────────────────────────────────────

/**
 * Pure function. Derives the set of active decision tags from a LayoutMatrix
 * and a theme string. Returns an empty Set for null/undefined input.
 * Never throws.
 */
export function deriveActiveTags(
  layoutMatrix: LayoutMatrix | null | undefined,
  theme: string | null | undefined,
): Set<string> {
  const active = new Set<string>();
  if (layoutMatrix == null) return active;

  const { componentOrder, componentSettings } = layoutMatrix;
  const settings = componentSettings ?? {};

  // 🎯 大转盘视觉 C 位 — lucky_wheel is first OR explicitly scaled large
  if (componentOrder[0] === 'lucky_wheel' || settings.lucky_wheel?.scale === 'large') {
    active.add(TAG_SPIN_WHEEL);
  }

  // 🚗 车身退为科技背景 — car_stage set as background layer
  if (settings.car_stage?.isBackground === true) {
    active.add(TAG_CAR_BG);
  }

  // 📖 触发横滑杂志画册流 — selling_points in grid layout
  if (settings.selling_points?.displayType === 'grid') {
    active.add(TAG_MAGAZINE_FLOW);
  }

  // 💎 注入新豪华绿金调 — luxury_ai theme
  if (theme === 'luxury_ai') {
    active.add(TAG_LUXURY_GREEN);
  }

  // 🔥 开启高频裂变色系 — pop_active or sport_tech theme
  if (theme === 'pop_active' || theme === 'sport_tech') {
    active.add(TAG_VIRAL_COLOR);
  }

  // ☕ 匹配接地气 Fellow 话术 — campaign_info explicitly highlighted
  if (settings.campaign_info != null && settings.campaign_info.highlight === true) {
    active.add(TAG_FELLOW_TONE);
  }

  return active;
}
