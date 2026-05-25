import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  AlertCircle,
  Wand2,
  Camera,
  Mic,
  MicOff,
  X,
} from 'lucide-react'
import Collapsible from '../components/Collapsible'
import { findTopic } from '../data/topics'
import { useConfigStore } from '../store/configStore'
import { gradeEssay, generateTopic, ApiError, type GeneratedTopic } from '../services/api'
import { recognizeImage, type OcrProgress } from '../services/ocr'
import {
  startListening,
  ensurePermission as ensureSpeechPermission,
  isAvailable as isSpeechAvailable,
  type SpeechHandle,
} from '../services/speech'
import { db } from '../db'

const WORD_MIN = 80
const WORD_MAX = 100
const GRADE_TIMEOUT_MS = 60_000

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
  const [timeoutOpen, setTimeoutOpen] = useState(false)
  // AI 生成题目（仅在自定义模式下使用）
  const [genTopic, setGenTopic] = useState<GeneratedTopic | null>(null)
  const [generating, setGenerating] = useState(false)

  // OCR 拍照
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [ocrBusy, setOcrBusy] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrPreview, setOcrPreview] = useState<string | null>(null)

  // 语音识别
  const [listening, setListening] = useState(false)
  const [partialText, setPartialText] = useState('')
  const speechRef = useRef<SpeechHandle | null>(null)

  // 题目要求 textarea 自动伸高
  const reqRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const el = reqRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 240) + 'px'
  }, [requirements])

  // 批改计时 + 60s 超时
  useEffect(() => {
    if (!submitting) {
      setElapsed(0)
      return
    }
    const start = Date.now()
    const id = window.setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 500)
    return () => window.clearInterval(id)
  }, [submitting])

  // 进入时加载草稿
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

  // 卸载时停止语音
  useEffect(() => {
    return () => {
      if (speechRef.current) {
        speechRef.current.stop().catch(() => {})
        speechRef.current = null
      }
    }
  }, [])

  const words = countWords(essay)
  const wordOk = words >= WORD_MIN && words <= WORD_MAX
  const wordTooShort = words < WORD_MIN
  const wordColor = wordOk ? 'text-primary-600' : wordTooShort ? 'text-gray-500' : 'text-amber-600'

  // 提交批改时锁定整个页面（除了取消按钮）
  const locked = submitting

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
    // 提交前先关掉语音（避免后台占麦克风）
    if (speechRef.current) {
      await speechRef.current.stop().catch(() => {})
      speechRef.current = null
      setListening(false)
      setPartialText('')
    }
    setSubmitting(true)

    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), GRADE_TIMEOUT_MS)

    try {
      const result = await gradeEssay(
        config,
        {
          topic: title.trim(),
          requirements: requirements.trim(),
          studentEssay: essay.trim(),
        },
        controller.signal,
      )
      window.clearTimeout(timer)
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
      window.clearTimeout(timer)
      if (controller.signal.aborted) {
        setTimeoutOpen(true)
      } else if (e instanceof ApiError) {
        setError(e.message)
      } else {
        setError(e instanceof Error ? e.message : String(e))
      }
    } finally {
      setSubmitting(false)
    }
  }

  // ============ 拍照 OCR ============
  const handlePickPhoto = () => {
    if (locked || ocrBusy) return
    fileInputRef.current?.click()
  }

  const handlePhotoChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError(null)
    setOcrBusy(true)
    setOcrProgress(0)
    try {
      const text = await recognizeImage(file, (p: OcrProgress) => {
        if (p.status === 'recognizing text') setOcrProgress(Math.round(p.progress * 100))
      })
      if (!text) {
        setError('图片识别为空，换一张更清晰的图片再试')
      } else {
        setOcrPreview(text)
      }
    } catch (err) {
      setError('OCR 识别失败：' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setOcrBusy(false)
      setOcrProgress(0)
    }
  }

  const insertOcrText = (text: string) => {
    setEssay((prev) => {
      const sep = prev && !prev.endsWith('\n') ? '\n' : ''
      return prev + sep + text
    })
    setOcrPreview(null)
  }

  // ============ 语音输入 ============
  const handleToggleMic = async () => {
    if (locked || ocrBusy) return
    if (listening) {
      const handle = speechRef.current
      speechRef.current = null
      setListening(false)
      setPartialText('')
      if (handle) await handle.stop().catch(() => {})
      return
    }
    setError(null)
    try {
      const avail = await isSpeechAvailable()
      if (!avail) {
        setError('当前设备不支持语音识别（请安装/启用 Google 语音服务或换用其他输入法）')
        return
      }
      const ok = await ensureSpeechPermission()
      if (!ok) {
        setError('未授权麦克风权限，无法语音输入')
        return
      }
      setListening(true)
      const handle = await startListening((text, isFinal) => {
        if (isFinal) {
          setEssay((prev) => {
            const sep = prev && !prev.endsWith(' ') && !prev.endsWith('\n') ? ' ' : ''
            return prev + sep + text
          })
          setPartialText('')
        } else {
          setPartialText(text)
        }
      })
      speechRef.current = handle
    } catch (err) {
      setListening(false)
      setError('启动语音识别失败：' + (err instanceof Error ? err.message : String(err)))
    }
  }

  return (
    <div className="px-4 pt-3 pb-32">
      <div className="mb-2 flex items-center justify-between">
        <Link
          to="/"
          className={`-ml-1 inline-flex items-center gap-1 p-1 text-gray-600 active:text-gray-800 ${
            locked ? 'pointer-events-none opacity-40' : ''
          }`}
        >
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
              disabled={generating || locked}
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
          disabled={locked}
          placeholder="如 My Best Friend"
          className="mt-1 w-full border-0 border-b border-gray-200 bg-transparent px-0 py-2 text-base font-medium text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-0 disabled:opacity-60"
        />
        <label className="mt-3 block text-xs font-medium text-gray-500">题目要求</label>
        <textarea
          ref={reqRef}
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
          disabled={locked}
          placeholder={topic ? '可选。粘贴试卷上的题目要求（中英文均可）。' : '可手写题目要求，或点击右上角「AI 生成题目」按江苏中考高频考点自动生成。'}
          rows={2}
          style={{ maxHeight: '240px' }}
          className="mt-1 w-full resize-none overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm leading-relaxed text-gray-700 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200 disabled:opacity-60"
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
        <div className="flex items-center justify-between">
          <label className="block text-xs font-medium text-gray-500">作文正文</label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePickPhoto}
              disabled={locked || ocrBusy || listening}
              className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-700 ring-1 ring-gray-200 active:bg-gray-100 disabled:opacity-50"
              aria-label="拍照识别"
            >
              {ocrBusy ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  识别中 {ocrProgress}%
                </>
              ) : (
                <>
                  <Camera className="h-3 w-3" />
                  拍照
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleToggleMic}
              disabled={locked || ocrBusy}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 active:opacity-80 disabled:opacity-50 ${
                listening
                  ? 'bg-red-50 text-red-700 ring-red-200'
                  : 'bg-gray-50 text-gray-700 ring-gray-200'
              }`}
              aria-label={listening ? '停止语音' : '语音输入'}
            >
              {listening ? (
                <>
                  <MicOff className="h-3 w-3" />
                  停止
                </>
              ) : (
                <>
                  <Mic className="h-3 w-3" />
                  语音
                </>
              )}
            </button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handlePhotoChange}
        />
        <textarea
          value={essay}
          onChange={(e) => setEssay(e.target.value)}
          disabled={locked}
          placeholder={'开始写吧…\n建议 80–100 词，分 3 段。'}
          rows={14}
          className="mt-1 w-full resize-y border-0 bg-transparent px-0 py-2 text-[15px] leading-relaxed text-gray-900 focus:outline-none focus:ring-0 disabled:opacity-60"
          autoCapitalize="sentences"
          spellCheck
        />
        {listening && (
          <div className="mt-1 rounded-lg border border-red-100 bg-red-50/60 px-2 py-1 text-[12px] text-red-700">
            <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-500 align-middle"></span>
            正在听… {partialText && <span className="italic text-red-800/80">{partialText}</span>}
          </div>
        )}
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
                <div className="text-[11px] text-gray-400">
                  已用 {elapsed} 秒（最多 {GRADE_TIMEOUT_MS / 1000} 秒，超时自动取消）
                </div>
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

      {/* 批改时的全屏遮罩 —— 锁定误触 */}
      {submitting && (
        <div
          className="fixed inset-0 z-30 bg-black/5"
          // 拦截点击 / 触摸事件，避免冒泡到下层按钮
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          aria-hidden="true"
        />
      )}

      {/* OCR 预览插入对话框 */}
      {ocrPreview !== null && (
        <Modal title="识别结果（可编辑后插入）" onClose={() => setOcrPreview(null)}>
          <p className="text-[11px] text-gray-500">
            手写识别结果仅供参考，建议核对后再插入；将追加到正文末尾。
          </p>
          <textarea
            value={ocrPreview}
            onChange={(e) => setOcrPreview(e.target.value)}
            rows={8}
            className="mt-2 w-full resize-y rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm leading-relaxed text-gray-800 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setOcrPreview(null)}
              className="rounded-lg px-3 py-1.5 text-sm text-gray-600 active:bg-gray-100"
            >
              取消
            </button>
            <button
              type="button"
              onClick={() => insertOcrText(ocrPreview)}
              className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white active:bg-primary-800"
            >
              插入正文
            </button>
          </div>
        </Modal>
      )}

      {/* 批改超时对话框 */}
      {timeoutOpen && (
        <Modal title="AI 响应超时" onClose={() => setTimeoutOpen(false)}>
          <p className="text-sm text-gray-700">
            {GRADE_TIMEOUT_MS / 1000} 秒内未收到批改结果，已自动取消请求。可能是网络拥堵或模型负载较高，请稍后再试。
          </p>
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setTimeoutOpen(false)}
              className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white active:bg-primary-800"
            >
              知道了
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="mx-3 mb-3 w-full max-w-md rounded-2xl bg-white p-4 shadow-xl sm:mb-0">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-medium text-gray-900">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 active:bg-gray-100"
            aria-label="关闭"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
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
