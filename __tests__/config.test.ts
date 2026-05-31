/**
 * Property-based tests for app/config.ts
 * Feature: xpeng-ai-marketing-demo
 */

import * as fc from "fast-check";
import {
  getThemeTokens,
  THEME_MAP,
  CAR_MODEL_MAP,
  THEME_IDS,
  CAR_MODEL_IDS,
  type Theme,
  type CarModelId,
} from "../app/config";

// ─── Property 9: ThemeEngine applies correct tokens for any valid theme ───────
// Feature: xpeng-ai-marketing-demo, Property 9: ThemeEngine 对任意有效 theme 返回正确 token
// Validates: Requirements 5.1, 5.2
describe("Property 9: getThemeTokens returns correct tokens for any valid theme", () => {
  it("primary, secondary, bg, buttonGradient, sectorColors match predefined palette", () => {
    fc.assert(
      fc.property(fc.constantFrom(...THEME_IDS), (theme: Theme) => {
        const tokens = getThemeTokens(theme);
        const expected = THEME_MAP[theme];

        expect(tokens.primary).toBe(expected.primary);
        expect(tokens.secondary).toBe(expected.secondary);
        expect(tokens.bg).toBe(expected.bg);
        expect(tokens.buttonGradient).toBe(expected.buttonGradient);
        expect(tokens.sectorColors).toEqual(expected.sectorColors);
      }),
      { numRuns: 100 }
    );
  });
});

// ─── Property 10: Invalid theme falls back to luxury_ai ──────────────────────
// Feature: xpeng-ai-marketing-demo, Property 10: 无效 theme 回退到 luxury_ai
// Validates: Requirements 5.5
describe("Property 10: getThemeTokens falls back to luxury_ai for any invalid theme", () => {
  it("returns luxury_ai tokens for any string not in the valid theme enum", () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !(THEME_IDS as string[]).includes(s)),
        (invalidTheme: string) => {
          const tokens = getThemeTokens(invalidTheme);
          const luxuryAi = THEME_MAP["luxury_ai"];

          expect(tokens).toEqual(luxuryAi);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 19: carModel→theme mapping is immutable ────────────────────────
// Feature: xpeng-ai-marketing-demo, Property 19: carModel→theme 映射不可变
// Validates: Requirements 10.1
describe("Property 19: CAR_MODEL_MAP[id].theme always returns the predefined theme value", () => {
  it("each car model ID maps to its predefined theme regardless of runtime state", () => {
    const expectedThemes: Record<CarModelId, Theme> = {
      gx: "luxury_ai",
      x9: "cyber_future",
      g6: "pop_active",
      p7i: "sport_tech",
      m03: "youth_trend",
    };

    fc.assert(
      fc.property(fc.constantFrom(...CAR_MODEL_IDS), (id: CarModelId) => {
        const theme = CAR_MODEL_MAP[id].theme;

        // Theme must be one of the valid theme IDs
        expect((THEME_IDS as string[]).includes(theme)).toBe(true);

        // Theme must match the predefined mapping
        expect(theme).toBe(expectedThemes[id]);
      }),
      { numRuns: 100 }
    );
  });
});
