/**
 * app/lib/atomicLayout.ts
 *
 * Pure TypeScript module — zero React imports.
 * Safe to import from both the API route (server) and client components.
 */

// ─── Registry ─────────────────────────────────────────────────────────────────

/** Single source of truth for all valid atomic component IDs. */
export const ATOMIC_COMPONENT_IDS = [
  'brand_header',
  'car_stage',
  'campaign_info',
  'selling_points',
  'lucky_wheel',
  'lead_form',
] as const;

/** Union type derived from the registry. */
export type ComponentId = (typeof ATOMIC_COMPONENT_IDS)[number];

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ComponentSettings {
  scale?: 'large' | 'small';
  highlight?: boolean;
  displayType?: 'grid' | 'list';
  isBackground?: boolean;
}

export interface LayoutMatrix {
  componentOrder: ComponentId[];
  componentSettings?: Partial<Record<ComponentId, ComponentSettings>>;
}

// ─── Type guard ───────────────────────────────────────────────────────────────

/** Returns true if and only if `s` is one of the six valid ComponentId values. */
export function isComponentId(s: string): s is ComponentId {
  return (ATOMIC_COMPONENT_IDS as readonly string[]).includes(s);
}

// ─── Default order ────────────────────────────────────────────────────────────

export const DEFAULT_ORDER: ComponentId[] = [
  'brand_header',
  'car_stage',
  'campaign_info',
  'selling_points',
  'lucky_wheel',
  'lead_form',
];

// ─── Normalization ────────────────────────────────────────────────────────────

/**
 * Pure normalization function — same input always produces same output.
 *
 * Algorithm (5 steps):
 * 1. Guard   — if raw is not an object or componentOrder is not a non-empty array,
 *              return { componentOrder: [...DEFAULT_ORDER] }
 * 2. Filter  — keep only entries where isComponentId(entry) is true
 * 3. Dedupe  — walk left-to-right, keep only first occurrence of each ComponentId
 * 4. Complete — append any ComponentId from DEFAULT_ORDER not yet in result
 * 5. Settings — preserve raw.componentSettings if it is a plain object; otherwise omit
 */
export function normalizeLayoutMatrix(raw: unknown): LayoutMatrix {
  // Step 1 — Guard
  if (
    raw === null ||
    typeof raw !== 'object' ||
    !Array.isArray((raw as Record<string, unknown>).componentOrder) ||
    ((raw as Record<string, unknown>).componentOrder as unknown[]).length === 0
  ) {
    return { componentOrder: [...DEFAULT_ORDER] };
  }

  const rawObj = raw as Record<string, unknown>;
  const rawOrder = rawObj.componentOrder as unknown[];

  // Step 2 — Filter: keep only valid ComponentId strings
  const filtered = rawOrder.filter(
    (entry): entry is ComponentId =>
      typeof entry === 'string' && isComponentId(entry),
  );

  // Step 3 — Deduplicate: first occurrence wins
  const seen = new Set<ComponentId>();
  const deduped: ComponentId[] = [];
  for (const id of filtered) {
    if (!seen.has(id)) {
      seen.add(id);
      deduped.push(id);
    }
  }

  // Step 4 — Complete: append missing IDs in DEFAULT_ORDER sequence
  for (const id of DEFAULT_ORDER) {
    if (!seen.has(id)) {
      deduped.push(id);
    }
  }

  // Step 5 — Settings: preserve if plain object, otherwise omit
  const rawSettings = rawObj.componentSettings;
  const componentSettings =
    rawSettings !== null &&
    typeof rawSettings === 'object' &&
    !Array.isArray(rawSettings)
      ? (rawSettings as Partial<Record<ComponentId, ComponentSettings>>)
      : undefined;

  return {
    componentOrder: deduped,
    ...(componentSettings !== undefined ? { componentSettings } : {}),
  };
}
