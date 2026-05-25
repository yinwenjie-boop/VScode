import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ApiConfig, Provider } from '../types'

export const PROVIDER_PRESETS: Record<Provider, { label: string; baseUrl: string; model: string }> = {
  deepseek: { label: 'DeepSeek', baseUrl: 'https://api.deepseek.com', model: 'deepseek-v4-pro' },
  claude:   { label: 'Claude',   baseUrl: 'https://api.anthropic.com/v1', model: 'claude-3-5-sonnet-20241022' },
  openai:   { label: 'OpenAI',   baseUrl: 'https://api.openai.com/v1',    model: 'gpt-4o-mini' },
  kimi:     { label: 'Kimi (Moonshot)', baseUrl: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
  qwen:     { label: '通义千问', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-turbo' },
  custom:   { label: '自定义',   baseUrl: '', model: '' },
}

const DEFAULT_CONFIG: ApiConfig = {
  provider: 'deepseek',
  baseUrl: PROVIDER_PRESETS.deepseek.baseUrl,
  apiKey: '',
  model: PROVIDER_PRESETS.deepseek.model,
  targetLevel: 'good',
}

interface ConfigState {
  config: ApiConfig
  setConfig: (patch: Partial<ApiConfig>) => void
  applyProviderPreset: (provider: Provider) => void
  reset: () => void
  isConfigured: () => boolean
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      config: DEFAULT_CONFIG,
      setConfig: (patch) => set({ config: { ...get().config, ...patch } }),
      applyProviderPreset: (provider) => {
        const preset = PROVIDER_PRESETS[provider]
        const current = get().config
        set({
          config: {
            ...current,
            provider,
            baseUrl: preset.baseUrl || current.baseUrl,
            model: preset.model || current.model,
          },
        })
      },
      reset: () => set({ config: DEFAULT_CONFIG }),
      isConfigured: () => {
        const c = get().config
        return !!(c.baseUrl.trim() && c.apiKey.trim() && c.model.trim())
      },
    }),
    { name: 'essay-app-config' }
  )
)
