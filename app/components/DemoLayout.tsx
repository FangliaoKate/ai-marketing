'use client';

import { useState, useRef } from 'react';
import { DemoConfig, config as staticConfig, CarModelId, ThemeTokens, getThemeTokens } from '../config';
import { LayoutMatrix, normalizeLayoutMatrix } from '@/app/lib/atomicLayout';
import { deriveActiveTags } from '@/app/lib/tagDerivation';
import Workbench from './Workbench';
import PhonePreview from './PhonePreview';

interface DemoLayoutProps {
  config?: DemoConfig;
}

export default function DemoLayout({ config: initialConfig }: DemoLayoutProps) {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isFormSubmitted, setIsFormSubmitted] = useState<boolean>(false);
  const [previewKey, setPreviewKey] = useState<number>(0);
  const [config, setConfig] = useState<DemoConfig>(initialConfig ?? staticConfig);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedCarModel, setSelectedCarModel] = useState<CarModelId>('gx');
  const [multiTurnKey, setMultiTurnKey] = useState<number>(0);
  const [multiTurnHistory, setMultiTurnHistory] = useState<string[]>([]);

  // Derived: compute theme tokens from current config on every render (no extra state)
  const themeTokens: ThemeTokens = getThemeTokens(config.theme);

  // Derived: normalize layoutMatrix from config at render time — no separate state variable
  const layoutMatrix: LayoutMatrix = normalizeLayoutMatrix(config.layoutMatrix);

  // Derived: true after first successful generation
  const hasGenerated: boolean = previewKey >= 1;

  // Derived: active decision tags from current layout + theme
  const activeTagSet: Set<string> = deriveActiveTags(layoutMatrix, config.theme);

  // Refs to coordinate animation completion and API fetch completion
  const animationResolveRef = useRef<(() => void) | null>(null);

  function handleAnimationComplete(): void {
    if (animationResolveRef.current) {
      animationResolveRef.current();
      animationResolveRef.current = null;
    }
  }

  async function handleGenerate(userInput: string, carModel: CarModelId): Promise<void> {
    setIsGenerating(true);
    setApiError(null);

    // Create a promise that resolves when the StepsUI animation completes
    const animationPromise = new Promise<void>((resolve) => {
      animationResolveRef.current = resolve;
    });

    // Client-side 30-second timeout using AbortController + Promise.race
    const controller = new AbortController();
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        controller.abort();
        reject(new Error('__timeout__'));
      }, 30000);
    });

    // Create the API fetch promise (signal allows AbortController to cancel it)
    const fetchPromise = Promise.race([
      fetch('/api/generate', {
        method: 'POST',
        body: JSON.stringify({ userInput, carModel }),
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      }).then(async (res) => {
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          if (res.status >= 500) {
            throw new Error('__5xx__');
          }
          throw new Error(errBody.error ?? `HTTP ${res.status}`);
        }
        const newConfig: DemoConfig = await res.json();
        return newConfig;
      }),
      timeoutPromise,
    ]);

    try {
      // Wait for BOTH animation and API to complete
      const [, newConfig] = await Promise.all([animationPromise, fetchPromise]);
      setConfig(newConfig);
      setPreviewKey((prev) => prev + 1);
      setIsFormSubmitted(false);
      setIsGenerating(false);
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Unknown error';
      let message: string;
      if (raw === '__timeout__') {
        message = '请求超时，请重试';
      } else if (raw === '__5xx__') {
        message = 'AI 服务暂时不可用，请稍后重试';
      } else {
        message = raw;
      }
      setApiError(message);
      setIsGenerating(false);
    }
  }

  function handleFormSubmit(): void {
    setIsFormSubmitted(true);
  }

  async function handleMultiTurnGenerate(currentInput: string): Promise<void> {
    setIsGenerating(true);
    setApiError(null);

    const controller = new AbortController();
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        controller.abort();
        reject(new Error('__timeout__'));
      }, 30000);
    });

    const fetchPromise = Promise.race([
      fetch('/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          isMultiTurn: true,
          previousJson: config,
          currentInput,
          carModel: selectedCarModel,
        }),
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      }).then(async (res) => {
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          if (res.status >= 500) throw new Error('__5xx__');
          throw new Error(errBody.error ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<DemoConfig>;
      }),
      timeoutPromise,
    ]);

    try {
      const newConfig = await fetchPromise;
      setConfig(newConfig);
      setPreviewKey((prev) => prev + 1);
      setMultiTurnKey((prev) => prev + 1);
      setMultiTurnHistory((prev) => [...prev, currentInput]);
      // NOTE: isFormSubmitted is intentionally NOT reset on multi-turn
      setIsGenerating(false);
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Unknown error';
      let message: string;
      if (raw === '__timeout__') {
        message = '请求超时，请重试';
      } else if (raw === '__5xx__') {
        message = 'AI 服务暂时不可用，请稍后重试';
      } else {
        message = raw;
      }
      setApiError(message);
      setIsGenerating(false);
    }
  }

  return (
    <div className="flex h-screen bg-[#0A0A0A] p-4 gap-4 overflow-hidden">
      {/* Left: AI Workbench */}
      <div className="w-2/5 bg-[#111111] p-8 flex flex-col overflow-y-auto overflow-x-hidden rounded-2xl">
        <Workbench
          isGenerating={isGenerating}
          onGenerate={handleGenerate}
          apiError={apiError}
          onAnimationComplete={handleAnimationComplete}
          selectedCarModel={selectedCarModel}
          onModelChange={setSelectedCarModel}
          hasGenerated={hasGenerated}
          currentConfig={config}
          activeTagSet={activeTagSet}
          onMultiTurnGenerate={handleMultiTurnGenerate}
          multiTurnKey={multiTurnKey}
          multiTurnHistory={multiTurnHistory}
        />
      </div>

      {/* Right: Phone Preview Stage */}
      <div className="w-3/5 flex flex-col items-center justify-center bg-[#0D0D0D] relative overflow-hidden rounded-2xl">

        {/* Ambient grid background */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Radial ambient glow — color follows current theme */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 60% 50% at 50% 55%, ${themeTokens.haloColor.replace(/[\d.]+\)$/, '0.12)')} 0%, transparent 70%)`,
          }}
        />

        {/* Top label */}
        <div className="relative z-10 mb-4 flex flex-col items-center gap-1.5">
          <div
            className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: `${themeTokens.primary}18`,
              border: `1px solid ${themeTokens.primary}40`,
              color: themeTokens.primary,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: themeTokens.primary }}
            />
            H5 活动页实时预览
          </div>
          <p className="text-gray-600 text-xs">← 左侧生成后自动更新</p>
        </div>

        {/* Phone — scale down to fit viewport height with padding */}
        <div className="relative z-10">
          <PhonePreview
            config={config}
            previewKey={previewKey}
            isFormSubmitted={isFormSubmitted}
            onFormSubmit={handleFormSubmit}
            themeTokens={themeTokens}
            layoutMatrix={layoutMatrix}
          />
        </div>

        {/* Bottom reflection / ground shadow */}
        <div
          className="relative z-10 mt-2 w-[200px] h-[16px] rounded-full blur-xl opacity-30"
          style={{ background: themeTokens.primary }}
        />
      </div>
    </div>
  );
}
