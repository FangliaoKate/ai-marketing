'use client';

import { DECISION_TAG_META } from '../lib/tagDerivation';

interface AIDecisionManifestProps {
  activeTagSet: Set<string>;
}

export default function AIDecisionManifest({ activeTagSet }: AIDecisionManifestProps) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ backgroundColor: '#0D1117', border: '1px solid #1f2937' }}
    >
      {/* Panel header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full bg-indigo-400" />
        <span className="text-xs font-medium text-gray-400">AI 决策解读</span>
      </div>

      {/* Tag grid */}
      <div className="flex flex-wrap gap-2">
        {DECISION_TAG_META.map((tag) => {
          const isActive = activeTagSet.has(tag.id);
          return (
            <span
              key={tag.id}
              className={[
                'px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-300',
                isActive
                  ? tag.activeClass
                  : 'opacity-[0.35] bg-gray-700 text-gray-400',
              ].join(' ')}
            >
              {tag.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
