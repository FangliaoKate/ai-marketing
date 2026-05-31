'use client';

import type { AtomicComponentProps } from './types';

export default function SellingPoints({ config, tokens, settings }: AtomicComponentProps) {
  const isGrid = settings.displayType === 'grid';

  const containerClass = isGrid
    ? 'grid grid-cols-2 gap-3 px-4 pb-4'
    : 'flex flex-col gap-3 px-4 pb-4';

  return (
    <div className={containerClass}>
      {config.sellingPoints.map((point, index) => (
        <div
          key={index}
          className="bg-[#111827] rounded-xl p-4 hover:bg-[#111827]/80 transition-colors cursor-default"
          style={{
            border: `1px solid ${tokens.cardBorder}`,
            borderLeft: `2px solid ${tokens.primary}`,
          }}
        >
          <p className="text-white text-sm" style={{ overflowWrap: 'anywhere', wordBreak: 'break-all' }}>{point}</p>
        </div>
      ))}
    </div>
  );
}
