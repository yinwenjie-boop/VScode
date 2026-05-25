import type { ApiConfig, GradeResult, SentenceFeedback } from '../types'
import { buildGradePrompt, buildTopicGenPrompt } from './prompt'

export interface GeneratedTopic {
  title: string
  englishTitle: string
  requirements: string
  guidance: {
    analysis: string
    structure: string
    vocabulary: string
  }
}

export type TestResult =
  | { ok: true; sample: string }
  | { ok: false; error: string }

export type ApiErrorKind = 'network' | 'auth' | 'endpoint' | 'http' | 'format'

export class ApiError extends Error {
  kind: ApiErrorKind
  constructor(kind: ApiErrorKind, message: string) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
  }
}

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '')
}

/**
 * 调用 OpenAI 兼容的 /chat/completions，发送一句简单消息。
 * 用于设置页"测试连接"按钮，验证 baseUrl + apiKey + model 三者搭配是否可用。
 */
export async function testConnection(config: ApiConfig): Promise<TestResult> {
  const url = `${normalizeBaseUrl(config.baseUrl)}/chat/completions`
  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: '请用中文回复"连接成功"四个字' }],
        max_tokens: 32,
        temperature: 0,
      }),
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: `网络错误：${msg}（请检查 Base URL 是否正确、是否需要代理）` }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: `认证失败（HTTP ${res.status}）：API Key 错误或权限不足` }
    }
    if (res.status === 404) {
      return { ok: false, error: `接口不存在（HTTP 404）：请检查 Base URL 和模型名是否正确` }
    }
    return { ok: false, error: `HTTP ${res.status}：${text.slice(0, 300) || '无返回内容'}` }
  }

  let data: unknown
  try {
    data = await res.json()
  } catch {
    return { ok: false, error: '返回内容不是合法 JSON，可能 Base URL 指向了非 OpenAI 兼容接口' }
  }

  const content = (data as { choices?: { message?: { content?: string } }[] })
    ?.choices?.[0]?.message?.content
  if (typeof content !== 'string') {
    return { ok: false, error: '返回结构异常：未找到 choices[0].message.content' }
  }
  return { ok: true, sample: content.trim() }
}

/**
 * 调用 LLM 批改作文。返回结构化 GradeResult。
 * 失败时抛 ApiError，调用方根据 kind 给出友好提示。
 */
export async function gradeEssay(
  config: ApiConfig,
  params: { topic: string; requirements: string; studentEssay: string },
): Promise<GradeResult> {
  const url = `${normalizeBaseUrl(config.baseUrl)}/chat/completions`
  const prompt = buildGradePrompt({
    topic: params.topic,
    requirements: params.requirements,
    studentEssay: params.studentEssay,
  })

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        // 注：部分模型/网关支持 response_format 强制 JSON，不支持的会忽略此字段。
        response_format: { type: 'json_object' },
      }),
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new ApiError('network', `网络错误：${msg}`)
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    if (res.status === 401 || res.status === 403) {
      throw new ApiError('auth', `认证失败（HTTP ${res.status}）：API Key 错误或权限不足`)
    }
    if (res.status === 404) {
      throw new ApiError('endpoint', `接口不存在（HTTP 404）：请检查 Base URL`)
    }
    throw new ApiError('http', `HTTP ${res.status}：${text.slice(0, 300) || '无返回内容'}`)
  }

  let data: unknown
  try {
    data = await res.json()
  } catch {
    throw new ApiError('format', '返回内容不是合法 JSON，可能 Base URL 不是 OpenAI 兼容接口')
  }
  const content = (data as { choices?: { message?: { content?: string } }[] })
    ?.choices?.[0]?.message?.content
  if (typeof content !== 'string') {
    throw new ApiError('format', '返回结构异常：缺少 choices[0].message.content')
  }

  const parsed = parseGradeJson(content)
  if (!parsed) throw new ApiError('format', 'AI 未按要求的 JSON 格式输出，请重试或更换模型')
  return parsed
}

/**
 * 让 LLM 命制一道江苏中考高频英语作文题。返回结构化 GeneratedTopic。
 * 失败时抛 ApiError。
 */
export async function generateTopic(config: ApiConfig): Promise<GeneratedTopic> {
  const url = `${normalizeBaseUrl(config.baseUrl)}/chat/completions`
  const prompt = buildTopicGenPrompt()

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
        response_format: { type: 'json_object' },
      }),
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new ApiError('network', `网络错误：${msg}`)
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    if (res.status === 401 || res.status === 403) {
      throw new ApiError('auth', `认证失败（HTTP ${res.status}）：API Key 错误或权限不足`)
    }
    if (res.status === 404) {
      throw new ApiError('endpoint', `接口不存在（HTTP 404）：请检查 Base URL`)
    }
    throw new ApiError('http', `HTTP ${res.status}：${text.slice(0, 300) || '无返回内容'}`)
  }

  let data: unknown
  try {
    data = await res.json()
  } catch {
    throw new ApiError('format', '返回内容不是合法 JSON')
  }
  const content = (data as { choices?: { message?: { content?: string } }[] })
    ?.choices?.[0]?.message?.content
  if (typeof content !== 'string') {
    throw new ApiError('format', '返回结构异常：缺少 choices[0].message.content')
  }

  const parsed = parseGeneratedTopic(content)
  if (!parsed) throw new ApiError('format', 'AI 未按要求的 JSON 格式输出，请重试或更换模型')
  return parsed
}

function parseGeneratedTopic(raw: string): GeneratedTopic | null {
  let s = raw.trim()
  if (s.startsWith('```')) {
    s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '')
  }
  const start = s.indexOf('{')
  const end = s.lastIndexOf('}')
  if (start >= 0 && end > start) s = s.slice(start, end + 1)
  let obj: unknown
  try {
    obj = JSON.parse(s)
  } catch {
    return null
  }
  if (!obj || typeof obj !== 'object') return null
  const o = obj as Record<string, unknown>
  const g = o.guidance as Record<string, unknown> | undefined
  if (
    typeof o.title !== 'string' ||
    typeof o.englishTitle !== 'string' ||
    typeof o.requirements !== 'string' ||
    !g ||
    typeof g.analysis !== 'string' ||
    typeof g.structure !== 'string' ||
    typeof g.vocabulary !== 'string'
  ) {
    return null
  }
  return {
    title: o.title,
    englishTitle: o.englishTitle,
    requirements: o.requirements,
    guidance: {
      analysis: g.analysis,
      structure: g.structure,
      vocabulary: g.vocabulary,
    },
  }
}

function parseGradeJson(raw: string): GradeResult | null {
  let s = raw.trim()
  // 有些模型会在 JSON 外包 markdown 代码块，去掉。
  if (s.startsWith('```')) {
    s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '')
  }
  // 兜底：抠出第一个 { 到最后一个 }
  const start = s.indexOf('{')
  const end = s.lastIndexOf('}')
  if (start >= 0 && end > start) s = s.slice(start, end + 1)

  let obj: unknown
  try {
    obj = JSON.parse(s)
  } catch {
    return null
  }
  if (!obj || typeof obj !== 'object') return null
  const o = obj as Record<string, unknown>
  const ds = o.dimension_scores as Record<string, unknown> | undefined
  if (
    typeof o.total_score !== 'number' ||
    !ds ||
    typeof ds.content !== 'number' ||
    typeof ds.language !== 'number' ||
    typeof ds.structure !== 'number' ||
    typeof ds.writing !== 'number' ||
    !Array.isArray(o.sentence_feedback) ||
    typeof o.overall_comment !== 'string' ||
    typeof o.rewrite !== 'string' ||
    !Array.isArray(o.highlights) ||
    !Array.isArray(o.key_improvements)
  ) {
    return null
  }
  // 进一步过滤 sentence_feedback 字段结构
  const sf: SentenceFeedback[] = (o.sentence_feedback as unknown[])
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .map((x) => ({
      original: String(x.original ?? ''),
      issue: String(x.issue ?? ''),
      suggestion: String(x.suggestion ?? ''),
      type: (['grammar', 'word', 'expression', 'none'].includes(String(x.type))
        ? x.type
        : 'none') as SentenceFeedback['type'],
    }))

  return {
    total_score: o.total_score,
    dimension_scores: {
      content: ds.content,
      language: ds.language,
      structure: ds.structure,
      writing: ds.writing,
    },
    sentence_feedback: sf,
    overall_comment: o.overall_comment,
    rewrite: o.rewrite,
    highlights: (o.highlights as unknown[]).map(String),
    key_improvements: (o.key_improvements as unknown[]).map(String),
  }
}
