import type { DemoConfig, ThemeTokens } from '../../config';
import type { ComponentSettings } from '../../lib/atomicLayout';

export interface AtomicComponentProps {
  config: DemoConfig;
  tokens: ThemeTokens;
  settings: ComponentSettings;
  isFormSubmitted?: boolean;
  onSubmitSuccess?: () => void;
}
