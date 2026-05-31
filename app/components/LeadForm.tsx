'use client';

import { useState } from 'react';
import MockSubmit from './MockSubmit';
import { ThemeTokens } from '../config';

interface LeadFormProps {
  onSubmitSuccess: () => void;
  themeTokens: ThemeTokens;
}

export default function LeadForm({ onSubmitSuccess, themeTokens }: LeadFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState('');
  const [showMockSubmit, setShowMockSubmit] = useState<boolean>(false);

  async function launchConfetti() {
    try {
      const confetti = (await import('canvas-confetti')).default;
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: [themeTokens.primary, themeTokens.secondary, '#ffffff'],
      });
    } catch {
      // 静默处理，不影响主流程
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: { name?: string; phone?: string } = {};

    if (!name.trim()) {
      newErrors.name = '请输入姓名';
    }
    if (!phone.trim()) {
      newErrors.phone = '请输入手机号码';
    } else if (!/^1\d{10}$/.test(phone)) {
      newErrors.phone = '请输入有效的手机号码';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // 验证通过
    setErrors({});
    setSubmittedName(name);
    launchConfetti();
    setShowMockSubmit(true);
  }

  function handleMockClose() {
    setShowMockSubmit(false);
    setIsSubmitted(true);
    onSubmitSuccess();
  }

  if (isSubmitted) {
    return (
      <div className="px-4 py-4 animate-fade-in-up">
        <div
          className="rounded-xl p-5 animate-fade-in text-center"
          style={{
            background: `linear-gradient(to bottom, ${themeTokens.haloColor.replace(/[\d.]+\)$/, '0.10)')}, transparent)`,
            border: `1px solid ${themeTokens.primary}66`,
          }}
        >
          <div className="text-3xl mb-2">🎉</div>
          <p className="font-bold text-sm" style={{ color: themeTokens.primary }}>预约成功！{submittedName} 的品鉴名额已锁定</p>
          <p className="text-gray-300 text-xs mt-2 leading-relaxed">
            中奖短信已发送<br />线索已同步企业微信
          </p>
          <div className="mt-3 flex items-center justify-center gap-1">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: themeTokens.primary }}
            />
            <span className="text-xs" style={{ color: themeTokens.primary }}>等待专属 Fellow 联系您</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <MockSubmit isOpen={showMockSubmit} onClose={handleMockClose} />
      <div
        className="rounded-xl p-4"
        style={{ background: '#111827', borderTop: `2px solid ${themeTokens.primary}` }}
      >
        <h3 className="text-white text-sm font-bold">🔒 锁定品鉴名额</h3>
        <p className="text-gray-400 text-xs mt-1 mb-4">填写信息，解锁抽奖资格</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* 姓名 */}
          <div>
            <label className="text-gray-400 text-xs mb-1 block">您的姓名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((prev) => ({ ...prev, name: undefined })); }}
              onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px ${themeTokens.primary}80`; }}
              onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
              placeholder="请输入您的姓名"
              className="w-full bg-[#1A1A2E] border rounded-lg px-3 py-2 text-white text-sm focus:outline-none transition-colors placeholder-gray-600"
              style={{ borderColor: errors.name ? '#ef4444' : '#2A2A3E' }}
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* 手机号 */}
          <div>
            <label className="text-gray-400 text-xs mb-1 block">手机号码</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setErrors((prev) => ({ ...prev, phone: undefined })); }}
              onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px ${themeTokens.primary}80`; }}
              onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
              placeholder="请输入手机号码"
              maxLength={11}
              className="w-full bg-[#1A1A2E] border rounded-lg px-3 py-2 text-white text-sm focus:outline-none transition-colors placeholder-gray-600"
              style={{ borderColor: errors.phone ? '#ef4444' : '#2A2A3E' }}
            />
            {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
          </div>

          {/* 提交按钮 */}
          <button
            type="submit"
            className="w-full py-3 rounded-xl font-bold text-black text-sm transition-all"
            style={{ background: themeTokens.buttonGradient }}
          >
            立即锁定品鉴名额 →
          </button>
        </form>
      </div>
    </div>
  );
}
