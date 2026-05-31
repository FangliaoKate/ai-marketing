/**
 * Property-based tests for app/components/Workbench.tsx
 * Feature: xpeng-ai-marketing-demo
 */

// Feature: xpeng-ai-marketing-demo, Property 2: 切换车型时 textarea value 不变，placeholder 更新
// Feature: xpeng-ai-marketing-demo, Property 4: 字符计数显示与实际输入长度一致
// Feature: xpeng-ai-marketing-demo, Property 5: 纯空白输入阻止 API 调用并显示错误

import * as fc from 'fast-check';
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import Workbench from '../app/components/Workbench';
import { CAR_MODEL_IDS, CAR_MODEL_MAP, CarModelId } from '../app/config';

// Default props shared across tests
const defaultProps = {
  isGenerating: false,
  onGenerate: jest.fn(),
  apiError: null,
  onAnimationComplete: jest.fn(),
  selectedCarModel: 'gx' as CarModelId,
  onModelChange: jest.fn(),
};

/**
 * Property 2: 切换车型时 textarea value 不变，placeholder 更新
 *
 * For any pre-filled text and any target car model, after rerendering with a
 * different selectedCarModel the textarea value should remain unchanged and
 * the placeholder should equal the new model's promptPlaceholder.
 *
 * Validates: Requirements 1.3, 2.3
 */
describe('Property 2: 切换车型时 textarea value 不变，placeholder 更新', () => {
  it('textarea value is preserved and placeholder updates when selectedCarModel changes', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.constantFrom(...CAR_MODEL_IDS),
        (userText: string, newModel: CarModelId) => {
          const onModelChange = jest.fn();
          const { rerender, unmount } = render(
            <Workbench
              {...defaultProps}
              selectedCarModel="gx"
              onModelChange={onModelChange}
            />
          );

          // Pre-fill the textarea with userText
          const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
          fireEvent.change(textarea, { target: { value: userText } });

          // Verify the value was set
          expect(textarea.value).toBe(userText);

          // Rerender with a different car model
          rerender(
            <Workbench
              {...defaultProps}
              selectedCarModel={newModel}
              onModelChange={onModelChange}
            />
          );

          // Value must remain unchanged
          expect(textarea.value).toBe(userText);

          // Placeholder must equal the new model's promptPlaceholder
          expect(textarea.placeholder).toBe(CAR_MODEL_MAP[newModel].promptPlaceholder);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 4: 字符计数显示与实际输入长度一致
 *
 * For any string up to 500 characters, the counter element should display
 * "{n}/500" where n is the string's length.
 *
 * Validates: Requirements 2.4
 */
describe('Property 4: 字符计数显示与实际输入长度一致', () => {
  it('character counter shows "{n}/500" matching the actual input length', () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 500 }),
        (inputText: string) => {
          const { unmount } = render(
            <Workbench {...defaultProps} />
          );

          const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
          fireEvent.change(textarea, { target: { value: inputText } });

          const expectedCounter = `${inputText.length}/500`;
          expect(screen.getByText(expectedCounter)).toBeInTheDocument();

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 5: 纯空白输入阻止 API 调用并显示错误
 *
 * For any whitespace-only string (spaces, tabs, newlines), clicking the
 * generate button should NOT call onGenerate and should display the error
 * message "请输入活动想法".
 *
 * Validates: Requirements 2.5
 */
describe('Property 5: 纯空白输入阻止 API 调用并显示错误', () => {
  it('whitespace-only input prevents onGenerate call and shows error message', () => {
    fc.assert(
      fc.property(
        fc.string({ unit: fc.constantFrom(' ', '\t', '\n'), maxLength: 500 }),
        (whitespaceInput: string) => {
          const onGenerate = jest.fn();
          const { unmount } = render(
            <Workbench
              {...defaultProps}
              onGenerate={onGenerate}
            />
          );

          const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
          fireEvent.change(textarea, { target: { value: whitespaceInput } });

          // Click the generate button
          const generateButton = screen.getByText('⚡ 一键生成活动页');
          fireEvent.click(generateButton);

          // onGenerate must NOT have been called
          expect(onGenerate).not.toHaveBeenCalled();

          // Error message must be visible
          expect(screen.getByText('请输入活动想法')).toBeInTheDocument();

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});
