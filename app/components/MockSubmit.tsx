'use client';

import { useEffect, useState } from 'react';

interface MockSubmitProps {
  isOpen: boolean;
  onClose: () => void;
}

// 精确文本（不可更改）
const MOCK_SUCCESS_TEXT = '[Mock] 提交成功！';

export default function MockSubmit({ isOpen, onClose }: MockSubmitProps) {
  const [visible, setVisible] = useState(false);

  // 在 isOpen 变为 true 后 300ms 内完成显示
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setVisible(true), 0);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.25s ease',
      }}
      onClick={onClose}
    >
      {/* 卡片：阻止点击冒泡到遮罩 */}
      <div
        className="relative rounded-2xl p-8 flex flex-col items-center gap-5 shadow-2xl"
        style={{
          background: '#111827',
          border: '1px solid rgba(0,212,170,0.35)',
          minWidth: 280,
          maxWidth: 340,
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(12px)',
          transition: 'transform 0.25s ease, opacity 0.25s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部翠绿色装饰线 */}
        <div
          className="absolute top-0 left-8 right-8 h-0.5 rounded-full"
          style={{ background: 'linear-gradient(90deg, transparent, #00D4AA, transparent)' }}
        />

        {/* 图标 */}
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
          style={{ background: 'rgba(0,212,170,0.15)', border: '1.5px solid rgba(0,212,170,0.4)' }}
        >
          ✅
        </div>

        {/* 精确文本 */}
        <p
          className="text-white font-bold text-lg text-center"
          style={{ letterSpacing: '0.02em' }}
        >
          {MOCK_SUCCESS_TEXT}
        </p>

        {/* 副文案 */}
        <p className="text-gray-400 text-xs text-center leading-relaxed">
          演示模式 · 数据不会真实提交
        </p>

        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl font-bold text-black text-sm transition-all"
          style={{
            background: 'linear-gradient(135deg, #00D4AA, #00A882)',
            boxShadow: '0 0 16px rgba(0,212,170,0.3)',
          }}
        >
          确认
        </button>
      </div>
    </div>
  );
}
