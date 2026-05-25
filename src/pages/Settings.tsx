import { useState } from 'react'
import { Eye, EyeOff, ShieldCheck, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { useConfigStore, PROVIDER_PRESETS } from '../store/configStore'
import { testConnection } from '../services/api'
import type { Provider } from '../types'

const PROVIDERS: Provider[] = ['deepseek', 'claude', 'openai', 'kimi', 'qwen', 'custom']

const DEEPSEEK_MODEL_PRESETS = ['deepseek-v4-pro', 'deepseek-v4-flash'] as const
const CUSTOM_MODEL_SENTINEL = '__custom__'

type TestState =
  | { kind: 'idle' }
  | { kind: 'running' }
  | { kind: 'ok'; sample: string }
  | { kind: 'error'; error: string }

export default function Settings() {
  const config = useConfigStore((s) => s.config)
  const setConfig = useConfigStore((s) => s.setConfig)
  const applyProviderPreset = useConfigStore((s) => s.applyProviderPreset)

  const [showKey, setShowKey] = useState(false)
  const [test, setTest] = useState<TestState>({ kind: 'idle' })
  const [savedFlash, setSavedFlash] = useState(false)

  const handleTest = async () => {
    if (!config.baseUrl.trim() || !config.apiKey.trim() || !config.model.trim()) {
      setTest({ kind: 'error', error: '请先填写 Base URL、API Key、模型名称' })
      return
    }
    setTest({ kind: 'running' })
    const r = await testConnection(config)
    if (r.ok) setTest({ kind: 'ok', sample: r.sample })
    else setTest({ kind: 'error', error: r.error })
  }

  const handleSave = () => {
    // zustand persist 已经实时写入 localStorage，这里只是给用户一个明确反馈
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1500)
  }

  return (
    <div className="px-4 pt-4 pb-6">
      <h1 className="text-xl font-semibold text-gray-900">设置</h1>

      <div className="mt-3 flex items-start gap-2 rounded-xl border border-primary-200 bg-primary-50 p-3 text-sm text-primary-800">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <div className="font-medium">隐私说明</div>
          <div className="mt-0.5 text-primary-700/90 leading-relaxed">
            API Key 仅保存在你这台设备的浏览器（localStorage）中，不会上传任何服务器。本应用为纯前端 PWA。
          </div>
        </div>
      </div>

      <section className="mt-4 space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <Field label="服务商预设">
          <select
            value={config.provider}
            onChange={(e) => applyProviderPreset(e.target.value as Provider)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
          >
            {PROVIDERS.map((p) => (
              <option key={p} value={p}>{PROVIDER_PRESETS[p].label}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">选择后会自动填充推荐的 Base URL 和模型名，可再手动调整。</p>
        </Field>

        <Field label="API Base URL">
          <input
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            value={config.baseUrl}
            onChange={(e) => setConfig({ baseUrl: e.target.value })}
            placeholder="https://api.deepseek.com/v1"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </Field>

        <Field label="API Key">
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              autoComplete="off"
              spellCheck={false}
              value={config.apiKey}
              onChange={(e) => setConfig({ apiKey: e.target.value })}
              placeholder="sk-..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-10 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
              aria-label={showKey ? '隐藏 API Key' : '显示 API Key'}
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        <Field label="模型名称">
          {config.provider === 'deepseek' ? (
            (() => {
              const isCustom = !DEEPSEEK_MODEL_PRESETS.includes(
                config.model as typeof DEEPSEEK_MODEL_PRESETS[number],
              )
              return (
                <>
                  <select
                    value={isCustom ? CUSTOM_MODEL_SENTINEL : config.model}
                    onChange={(e) => {
                      const v = e.target.value
                      setConfig({ model: v === CUSTOM_MODEL_SENTINEL ? '' : v })
                    }}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  >
                    {DEEPSEEK_MODEL_PRESETS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                    <option value={CUSTOM_MODEL_SENTINEL}>自定义</option>
                  </select>
                  {isCustom && (
                    <input
                      type="text"
                      autoComplete="off"
                      spellCheck={false}
                      value={config.model}
                      onChange={(e) => setConfig({ model: e.target.value })}
                      placeholder="输入自定义模型名"
                      className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                  )}
                </>
              )
            })()
          ) : (
            <input
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={config.model}
              onChange={(e) => setConfig({ model: e.target.value })}
              placeholder="gpt-4o-mini / claude-3-5-sonnet / ..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          )}
        </Field>
      </section>

      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={handleTest}
          disabled={test.kind === 'running'}
          className="flex-1 rounded-xl border border-primary-600 bg-white px-4 py-3 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50 active:bg-primary-100 disabled:opacity-60"
        >
          {test.kind === 'running' ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> 测试中…
            </span>
          ) : (
            '测试连接'
          )}
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 rounded-xl bg-primary-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 active:bg-primary-800"
        >
          {savedFlash ? '已保存 ✓' : '保存'}
        </button>
      </div>

      {test.kind === 'ok' && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <div className="font-medium">连接成功</div>
            <div className="mt-0.5 break-words text-green-700/90">模型回复：{test.sample}</div>
          </div>
        </div>
      )}
      {test.kind === 'error' && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <div className="font-medium">连接失败</div>
            <div className="mt-0.5 break-words text-red-700/90">{test.error}</div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-900">{label}</label>
      {children}
    </div>
  )
}
