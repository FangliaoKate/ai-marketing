/**
 * Property-based tests for app/components/LeadForm.tsx
 * Feature: xpeng-ai-marketing-demo
 */

import * as fc from 'fast-check';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LeadForm from '../app/components/LeadForm';
import { THEME_MAP } from '../app/config';

// Use luxury_ai tokens as default for all tests
const defaultTokens = THEME_MAP['luxury_ai'];

// Mock canvas-confetti to avoid canvas errors in jsdom
jest.mock('canvas-confetti', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// ─── Property 15: Invalid phone number is rejected ───────────────────────────
// Feature: xpeng-ai-marketing-demo, Property 15: 不符合格式的手机号被拒绝并显示正确错误信息
// Validates: Requirements 8.4
describe('Property 15: Invalid phone number is rejected with correct error message', () => {
  it('shows "请输入有效的手机号码" for any non-empty phone that does not match /^1\\d{10}$/', () => {
    fc.assert(
      fc.property(
        // Non-empty, non-whitespace-only strings that don't match the valid phone regex
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0 && !/^1\d{10}$/.test(s)),
        (invalidPhone) => {
          const onSubmitSuccess = jest.fn();
          const { unmount } = render(
            <LeadForm onSubmitSuccess={onSubmitSuccess} themeTokens={defaultTokens} />
          );

          // Fill in a valid name
          const nameInput = screen.getByPlaceholderText('请输入您的姓名');
          fireEvent.change(nameInput, { target: { value: '张三' } });

          // Fill in the invalid phone
          const phoneInput = screen.getByPlaceholderText('请输入手机号码');
          fireEvent.change(phoneInput, { target: { value: invalidPhone } });

          // Submit the form
          const submitButton = screen.getByText('立即锁定品鉴名额 →');
          fireEvent.click(submitButton);

          // onSubmitSuccess should NOT have been called
          expect(onSubmitSuccess).not.toHaveBeenCalled();

          // Error message should be visible
          expect(screen.getByText('请输入有效的手机号码')).toBeInTheDocument();

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Unit tests for LeadForm ──────────────────────────────────────────────────

describe('LeadForm unit tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows "请输入姓名" when name is empty on submit', () => {
    render(<LeadForm onSubmitSuccess={jest.fn()} themeTokens={defaultTokens} />);

    const phoneInput = screen.getByPlaceholderText('请输入手机号码');
    fireEvent.change(phoneInput, { target: { value: '13800138000' } });

    fireEvent.click(screen.getByText('立即锁定品鉴名额 →'));

    expect(screen.getByText('请输入姓名')).toBeInTheDocument();
  });

  it('shows "请输入手机号码" when phone is empty on submit', () => {
    render(<LeadForm onSubmitSuccess={jest.fn()} themeTokens={defaultTokens} />);

    const nameInput = screen.getByPlaceholderText('请输入您的姓名');
    fireEvent.change(nameInput, { target: { value: '张三' } });

    fireEvent.click(screen.getByText('立即锁定品鉴名额 →'));

    expect(screen.getByText('请输入手机号码')).toBeInTheDocument();
  });

  it('accepts a valid phone number matching /^1\\d{10}$/', () => {
    const onSubmitSuccess = jest.fn();
    render(<LeadForm onSubmitSuccess={onSubmitSuccess} themeTokens={defaultTokens} />);

    fireEvent.change(screen.getByPlaceholderText('请输入您的姓名'), {
      target: { value: '李四' },
    });
    fireEvent.change(screen.getByPlaceholderText('请输入手机号码'), {
      target: { value: '13800138000' },
    });

    fireEvent.click(screen.getByText('立即锁定品鉴名额 →'));

    // No phone error should appear
    expect(screen.queryByText('请输入有效的手机号码')).not.toBeInTheDocument();
    expect(screen.queryByText('请输入手机号码')).not.toBeInTheDocument();
  });

  it('uses themeTokens.buttonGradient for the submit button background', () => {
    render(<LeadForm onSubmitSuccess={jest.fn()} themeTokens={defaultTokens} />);

    const button = screen.getByText('立即锁定品鉴名额 →');
    expect(button).toHaveStyle({ background: defaultTokens.buttonGradient });
  });

  it('uses themeTokens.primary for the form container borderTop', () => {
    render(<LeadForm onSubmitSuccess={jest.fn()} themeTokens={defaultTokens} />);

    // The form container has borderTop set to themeTokens.primary
    const formContainer = screen.getByText('🔒 锁定品鉴名额').closest('div');
    expect(formContainer).toHaveStyle({ borderTop: `2px solid ${defaultTokens.primary}` });
  });
});
