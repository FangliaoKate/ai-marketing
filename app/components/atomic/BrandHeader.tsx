'use client';

import type { AtomicComponentProps } from './types';

export default function BrandHeader({ config, tokens }: AtomicComponentProps) {
  // Soften the halo gradient slightly for the linear top-to-bottom wash
  // Replace the alpha value with a lower one (e.g. 0.20 → 0.10) using a regex
  const linearBg = `linear-gradient(to bottom, ${tokens.haloColor.replace(/[\d.]+\)$/, '0.10)')}, transparent)`;
  const radialBg = `radial-gradient(ellipse at center, ${tokens.haloColor} 0%, transparent 70%)`;

  return (
    <div
      className="relative py-6 px-4 overflow-hidden"
      style={{ background: linearBg }}
    >
      {/* 径向渐变光晕 */}
      <div
        className="absolute inset-0"
        style={{ background: radialBg }}
      />

      {/* 内容 */}
      <div className="relative z-10">
        <p
          className="text-xs font-mono tracking-widest text-center"
          style={{ color: tokens.primary }}
        >
          ⚡ XPENG 小鹏汽车官方活动
        </p>
        <div className="flex justify-center mt-2">
          <span
            className="text-black text-xs font-bold px-3 py-1 rounded-full break-words text-center max-w-full"
            style={{ backgroundColor: tokens.secondary }}
          >
            {config.tag}
          </span>
        </div>
      </div>
    </div>
  );
}
