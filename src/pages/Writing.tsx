import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Sparkles, Loader2, AlertCircle, Wand2 } from 'lucide-react'
import Collapsible from '../components/Collapsible'
import { findTopic } from '../data/topics'
import { useConfigStore } from '../store/configStore'
import { gradeEssay, generateTopic, ApiError, type GeneratedTopic } from '../services/api'
import { db } from '../db'

const WORD_MIN = 80
const WORD_MAX = 100

function countWords(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length
}

export default function Writing() {
  const { topicId } = useParams()
  const navigate = useNavigate()
  const config = useConfigStore((s) => s.config)
  const isConfigured = useConfigStore((s) => s.isConfigured)

  const topic = useMemo(() => (topicId ? findTopic(topicId) : undefined), [topicId])
  const draftKey = `essay-draft:${topicId ?? 'custom'}`

  const [title, setTitle] = useState(topic?.englishTitle ?? '')
  const [requirements, setRequirements] = useState(topic?.requirements ?? '')
  const [essay, setEssay] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState<string | null>(null)
  // AI 生成题目（仅在自定义模式下使用）
  const [genTopic, setGenTopic] = useState<GeneratedTopic | null>(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (!submitting) {
      setElapsed(0)
      return
    }
    const start = Date.now()
    const id = window.setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 500)
    return () => window.clearInterval(id)
  }, [submitting])

  // 进入时加载草稿（仅在 essay 仍为空时覆盖，避免和预填的 title/requirements 冲突时丢内容）
  useEffect(() => {
    const saved = localStorage.getItem(draftKey)
    if (!saved) return
    try {
      const obj = JSON.parse(saved) as Partial<{ title: string; requirements: string; essay: string }>
      if (obj.title) setTitle(obj.title)
      if (obj.requirements) setRequirements(obj.requirements)
      if (obj.essay) setEssay(obj.essay)
    } catch {
      // ignore corrupt draft
    }
  }, [draftKey])

  // 防抖写入草稿
  useEffect(() => {
    const t = window.setTimeout(() => {
      localStorage.setItem(draftKey, JSON.stringify({ title, requirements, essay }))
    }, 500)
    return () => window.clearTimeout(t)
  }, [draftKey, title, requirements, essay])

  const words = countWords(essay)
  const wordOk = words >= WORD_MIN && words <= WORD_MAX
  const wordTooShort = words < WORD_MIN
  const wordColor = wordOk ? 'text-primary-600' : wordTooShort ? 'text-gray-500' : 'text-amber-600'

  const handleGenerate = async () => {
    setError(null)
    if (!isConfigured()) {
      setError('请先到「设置」页配置 API（Base URL / Key / 模型）')
      return
    }
    setGenerating(true)
    try {
      const t = await generateTopic(config)
      setGenTopic(t)
      setTitle(t.englishTitle)
      setRequirements(t.requirements)
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message)
      } else {
        setError(e instanceof Error ? e.message : String(e))
      }
    } finally {
      setGenerating(false)
    }
  }

  const handleSubmit = async () => {
    setError(null)
    if (!isConfigured()) {
      setError('请先到「设置」页配置 API（Base URL / Key / 模型）')
      return
    }
    if (!title.trim()) {
      setError('请填写作文题目')
      return
    }
    if (words < 20) {
      setError(`作文太短（仅 ${words} 词），至少写 20 词再提交批改`)
      return
    }
    setSubmitting(true)
    try {
      const result = await gradeEssay(config, {
        topic: title.trim(),
        requirements: requirements.trim(),
        studentEssay: essay.trim(),
      })
      const id = await db.essays.add({
        topicId,
        topic: title.trim(),
        requirements: requirements.trim(),
        content: essay.trim(),
        result,
        createdAt: Date.now(),
      })
      localStorage.removeItem(draftKey)
      navigate(`/result/${id}`, { replace: true })
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message)
      } else {
        setError(e instanceof Error ? e.message : String(e))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="px-4 pt-3 pb-32">
      <div className="mb-2 flex items-center justify-between">
        <Link to="/" className="-ml-1 inline-flex items-center gap-1 p-1 text-gray-600 active:text-gray-800">
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm">返回</span>
        </Link>
        <span className="text-xs text-gray-400">草稿自动保存</span>
      </div>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-gray-100">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-medium text-gray-500">作文题目</label>
          {!topic && (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating || submitting}
              className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-medium text-primary-700 ring-1 ring-primary-100 active:bg-primary-100 disabled:opacity-60"
            >
              {generating ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  生成中…
                </>
              ) : (
                <>
                  <Wand2 className="h-3 w-3" />
                  AI 生成题目
                </>
              )}
            </button>
          )}
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={submitting}
          placeholder="如 My Best Friend"
          className="mt-1 w-full border-0 border-b border-gray-200 bg-transparent px-0 py-2 text-base font-medium text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-0 disabled:opacity-60"
        />
        <label className="mt-3 block text-xs font-medium text-gray-500">题目要求</label>
        <textarea
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
          disabled={submitting}
          placeholder={topic ? '可选。粘贴试卷上的题目要求（中英文均可）。' : '可手写题目要求，或点击右上角「AI 生成题目」按江苏中考高频考点自动生成。'}
          rows={3}
          className="mt-1 w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200 disabled:opacity-60"
        />
        {!topic && genTopic && (
          <div className="mt-2 text-[11px] text-primary-700">
            AI 已按江苏中考高频考点生成题目：<span className="font-medium">{genTopic.title}</span>
          </div>
        )}
      </section>

      {topic && (
        <div className="mt-3">
          <Collapsible
            title="写作引导"
            defaultOpen
            rightSlot={<span className="text-[10px] text-primary-700">{topic.frequency}</span>}
          >
            <GuideBlock label="审题" content={topic.guidance.analysis} />
            <GuideBlock label="思路框架" content={topic.guidance.structure} />
            <GuideBlock label="推荐词汇 / 句型" content={topic.guidance.vocabulary} mono />
          </Collapsible>
        </div>
      )}

      {!topic && genTopic && (
        <div className="mt-3">
          <Collapsible
            title="写作引导（AI 生成）"
            defaultOpen
            rightSlot={<span className="text-[10px] text-primary-700">江苏高频</span>}
          >
            <GuideBlock label="审题" content={genTopic.guidance.analysis} />
            <GuideBlock label="思路框架" content={genTopic.guidance.structure} />
            <GuideBlock label="推荐词汇 / 句型" content={genTopic.guidance.vocabulary} mono />
          </Collapsible>
        </div>
      )}

      <section className="mt-3 rounded-2xl bg-white p-4 ring-1 ring-gray-100">
        <label className="block text-xs font-medium text-gray-500">作文正文</label>
        <textarea
          value={essay}
          onChange={(e) => setEssay(e.target.value)}
          disabled={submitting}
          placeholder={'开始写吧…\n建议 80–100 词，分 3 段。'}
          rows={14}
          className="mt-1 w-full resize-y border-0 bg-transparent px-0 py-2 text-[15px] leading-relaxed text-gray-900 focus:outline-none focus:ring-0 disabled:opacity-60"
          autoCapitalize="sentences"
          spellCheck
        />
      </section>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="break-words">{error}</div>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-16 z-20 mx-auto max-w-md border-t border-gray-100 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex-1 text-xs">
            {submitting ? (
              <>
                <div className="font-medium text-primary-700">AI 正在批改…</div>
                <div className="text-[11px] text-gray-400">已用 {elapsed} 秒，请稍候（通常 5–20 秒）</div>
              </>
            ) : (
              <>
                <div className={`font-medium ${wordColor}`}>
                  {words} 词
                  <span className="ml-1 text-gray-400">/ {WORD_MIN}–{WORD_MAX}</span>
                </div>
                <div className="text-[11px] text-gray-400">
                  {wordOk ? '字数合适，可以提交' : wordTooShort ? '继续加油' : '稍稍超出，可以精简'}
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition-colors active:bg-primary-800 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                批改中
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                AI 批改
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function GuideBlock({ label, content, mono = false }: { label: string; content: string; mono?: boolean }) {
  return (
    <div className="mt-2 first:mt-0">
      <div className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</div>
      <p
        className={`mt-1 whitespace-pre-line text-sm leading-relaxed text-gray-700 ${
          mono ? 'font-mono text-[13px]' : ''
        }`}
      >
        {content}
      </p>
    </div>
  )
}
