'use client';

import type { AtomicComponentProps } from './types';

export default function CarStage({ config, tokens, settings }: AtomicComponentProps) {
  const content = (
    <div className="relative overflow-hidden px-4">
      {/* Radial halo background */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 60%, ${tokens.haloColor.replace(/[\d.]+\)$/, '0.45)')} 0%, transparent 70%)`,
        }}
      />

      {/* Linear gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, transparent 0%, ${tokens.haloColor.replace(/[\d.]+\)$/, '0.25)')} 50%, transparent 100%)`,
        }}
      />

      {/* Decorative ring */}
      <div className="relative flex items-center justify-center py-10 px-4">
        <div
          className="absolute w-48 h-48 rounded-full"
          style={{
            border: `1px solid ${tokens.primary}22`,
            boxShadow: `0 0 40px ${tokens.haloColor}, inset 0 0 40px ${tokens.haloColor}`,
          }}
        />
        <div
          className="absolute w-32 h-32 rounded-full"
          style={{
            border: `1px solid ${tokens.primary}44`,
            boxShadow: `0 0 20px ${tokens.haloColor}`,
          }}
        />

        {/* Car model name */}
        <div className="relative z-10 text-center">
          <p
            className="text-xs font-mono tracking-widest uppercase mb-2"
            style={{ color: tokens.primary, opacity: 0.7 }}
          >
            MODEL
          </p>
          <h2
            className="text-3xl font-bold tracking-tight"
            style={{
              color: '#FFFFFF',
              textShadow: `0 0 20px ${tokens.primary}88, 0 0 40px ${tokens.haloColor}`,
            }}
          >
            {config.carModel}
          </h2>
          <div
            className="mt-2 h-px w-16 mx-auto"
            style={{
              background: `linear-gradient(to right, transparent, ${tokens.primary}, transparent)`,
            }}
          />
        </div>
      </div>
    </div>
  );

  if (settings.isBackground === true) {
    return (
      <div style={{ opacity: 0.4 }}>
        {content}
      </div>
    );
  }

  return content;
}
