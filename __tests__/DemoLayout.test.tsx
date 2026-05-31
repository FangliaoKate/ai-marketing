/**
 * Property-based tests for app/components/DemoLayout.tsx
 * Feature: xpeng-ai-marketing-demo
 */

import * as fc from 'fast-check';
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import DemoLayout from '../app/components/DemoLayout';
import { CAR_MODEL_IDS, CAR_MODEL_MAP } from '../app/config';

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a mock Response object for a given HTTP status code */
function buildErrorResponse(status: number) {
  return {
    ok: false,
    status,
    json: jest.fn().mockResolvedValue({ error: `HTTP ${status}` }),
  } as unknown as Response;
}

// ─── Property 6: POST 请求体同时包含 userInput 和 carModel 且值正确 ──────────
// Feature: xpeng-ai-marketing-demo, Property 6: POST 请求体同时包含 userInput 和 carModel 且值正确
// Validates: Requirements 3.1
describe('Property 6: POST request body contains correct userInput and carModel', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('fetch is called with the correct userInput and carModel in the request body', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0),
        fc.constantFrom(...CAR_MODEL_IDS),
        async (userInput, carModel) => {
          // Capture the fetch call arguments
          let capturedBody: Record<string, unknown> | null = null;

          const mockFetch = jest.fn().mockImplementation((_url: string, options: RequestInit) => {
            capturedBody = JSON.parse(options.body as string);
            // Return a pending promise — we only care about the request body, not the response
            return new Promise(() => {/* never resolves */});
          });
          global.fetch = mockFetch as typeof fetch;

          const { unmount } = render(<DemoLayout />);
          try {
            // Scope the tab query to the tablist to avoid duplicate matches across renders
            const tablist = screen.getByRole('tablist', { name: '车型选择' });
            const modelButton = tablist.querySelector(
              `[aria-label="${CAR_MODEL_MAP[carModel].displayName}"]`
            ) as HTMLElement;
            expect(modelButton).not.toBeNull();
            fireEvent.click(modelButton);

            // Set the textarea value to userInput.
            // Scope to the tablist's parent (the workbench panel) to avoid matching
            // the LeadForm inputs in the phone preview.
            const workbenchPanel = tablist.closest('div[class*="w-2/5"]') as HTMLElement;
            const textarea = within(workbenchPanel).getByRole('textbox');
            fireEvent.change(textarea, { target: { value: userInput } });

            // Click the generate button
            const generateButton = screen.getByText('⚡ 一键生成活动页');
            fireEvent.click(generateButton);

            // Verify fetch was called with the correct body
            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(capturedBody).not.toBeNull();
            expect(capturedBody!.userInput).toBe(userInput);
            expect(capturedBody!.carModel).toBe(carModel);
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 100 }
    );
  }, 60000); // 60s timeout for 100 iterations
});

// ─── Property 7: API 错误后 GenerateButton 恢复可点击且错误信息可见 ──────────
// Feature: xpeng-ai-marketing-demo, Property 7: API 错误或超时后 GenerateButton 恢复可点击且错误信息可见
// Validates: Requirements 3.4
describe('Property 7: After API error, generate button is re-enabled and error message is visible', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('isGenerating becomes false and error text is visible after fetch returns an error status', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(400, 500, 502),
        async (statusCode) => {
          global.fetch = jest.fn().mockResolvedValue(
            buildErrorResponse(statusCode)
          ) as typeof fetch;

          const { unmount } = render(<DemoLayout />);
          try {
            // Click the generate button (textarea already has default GX text)
            const generateButton = screen.getByText('⚡ 一键生成活动页');
            fireEvent.click(generateButton);

            // Wait for the error state: button re-enabled and error message visible.
            // Promise.all rejects as soon as fetchPromise rejects, so the catch block
            // runs quickly without waiting for the animation promise to resolve.
            await waitFor(
              () => {
                const btn = screen.getByText('⚡ 一键生成活动页');
                expect(btn).not.toBeDisabled();
              },
              { timeout: 2000 }
            );

            // Error message should be visible in the DOM.
            // 5xx → 'AI 服务暂时不可用，请稍后重试'
            // 4xx → error text from response body, e.g. 'HTTP 400'
            const errorMessages = [
              'AI 服务暂时不可用，请稍后重试',
              `HTTP ${statusCode}`,
            ];
            const hasError = errorMessages.some(
              (msg) => screen.queryByText(msg) !== null
            );
            expect(hasError).toBe(true);
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 100 }
    );
  }, 60000); // 60s timeout for 100 async iterations
});
