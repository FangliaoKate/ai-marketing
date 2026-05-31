'use client';

import { CarModelId, CarModelMeta, THEME_MAP } from '../config';

interface ModelSelectorProps {
  models: CarModelMeta[];
  selectedId: CarModelId;
  onChange: (id: CarModelId) => void;
  disabled: boolean;
}

export default function ModelSelector({
  models,
  selectedId,
  onChange,
  disabled,
}: ModelSelectorProps) {
  return (
    <div
      className={`flex flex-row gap-2 flex-wrap${disabled ? ' opacity-50 pointer-events-none' : ''}`}
      role="tablist"
      aria-label="车型选择"
    >
      {models.map((model) => {
        const isSelected = model.id === selectedId;
        const primaryColor = THEME_MAP[model.theme].primary;

        return (
          <button
            key={model.id}
            role="tab"
            aria-selected={isSelected}
            aria-label={model.displayName}
            onClick={() => onChange(model.id)}
            style={
              isSelected
                ? {
                    borderColor: primaryColor,
                    color: primaryColor,
                    backgroundColor: `${primaryColor}1A`, // ~10% opacity tint
                  }
                : undefined
            }
            className={[
              'px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap',
              isSelected
                ? 'border-current'
                : 'border-[#2A2A2A] text-gray-400 bg-transparent hover:border-gray-500 hover:text-gray-300',
            ].join(' ')}
          >
            {model.displayName}
          </button>
        );
      })}
    </div>
  );
}
