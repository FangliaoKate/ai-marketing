'use client';

import type { AtomicComponentProps } from './types';

export default function CampaignInfo({ config, tokens }: AtomicComponentProps) {
  return (
    <div className="px-8 py-4 w-full overflow-hidden">
      <h1
        className="text-2xl font-bold text-white leading-tight"
        style={{ overflowWrap: 'anywhere', wordBreak: 'break-all' }}
      >
        {config.title}
      </h1>
      <p
        className="text-sm mt-1"
        style={{ color: tokens.primary, overflowWrap: 'anywhere', wordBreak: 'break-all' }}
      >
        {config.subtitle}
      </p>
    </div>
  );
}
