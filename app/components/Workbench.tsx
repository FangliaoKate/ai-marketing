'use client';

import { useState, useRef } from 'react';
import StepsUI from './StepsUI';
import ModelSelector from './ModelSelector';
import MultiTurnInput from './MultiTurnInput';
import { CarModelId, CAR_MODEL_MAP, DemoConfig } from '../config';

interface WorkbenchProps {
  isGenerating: boolean;
  onGenerate: (userInput: string, carModel: CarModelId) => void;
  apiError: string | null;
  onAnimationComplete: () => void;
  selectedCarModel: CarModelId;
  onModelChange: (id: CarModelId) => void;
  // Multi-turn / manifest props
  hasGenerated: boolean;
  currentConfig: DemoConfig;
  activeTagSet: Set<string>;
  onMultiTurnGenerate: (currentInput: string) => void;
  multiTurnKey: number;
  multiTurnHistory: string[];
}

export default function Workbench({
  isGenerating,
  onGenerate,
  apiError,
  onAnimationComplete,
  selectedCarModel,
  onModelChange,
  hasGenerated,
  activeTagSet,
  onMultiTurnGenerate,
  multiTurnKey,
  multiTurnHistory,
}: WorkbenchProps) {
  const [userInput, setUserInput] = useState(CAR_MODEL_MAP.gx.promptPlaceholder);
  const [inputError, setInputError] = useState<string | null>(null);
  const prevModelRef = useRef<CarModelId>(selectedCarModel);

  // Swap example text when model changes and user hasn't customised
  if (prevModelRef.current !== selectedCarModel) {
    const prevPlaceholder = CAR_MODEL_MAP[prevModelRef.current].promptPlaceholder;
    if (userInput === prevPlaceholder) {
      setUserInput(CAR_MODEL_MAP[selectedCarModel].promptPlaceholder);
    }
    prevModelRef.current = selectedCarModel;
  }

  const handleGenerate = () => {
    if (userInput.trim() === '') {
      setInputError('请输入活动想法');
      return;
    }
    setInputError(null);
    onGenerate(userInput, selectedCarModel);
  };

  // Show multi-turn / manifest panels only after first generation and not while generating
  const showPostGenPanels = hasGenerated && !isGenerating;

  return (
    <div className="flex flex-col h-full gap-6">
      {/* 顶部标题栏 */}
      <div>
        <div className="inline-block pb-1 border-b-2 border-[#00D4AA] mb-3">
          <h2 className="text-white text-xl font-bold">🤖 AI 营销工作台</h2>
        </div>
        <p className="text-gray-400 text-sm mt-1">输入活动需求，AI 自动生成符合小鹏品牌调性的 H5 活动页</p>
      </div>

      {/* 车型选择器 */}
      <ModelSelector
        models={Object.values(CAR_MODEL_MAP)}
        selectedId={selectedCarModel}
        onChange={onModelChange}
        disabled={isGenerating}
      />

      {/* 输入区 */}
      <div className="flex flex-col gap-3 flex-1">
        <label className="text-gray-300 text-sm font-medium">活动需求描述</label>
        <div className="relative flex flex-col flex-1">
          <textarea
            className="w-full flex-1 min-h-[160px] bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 pb-7 text-white text-sm resize-none focus:outline-none focus:border-[#00D4AA] focus:ring-1 focus:ring-[#00D4AA]/30 transition-colors placeholder-gray-600"
            value={userInput}
            onChange={(e) => {
              setUserInput(e.target.value);
              if (inputError) setInputError(null);
            }}
            placeholder={CAR_MODEL_MAP[selectedCarModel].promptPlaceholder}
            maxLength={500}
          />
          <span className="absolute bottom-2 right-3 text-xs text-gray-500 select-none pointer-events-none">
            {userInput.length}/500
          </span>
        </div>
        {inputError && (
          <p className="text-sm text-red-400">{inputError}</p>
        )}
      </div>

      {/* 生成按钮 */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full py-4 rounded-xl font-bold text-black text-base transition-all disabled:opacity-60 disabled:cursor-not-allowed bg-[#F5A623] hover:bg-[#F5A623]/90 hover:shadow-[0_0_20px_rgba(245,166,35,0.5)] flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            生成中...
          </>
        ) : (
          <>⚡ 一键生成活动页</>
        )}
      </button>

      {/* API 错误信息 */}
      {apiError && (
        <p className="text-sm text-red-400">{apiError}</p>
      )}

      {/* StepsUI 步骤动画面板 */}
      <StepsUI
        isVisible={isGenerating}
        onAnimationComplete={onAnimationComplete}
        carModel={CAR_MODEL_MAP[selectedCarModel]}
      />

      {/* ── 多轮追问输入框 — 首次生成后解锁 ── */}
      {showPostGenPanels && (
        <div className="flex flex-col gap-3">
          {/* 追问历史记录 */}
          {multiTurnHistory.length > 0 && (
            <div
              className="rounded-xl p-3 flex flex-col gap-2"
              style={{ backgroundColor: '#0D1117', border: '1px solid #1f2937' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#00D4AA]" />
                <span className="text-xs font-medium text-gray-400">追问记录</span>
              </div>
              {multiTurnHistory.map((msg, i) => (
                <div key={i} className="flex items-start gap-2 animate-fade-in">
                  <span
                    className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-black"
                    style={{ backgroundColor: '#00D4AA' }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-gray-300 text-xs leading-relaxed">{msg}</p>
                </div>
              ))}
            </div>
          )}

          {/* 追问输入框 */}
          <MultiTurnInput
            key={multiTurnKey}
            isGenerating={isGenerating}
            onSubmit={onMultiTurnGenerate}
          />
        </div>
      )}


    </div>
  );
}
