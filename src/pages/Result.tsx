import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Sparkles, RefreshCw, Home as HomeIcon, Copy, Check, Quote, Lightbulb, Target,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import RingProgress from '../components/RingProgress'
import { db } from '../db'
import type { EssayRecord, SentenceFeedback } from '../types'

const DIM_LABEL: Record<keyof EssayRecord['result']['dimension_scores'], { label: string; max: number }> = {
  content:   { label: '内容', max: 5 },
  language:  { label: '语言', max: 5 },
  structure: { label: '结构', max: 3 },
  writing:   { label: '书写', max: 2 },
}

const TYPE_STYLE: Record<SentenceFeedback['type'], { label: string; cls: string }> = {
  grammar:    { label: '语法', cls: 'bg-rose-50 text-rose-600 ring-rose-100' },
  word:       { label: '用词', cls: 'bg-amber-50 text-amber-700 ring-amber-100' },
  expression: { label: '表达', cls: 'bg-violet-50 text-violet-700 ring-violet-100' },
  none:       { label: '其他', cls: 'bg-gray-50 text-gray-500 ring-gray-100' },
}

export default function Result() {
  const { essayId } = useParams()
  const navigate = useNavigate()
  const [record, setRecord] = useState<EssayRecord | null | undefined>(undefined)

  useEffect(() => {
    const id = Number(essayId)
    if (!Number.isFinite(id)) {
      setRecord(null)
      return
    }
    db.essays.get(id).then((r) => setRecord(r ?? null)).catch(() => setRecord(null))
  }, [essayId])

  if (record === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-gray-400">
        <Sparkles className="mr-2 h-4 w-4 animate-pulse" /> 加载中…
      </div>
    )
  }
  if (record === null) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="text-sm text-gray-500">未找到该批改记录</div>
        <Link to="/" className="text-sm font-medium text-primary-700">返回首页</Link>
      </div>
    )
  }

  const { result } = record

  return (
    <div className="px-4 pt-3 pb-6">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="-ml-1 inline-flex items-center gap-1 p-1 text-gray-600 active:text-gray-800"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm">返回</span>
        </button>
        <span className="truncate text-xs text-gray-400">
          {new Date(record.createdAt).toLocaleString('zh-CN', { hour12: false })}
        </span>
      </div>

      <section className="flex items-center gap-5 rounded-2xl bg-white p-5 ring-1 ring-gray-100">
        <RingProgress score={result.total_score} max={15} />
        <div className="min-w-0 flex-1">
          <div className="text-xs text-gray-500">{record.topic}</div>
          <div className="mt-1 text-base font-semibold text-gray-900">
            {scoreVerdict(result.total_score)}
          </div>
          <div className="mt-1 text-xs text-gray-500">中考 15 分制 · {targetLevelText(result.total_score)}</div>
        </div>
      </section>

      <section className="mt-3 rounded-2xl bg-white p-4 ring-1 ring-gray-100">
        <div className="mb-2 text-sm font-medium text-gray-900">分项评分</div>
        <div className="space-y-2.5">
          {(Object.keys(DIM_LABEL) as (keyof typeof DIM_LABEL)[]).map((k) => (
            <DimensionBar
              key={k}
              label={DIM_LABEL[k].label}
              value={result.dimension_scores[k]}
              max={DIM_LABEL[k].max}
            />
          ))}
        </div>
      </section>

      <SectionCard title="整体评语" icon={<Quote className="h-4 w-4" />}>
        <div className="markdown-body text-[13px] leading-relaxed text-gray-700">
          <ReactMarkdown>{result.overall_comment}</ReactMarkdown>
        </div>
      </SectionCard>

      {result.sentence_feedback.length > 0 && (
        <SectionCard title={`逐句批注（${result.sentence_feedback.length}）`} icon={<Sparkles className="h-4 w-4" />}>
          <ul className="space-y-3">
            {result.sentence_feedback.map((f, i) => (
              <li key={i} className="rounded-xl bg-gray-50 p-3">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${TYPE_STYLE[f.type].cls}`}>
                    {TYPE_STYLE[f.type].label}
                  </span>
                  <span className="text-[10px] text-gray-400">#{i + 1}</span>
                </div>
                <div className="text-[13px] leading-relaxed text-gray-900">{f.original}</div>
                {f.issue && <div className="mt-1 text-[12px] leading-relaxed text-rose-600">问题：{f.issue}</div>}
                {f.suggestion && (
                  <div className="mt-1 text-[12px] leading-relaxed text-emerald-700">建议：{f.suggestion}</div>
                )}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {result.highlights.length > 0 && (
        <SectionCard title="亮点句" icon={<Lightbulb className="h-4 w-4" />}>
          <ul className="space-y-2">
            {result.highlights.map((h, i) => (
              <li
                key={i}
                className="rounded-xl border-l-4 border-emerald-400 bg-emerald-50 px-3 py-2 text-[13px] leading-relaxed text-emerald-900"
              >
                {h}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      <SectionCard
        title="高分改写示范"
        icon={<RefreshCw className="h-4 w-4" />}
        right={<CopyButton text={result.rewrite} />}
      >
        <div className="whitespace-pre-line rounded-xl bg-gray-50 p-3 text-[13px] leading-relaxed text-gray-800">
          {result.rewrite}
        </div>
      </SectionCard>

      {result.key_improvements.length > 0 && (
        <SectionCard title="重点改进方向" icon={<Target className="h-4 w-4" />}>
          <ol className="list-decimal space-y-1.5 pl-5 text-[13px] leading-relaxed text-gray-700">
            {result.key_improvements.map((k, i) => (
              <li key={i}>{k}</li>
            ))}
          </ol>
        </SectionCard>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => navigate(`/writing${record.topicId ? '/' + record.topicId : ''}`)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary-600 bg-white px-4 py-3 text-sm font-medium text-primary-700 active:bg-primary-50"
        >
          <RefreshCw className="h-4 w-4" />
          再写一次
        </button>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-medium text-white shadow-sm active:bg-primary-800"
        >
          <HomeIcon className="h-4 w-4" />
          返回首页
        </button>
      </div>
    </div>
  )
}

function DimensionBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.max(0, Math.min(1, value / max))
  const color = pct >= 0.85 ? 'bg-emerald-500' : pct >= 0.6 ? 'bg-blue-500' : pct >= 0.4 ? 'bg-amber-500' : 'bg-rose-500'
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">
          {value}<span className="text-gray-400"> / {max}</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${color} transition-[width] duration-500`} style={{ width: `${pct * 100}%` }} />
      </div>
    </div>
  )
}

function SectionCard({
  title, icon, right, children,
}: { title: string; icon?: React.ReactNode; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-3 rounded-2xl bg-white p-4 ring-1 ring-gray-100">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
          {icon && <span className="text-primary-600">{icon}</span>}
          {title}
        </div>
        {right}
      </div>
      {children}
    </section>
  )
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  const handle = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setDone(true)
      window.setTimeout(() => setDone(false), 1500)
    } catch {
      // 用户拒绝剪贴板权限，回退到不提示
    }
  }
  return (
    <button
      type="button"
      onClick={handle}
      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-primary-700 active:bg-primary-50"
    >
      {done ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {done ? '已复制' : '复制'}
    </button>
  )
}

function scoreVerdict(s: number): string {
  if (s >= 13) return '优秀，接近满分作文 🎉'
  if (s >= 10) return '良好，继续加油'
  if (s >= 7) return '及格，仍有进步空间'
  return '需要加强练习'
}

function targetLevelText(s: number): string {
  if (s >= 13) return '13–15 优秀档'
  if (s >= 10) return '10–12 良好档'
  if (s >= 7) return '7–9 及格档'
  return '低于及格线'
}
