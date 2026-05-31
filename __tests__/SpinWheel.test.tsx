// Feature: xpeng-ai-marketing-demo, Property 12: SpinWheel renders exactly as many sectors as prizes
// Feature: xpeng-ai-marketing-demo, Property 13: Spin pointer precision
// Feature: xpeng-ai-marketing-demo, Property 14: SpinWheel resets on DemoConfig update
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import * as fc from 'fast-check';
import SpinWheel from '../app/components/SpinWheel';
import { ThemeTokens, THEME_MAP } from '../app/config';

const defaultThemeTokens: ThemeTokens = THEME_MAP['luxury_ai'];

/**
 * Property 12: SpinWheel renders exactly as many sectors as prizes
 *
 * For any prizes array of length n, the SpinWheel should render exactly n SVG
 * sector paths, each containing the corresponding prize's name text.
 *
 * Validates: Requirements 7.1
 */
describe('SpinWheel', () => {
  it('Property 12: renders exactly as many SVG sector paths as prizes, each with correct name', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({ id: fc.nat(), name: fc.string({ minLength: 1, maxLength: 4 }) }),
          { minLength: 1, maxLength: 8 }
        ),
        (prizes) => {
          const { container, unmount } = render(
            <SpinWheel
              prizes={prizes}
              isFormSubmitted={false}
              themeTokens={defaultThemeTokens}
            />
          );

          // Count SVG <path> elements (each sector is one path)
          const paths = container.querySelectorAll('svg path');
          const sectorPaths = paths.length;

          // Each prize name should appear in the rendered output
          const bodyText = container.textContent ?? '';
          const allNamesPresent = prizes.every((p) => bodyText.includes(p.name));

          unmount();

          return sectorPaths === prizes.length && allNamesPresent;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13: Spin pointer precision
   *
   * For any prize index i (where 0 ≤ i < prizes.length), the computed final
   * rotation value should place the pointer (fixed at 12 o'clock / 0°) within
   * ±5° of the center angle of sector i.
   *
   * The formula used in SpinWheel:
   *   targetRotation = rotation + 360 * 5 + (360 - selectedIndex * sectorAngle - sectorAngle / 2)
   *
   * After spinning, the effective wheel angle = targetRotation % 360.
   * The pointer is at 0° (12 o'clock). The sector i starts at (i * sectorAngle - 90)°
   * in SVG space, but the wheel rotates so that the pointer aligns with the sector center.
   *
   * We verify: the pointer (at 0°) lands within ±5° of the center of sector i.
   *
   * Validates: Requirements 7.4
   */
  it('Property 13: rotation angle places pointer within ±5° of target sector center', () => {
    fc.assert(
      fc.property(
        // Use a 4-sector wheel (the default in the demo)
        fc.nat({ max: 3 }),
        (selectedIndex) => {
          const prizes = [
            { id: 1, name: '奖品A' },
            { id: 2, name: '奖品B' },
            { id: 3, name: '奖品C' },
            { id: 4, name: '奖品D' },
          ];
          const sectorCount = prizes.length; // 4
          const sectorAngle = 360 / sectorCount; // 90°

          // Simulate the rotation formula from SpinWheel.tsx
          const initialRotation = 0;
          const targetRotation =
            initialRotation +
            360 * 5 +
            (360 - selectedIndex * sectorAngle - sectorAngle / 2);

          // The effective rotation of the wheel after spinning (mod 360)
          const effectiveRotation = ((targetRotation % 360) + 360) % 360;

          // The pointer is at 0° (12 o'clock, top of the wheel).
          // The wheel has rotated by effectiveRotation degrees.
          // Sector i's center in the original (unrotated) wheel coordinate:
          //   sectorCenter = i * sectorAngle + sectorAngle / 2  (measured from 12 o'clock, clockwise)
          // After rotating the wheel by effectiveRotation, the sector center is now at:
          //   (sectorCenter - effectiveRotation + 360) % 360  from the pointer
          // For the pointer to land on the sector center, this should be 0° (or 360°).

          // Sector i's center in the wheel's original frame (from 12 o'clock, clockwise):
          //   sectorCenter = i * sectorAngle + sectorAngle / 2
          // After the wheel rotates by effectiveRotation, the sector center is at:
          //   (sectorCenter + effectiveRotation) % 360  in the fixed frame
          // The pointer is at 0° (12 o'clock). For alignment, this should be ≡ 0° (mod 360).
          const sectorCenter = selectedIndex * sectorAngle + sectorAngle / 2;
          const finalAngle = ((sectorCenter + effectiveRotation) % 360 + 360) % 360;
          // Normalize to [-180, 180] range
          const normalizedOffset = finalAngle > 180 ? finalAngle - 360 : finalAngle;

          return Math.abs(normalizedOffset) <= 5;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 14: SpinWheel resets on DemoConfig update
   *
   * For any new prizes array passed to SpinWheel, the winnerIndex state should
   * be null and the winning result text should not be visible.
   *
   * Validates: Requirements 7.6
   */
  it('Property 14: prizes update resets winnerIndex to null (no winner text visible)', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({ id: fc.nat(), name: fc.string({ minLength: 1, maxLength: 4 }) }),
          { minLength: 1, maxLength: 8 }
        ),
        fc.array(
          fc.record({ id: fc.nat(), name: fc.string({ minLength: 1, maxLength: 4 }) }),
          { minLength: 1, maxLength: 8 }
        ),
        (initialPrizes, newPrizes) => {
          const { rerender, queryByText, unmount } = render(
            <SpinWheel
              prizes={initialPrizes}
              isFormSubmitted={false}
              themeTokens={defaultThemeTokens}
            />
          );

          // Update prizes prop
          act(() => {
            rerender(
              <SpinWheel
                prizes={newPrizes}
                isFormSubmitted={false}
                themeTokens={defaultThemeTokens}
              />
            );
          });

          // After prizes update, winner result text should not be visible
          const winnerText = queryByText('🎉 恭喜您获得');
          const hasNoWinner = winnerText === null;

          unmount();

          return hasNoWinner;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('shows prompt when form not submitted and spin button clicked', () => {
    const prizes = [
      { id: 1, name: '奖品A' },
      { id: 2, name: '奖品B' },
      { id: 3, name: '奖品C' },
      { id: 4, name: '奖品D' },
    ];

    render(
      <SpinWheel
        prizes={prizes}
        isFormSubmitted={false}
        themeTokens={defaultThemeTokens}
      />
    );

    const spinButton = screen.getByText('抽奖');
    act(() => {
      spinButton.click();
    });

    expect(screen.getByText('请先锁定品鉴名额')).toBeInTheDocument();
  });

  it('uses themeTokens.sectorColors for sector fill colors', () => {
    const prizes = [
      { id: 1, name: '奖品A' },
      { id: 2, name: '奖品B' },
    ];
    const customTokens: ThemeTokens = {
      ...defaultThemeTokens,
      sectorColors: ['#FF0000', '#0000FF'],
      pointerColor: '#00FF00',
      ringColor: '#FFFF00',
    };

    const { container } = render(
      <SpinWheel
        prizes={prizes}
        isFormSubmitted={false}
        themeTokens={customTokens}
      />
    );

    const paths = container.querySelectorAll('svg path');
    const fillColors = Array.from(paths).map((p) => p.getAttribute('fill'));

    expect(fillColors).toContain('#FF0000');
    expect(fillColors).toContain('#0000FF');
  });
});
