'use client';

import React from 'react';
import type { ComponentId } from '@/app/lib/atomicLayout';
import type { AtomicComponentProps } from './types';
import BrandHeader from './BrandHeader';
import CarStage from './CarStage';
import CampaignInfo from './CampaignInfo';
import SellingPoints from './SellingPoints';
import SpinWheel from '../SpinWheel';   // reused as-is
import LeadForm from '../LeadForm';     // reused as-is

// Thin adapter: maps AtomicComponentProps → SpinWheelProps
function SpinWheelAdapter({ config, tokens, isFormSubmitted }: AtomicComponentProps) {
  return (
    <SpinWheel
      prizes={config.prizes}
      isFormSubmitted={isFormSubmitted ?? false}
      themeTokens={tokens}
    />
  );
}

// Thin adapter: maps AtomicComponentProps → LeadFormProps
function LeadFormAdapter({ tokens, onSubmitSuccess }: AtomicComponentProps) {
  return (
    <LeadForm
      onSubmitSuccess={onSubmitSuccess ?? (() => {})}
      themeTokens={tokens}
    />
  );
}

export const ATOMIC_COMPONENT_MAP: Record<
  ComponentId,
  React.ComponentType<AtomicComponentProps>
> = {
  brand_header: BrandHeader,
  car_stage: CarStage,
  campaign_info: CampaignInfo,
  selling_points: SellingPoints,
  lucky_wheel: SpinWheelAdapter,
  lead_form: LeadFormAdapter,
};

export { BrandHeader, CarStage, CampaignInfo, SellingPoints };
export type { AtomicComponentProps } from './types';
