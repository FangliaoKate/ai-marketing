'use client';

import { useState } from 'react';

interface MultiTurnInputProps {
  isGenerating: boolean;
  onSubmit: (currentInput: string) => void;
}

export default function MultiTurnInput({ isGenerating, onSubmit }: MultiTurnInputProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed) {
      setError('请输入追问内容');
      return;
    }
    setError(null);
    onSubmit(trimmed);
  }

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3"
      style={{ backgroundColor: '#0D1117', border: '1px solid #1f2937' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#00D4AA]" />
        <span className="text-xs font-medium text-gray-400">追问微调</span>
        <span className="text-xs text-gray-600 ml-auto">告诉 AI 你想调整什么</span>
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          className="w-full min-h-[80px] bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-3 pb-6 text-white text-sm resize-none focus:outline-none focus:border-[#00D4AA] focus:ring-1 focus:ring-[#00D4AA]/30 transition-colors placeholder-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          placeholder="例如：把车放回顶部放大，转盘放到底部收敛一点"
          maxLength={500}
          disabled={isGenerating}
        />
        <span className="absolute bottom-2 right-3 text-xs text-gray-500 select-none pointer-events-none">
          {value.length}/500
        </span>
      </div>

      {/* Inline error */}
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={isGenerating}
        className="w-full py-2.5 rounded-lg font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed bg-[#1A2744] border border-[#00D4AA]/40 text-[#00D4AA] hover:bg-[#00D4AA]/10 flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            生成中...
          </>
        ) : (
          <>✏️ 追问微调</>
        )}
      </button>
    </div>
  );
}
