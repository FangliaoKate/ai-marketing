// Feature: xpeng-ai-marketing-demo, Property 11: PhonePreview renders all DemoConfig text fields
import React from 'react';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import PhonePreview from '../app/components/PhonePreview';
import { THEME_MAP, ThemeTokens } from '../app/config';
import { normalizeLayoutMatrix } from '../app/lib/atomicLayout';

// Mock canvas-confetti to avoid canvas errors in jsdom
jest.mock('canvas-confetti', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock framer-motion to avoid animation issues in jsdom
jest.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: React.forwardRef(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ({ children, layoutId: _layoutId, layout: _layout, animate: _animate, transition: _transition, ...props }: any, ref: React.Ref<HTMLDivElement>) => (
        <div ref={ref} {...props}>{children}</div>
      )
    ),
  },
}));

const defaultThemeTokens: ThemeTokens = THEME_MAP['luxury_ai'];
const defaultLayoutMatrix = normalizeLayoutMatrix(undefined);

/**
 * Property 11: PhonePreview renders all DemoConfig text fields
 *
 * For any DemoConfig with arbitrary tag, title, subtitle, sellingPoints, and
 * prizes, the PhonePreview component should render all text fields in its output:
 * - tag appears as the activity label badge
 * - title appears as the main heading
 * - subtitle appears as the sub-heading
 * - every sellingPoints entry appears in a card
 *
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4
 */
describe('PhonePreview', () => {
  it('Property 11: renders tag, title, subtitle, and all sellingPoints from DemoConfig', () => {
    fc.assert(
      fc.property(
        fc.record({
          tag: fc.string({ minLength: 1 }),
          title: fc.string({ minLength: 1 }),
          subtitle: fc.string({ minLength: 1 }),
          sellingPoints: fc.array(fc.string({ minLength: 1 }), {
            minLength: 1,
            maxLength: 5,
          }),
          prizes: fc.array(
            fc.record({ id: fc.nat(), name: fc.string({ minLength: 1 }) }),
            { minLength: 1, maxLength: 8 }
          ),
        }),
        ({ tag, title, subtitle, sellingPoints, prizes }) => {
          const config = {
            theme: 'luxury_ai',
            carModel: '小鹏 GX',
            tag,
            title,
            subtitle,
            sellingPoints,
            prizes,
          };

          const { container, unmount } = render(
            <PhonePreview
              config={config}
              previewKey={1}
              isFormSubmitted={false}
              onFormSubmit={() => {}}
              themeTokens={defaultThemeTokens}
              layoutMatrix={defaultLayoutMatrix}
            />
          );

          const text = container.textContent ?? '';

          const hasTag = text.includes(tag);
          const hasTitle = text.includes(title);
          const hasSubtitle = text.includes(subtitle);
          const hasAllSellingPoints = sellingPoints.every((point) =>
            text.includes(point)
          );

          unmount();

          return hasTag && hasTitle && hasSubtitle && hasAllSellingPoints;
        }
      ),
      { numRuns: 100 }
    );
  });
});
