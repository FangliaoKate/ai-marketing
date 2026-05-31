// Feature: xpeng-ai-marketing-demo, Property 8: ReasoningLog steps contain current model name and tag
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import * as fc from 'fast-check';
import StepsUI from '../app/components/StepsUI';
import { CAR_MODEL_MAP, CarModelMeta } from '../app/config';

/**
 * Property 8: ReasoningLog steps contain current model name and tag
 *
 * For any selected car model in the valid set, the step texts rendered by
 * StepsUI should contain both the model's displayName and its tag string.
 *
 * Validates: Requirements 4.2
 */
describe('StepsUI', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('Property 8: step texts contain carModel.displayName and carModel.tag for any valid car model', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.values(CAR_MODEL_MAP)),
        (carModel: CarModelMeta) => {
          const onAnimationComplete = jest.fn();

          const { unmount } = render(
            <StepsUI
              isVisible={true}
              onAnimationComplete={onAnimationComplete}
              carModel={carModel}
            />
          );

          // Advance timers so all steps become active
          act(() => {
            jest.advanceTimersByTime(3000);
          });

          // Get all rendered text content
          const container = document.body.textContent ?? '';

          // Step 2 must contain both displayName and tag
          const step2Text = `已拦截车型上下文，正在注入 ${carModel.displayName} ${carModel.tag} 核心卖点...`;
          const step3Text = `正在根据 ${carModel.displayName} 调性匹配专属 H5 视觉皮肤...`;

          const hasStep2 = container.includes(carModel.displayName) && container.includes(carModel.tag);
          const hasStep2Full = container.includes(step2Text);
          const hasStep3Full = container.includes(step3Text);

          unmount();

          return hasStep2 && hasStep2Full && hasStep3Full;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('renders nothing when isVisible is false', () => {
    const carModel = CAR_MODEL_MAP.gx;
    const { container } = render(
      <StepsUI
        isVisible={false}
        onAnimationComplete={jest.fn()}
        carModel={carModel}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('snapshots carModel at the moment isVisible becomes true (no text jump on model switch)', () => {
    const gx = CAR_MODEL_MAP.gx;
    const x9 = CAR_MODEL_MAP.x9;
    const onAnimationComplete = jest.fn();

    const { rerender } = render(
      <StepsUI
        isVisible={true}
        onAnimationComplete={onAnimationComplete}
        carModel={gx}
      />
    );

    // Switch carModel mid-animation — text should NOT change
    rerender(
      <StepsUI
        isVisible={true}
        onAnimationComplete={onAnimationComplete}
        carModel={x9}
      />
    );

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // The snapshot was taken with gx, so gx text should be present
    expect(screen.getByText(/正在注入 小鹏 GX/)).toBeInTheDocument();
    // x9 text should NOT appear (snapshot was taken before the switch)
    expect(screen.queryByText(/正在注入 小鹏 X9/)).not.toBeInTheDocument();
  });
});
