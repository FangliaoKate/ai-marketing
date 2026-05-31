'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { DemoConfig, ThemeTokens } from '../config';
import { ATOMIC_COMPONENT_MAP } from './atomic';
import type { LayoutMatrix, ComponentSettings } from '@/app/lib/atomicLayout';

interface PhonePreviewProps {
  config: DemoConfig;
  previewKey: number;
  isFormSubmitted: boolean;
  onFormSubmit: () => void;
  themeTokens: ThemeTokens;
  layoutMatrix: LayoutMatrix;
}

const SPRING = { type: 'spring', stiffness: 200, damping: 25 } as const;

export function resolveAnimateProps(settings: ComponentSettings): { scale: number; opacity: number } {
  const scale =
    settings.scale === 'large' ? 1.15
    : settings.scale === 'small' ? 0.9
    : 1.0;

  const opacity =
    settings.highlight === true ? 1.0
    : settings.isBackground === true ? 0.35
    : 0.85;

  return { scale, opacity };
}

export default function PhonePreview({
  config,
  previewKey,
  isFormSubmitted,
  onFormSubmit,
  themeTokens,
  layoutMatrix,
}: PhonePreviewProps) {
  return (
    <div className="relative">
      {/* ── Outer glow ring around the phone ── */}
      <div
        className="absolute -inset-[2px] rounded-[52px] opacity-60 blur-sm pointer-events-none"
        style={{
          background: `linear-gradient(145deg, ${themeTokens.primary}60, transparent 40%, ${themeTokens.secondary}40)`,
        }}
      />

      {/* ── Left volume buttons — outside overflow-hidden so they don't break clipping ── */}
      <div className="absolute left-[-3px] top-[118px] w-[3px] h-[30px] rounded-l-sm z-10"
        style={{ background: 'linear-gradient(to right, #444, #666)' }} />
      <div className="absolute left-[-3px] top-[160px] w-[3px] h-[56px] rounded-l-sm z-10"
        style={{ background: 'linear-gradient(to right, #444, #666)' }} />
      <div className="absolute left-[-3px] top-[228px] w-[3px] h-[56px] rounded-l-sm z-10"
        style={{ background: 'linear-gradient(to right, #444, #666)' }} />

      {/* ── Right power button ── */}
      <div className="absolute right-[-3px] top-[180px] w-[3px] h-[72px] rounded-r-sm z-10"
        style={{ background: 'linear-gradient(to left, #444, #666)' }} />

      {/* ── Phone chassis — titanium-style multi-stop gradient border ── */}
      <div
        className="relative p-[2px] rounded-[50px]"
        style={{
          background: 'linear-gradient(145deg, #6b6b6b 0%, #3a3a3a 25%, #888 50%, #2a2a2a 75%, #555 100%)',
          boxShadow: `
            0 40px 80px rgba(0,0,0,0.8),
            0 20px 40px rgba(0,0,0,0.6),
            0 0 0 1px rgba(255,255,255,0.06),
            inset 0 1px 0 rgba(255,255,255,0.15)
          `,
        }}
      >
        {/* ── Inner bezel (thin dark ring) ── */}
        <div className="p-[1px] rounded-[49px] bg-[#1a1a1a]">
          <div
            className="relative w-[340px] h-[700px] rounded-[48px] overflow-hidden flex flex-col"
            style={{ background: themeTokens.bg }}
          >

            {/* ── Screen glare / highlight overlay ── */}
            <div
              className="absolute inset-0 pointer-events-none z-20 rounded-[48px]"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.02) 100%)',
              }}
            />

            {/* ── Status bar with Dynamic Island ── */}
            <div className="h-16 bg-black flex items-end justify-between px-6 pb-2 flex-shrink-0 relative">
              {/* Time */}
              <span className="text-white text-xs font-semibold">9:41</span>

              {/* Dynamic Island pill */}
              <div
                className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[110px] h-[30px] rounded-full bg-black flex items-center justify-center gap-2"
                style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.08)' }}
              >
                {/* Camera dot */}
                <div className="w-2 h-2 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-[#2a2a2a]" />
                </div>
                {/* FaceID sensor */}
                <div className="w-2.5 h-2.5 rounded-full border border-[#333]" />
              </div>

              {/* Status icons */}
              <div className="flex items-center gap-1.5">
                {/* Signal bars */}
                <div className="flex items-end gap-[2px] h-3">
                  {[3, 5, 7, 9].map((h, i) => (
                    <div
                      key={i}
                      className="w-[3px] rounded-sm bg-white"
                      style={{ height: `${h}px`, opacity: i < 3 ? 1 : 0.3 }}
                    />
                  ))}
                </div>
                {/* WiFi */}
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                  <path d="M7 8.5a1 1 0 100 2 1 1 0 000-2z" fill="white"/>
                  <path d="M4.5 6.5C5.3 5.7 6.1 5.3 7 5.3s1.7.4 2.5 1.2" stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
                  <path d="M2 4C3.5 2.5 5.2 1.7 7 1.7s3.5.8 5 2.3" stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.5"/>
                </svg>
                {/* Battery */}
                <div className="flex items-center gap-[1px]">
                  <div className="w-6 h-3 rounded-[3px] border border-white/60 p-[1.5px] flex items-center">
                    <div className="h-full bg-white rounded-[1px]" style={{ width: '75%' }} />
                  </div>
                  <div className="w-[2px] h-[5px] bg-white/40 rounded-r-sm" />
                </div>
              </div>
            </div>

            {/* ── Scrollable content area ── */}
            <div
              key={previewKey}
              className="flex-1 overflow-y-auto animate-fade-in"
              style={{ scrollbarWidth: 'none', overflowX: 'clip', paddingBottom: '16px' }}
            >
              <AnimatePresence>
                {layoutMatrix.componentOrder.map((componentId) => {
                  const Component = ATOMIC_COMPONENT_MAP[componentId];
                  if (!Component) return null;
                  const settings = layoutMatrix.componentSettings?.[componentId] ?? {};
                  const { scale, opacity } = resolveAnimateProps(settings);
                  return (
                    <motion.div
                      key={componentId}
                      layoutId={componentId}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ scale, opacity }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={SPRING}
                    >
                      <Component
                        config={config}
                        tokens={themeTokens}
                        settings={settings}
                        isFormSubmitted={isFormSubmitted}
                        onSubmitSuccess={onFormSubmit}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* ── Home indicator ── */}
            <div className="h-8 bg-black flex items-center justify-center flex-shrink-0">
              <div className="w-28 h-[5px] bg-white/30 rounded-full" />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
