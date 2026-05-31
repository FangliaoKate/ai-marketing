/**
 * Property-based tests for app/components/ModelSelector.tsx
 * Feature: xpeng-ai-marketing-demo
 */

// Feature: xpeng-ai-marketing-demo, Property 1: 点击任意车型选项后该车型成为选中状态
// Feature: xpeng-ai-marketing-demo, Property 3: isGenerating 时 ModelSelector 禁用状态与 isGenerating 一致

import * as fc from 'fast-check';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import ModelSelector from '../app/components/ModelSelector';
import { CAR_MODEL_IDS, CAR_MODEL_MAP, CarModelId } from '../app/config';

const allModels = Object.values(CAR_MODEL_MAP);

/**
 * Property 1: 点击任意车型选项后该车型成为选中状态
 *
 * For any car model ID, clicking its button should call onChange with that ID.
 *
 * Validates: Requirements 1.2
 */
describe('Property 1: 点击任意车型选项后该车型成为选中状态', () => {
  it('clicking any model button calls onChange with the correct model ID', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...CAR_MODEL_IDS),
        (modelId: CarModelId) => {
          const onChange = jest.fn();
          const { getByText, unmount } = render(
            <ModelSelector
              models={allModels}
              selectedId="gx"
              onChange={onChange}
              disabled={false}
            />
          );

          const model = CAR_MODEL_MAP[modelId];
          const button = getByText(model.displayName);
          fireEvent.click(button);

          expect(onChange).toHaveBeenCalledTimes(1);
          expect(onChange).toHaveBeenCalledWith(modelId);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 3: isGenerating 时 ModelSelector 禁用状态与 isGenerating 一致
 *
 * When disabled=true, the wrapper div should have the `pointer-events-none` class.
 * When disabled=false, it should not.
 *
 * Validates: Requirements 1.5
 */
describe('Property 3: isGenerating 时 ModelSelector 禁用状态与 isGenerating 一致', () => {
  it('wrapper div has pointer-events-none class iff disabled=true', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (isGenerating: boolean) => {
          const { getByRole, unmount } = render(
            <ModelSelector
              models={allModels}
              selectedId="gx"
              onChange={jest.fn()}
              disabled={isGenerating}
            />
          );

          const tablist = getByRole('tablist');
          const hasPointerEventsNone = tablist.classList.contains('pointer-events-none');

          unmount();

          return hasPointerEventsNone === isGenerating;
        }
      ),
      { numRuns: 100 }
    );
  });
});
