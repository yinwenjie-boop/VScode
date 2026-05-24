import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, ChevronRight, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { db } from '../db'
import type { EssayRecord } from '../types'
import { TOPICS } from '../data/topics'

const ALL = '__all__'
const CUSTOM = '__custom__'

export default function History() {
  const [essays, setEssays] = useState<EssayRecord[] | null>(null)
  const [filter, setFilter] = useState<string>(ALL)

  useEffect(() => {
    db.essays
      .toArray()
      .then((arr) => setEssays(arr.sort((a, b) => b.createdAt - a.createdAt)))
      .catch(() => setEssays([]))
  }, [])

  // 同话题前后两次分差（按时间正序计算，存到 id → delta 的 map 上）
  const deltaById = useMemo(() => {
    const m = new Map<number, number>()
    if (!essays) return m
    const groups = new Map<string, EssayRecord[]>()
    for (const e of essays) {
      const key = e.topicId ?? CUSTOM
      const list = groups.get(key) ?? []
      list.push(e)
      groups.set(key, list)
    }
    for (const list of groups.values()) {
      const asc = [...list].sort((a, b) => a.createdAt - b.createdAt)
      for (let i = 1; i < asc.length; i++) {
        const id = asc[i].id
        if (id !== undefined) {
          m.set(id, asc[i].result.total_score - asc[i - 1].result.total_score)
        }
      }
    }
    return m
  }, [essays])

  const topicCounts = useMemo(() => {
    const m = new Map<string, number>()
    if (!essays) return m
    for (const e of essays) {
      const key = e.topicId ?? CUSTOM
      m.set(key, (m.get(key) ?? 0) + 1)
    }
    return m
  }, [essays])

  const filtered = useMemo(() => {
    if (!essays) return []
    if (filter === ALL) return essays
    return essays.filter((e) => (e.topicId ?? CUSTOM) === filter)
  }, [essays, filter])

  if (essays === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-gray-400">加载中…</div>
    )
  }

  if (essays.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
          <ClipboardList className="h-8 w-8" />
        </span>
        <div className="text-base font-semibold text-gray-900">还没有写过作文</div>
        <p className="text-sm text-gray-500">完成第一篇，就会出现在这里</p>
        <Link
          to="/"
          className="mt-2 inline-flex rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm active:bg-primary-800"
        >
          去写作文
        </Link>
      </div>
    )
  }

  const chips: { key: string; label: string; count: number }[] = [
    { key: ALL, label: '全部', count: essays.length },
    ...TOPICS.filter((t) => topicCounts.has(t.id)).map((t) => ({
      key: t.id,
      label: t.title,
      count: topicCounts.get(t.id)!,
    })),
  ]
  if (topicCounts.has(CUSTOM)) {
    chips.push({ key: CUSTOM, label: '自定义', count: topicCounts.get(CUSTOM)! })
  }

  return (
    <div className="px-4 pt-5 pb-6">
      <h1 className="text-xl font-semibold text-gray-900">历史记录</h1>
      <p className="mt-0.5 text-xs text-gray-500">共 {essays.length} 篇 · 同话题多次写作可对比分数进步</p>

      <div className="-mx-4 mt-3 overflow-x-auto px-4">
        <div className="flex gap-2 pb-1">
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setFilter(c.key)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition-colors ${
                filter === c.key
                  ? 'bg-primary-600 text-white ring-primary-600'
                  : 'bg-white text-gray-600 ring-gray-200 active:bg-gray-50'
              }`}
            >
              {c.label} <span className="opacity-70">({c.count})</span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 text-center text-sm text-gray-400">该话题暂无记录</div>
      ) : (
        <ul className="mt-3 space-y-2">
          {filtered.map((e) => (
            <li key={e.id}>
              <Link
                to={`/result/${e.id}`}
                className="flex items-stretch gap-3 rounded-2xl bg-white p-3 ring-1 ring-gray-100 transition-colors active:bg-gray-50"
              >
                <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-gray-50">
                  <span className={`text-lg font-bold leading-none ${scoreColor(e.result.total_score)}`}>
                    {e.result.total_score}
                  </span>
                  <span className="mt-0.5 text-[10px] text-gray-400">/15</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-gray-900">{e.topic}</span>
                    {e.id !== undefined && <Delta delta={deltaById.get(e.id)} />}
                  </div>
                  <div className="mt-0.5 text-[11px] text-gray-400">
                    {formatTime(e.createdAt)}
                  </div>
                  <div className="mt-1 line-clamp-1 text-xs text-gray-500">
                    {e.content.slice(0, 80)}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 self-center text-gray-300" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Delta({ delta }: { delta?: number }) {
  if (delta === undefined) return null
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-500 ring-1 ring-gray-100">
        <Minus className="h-2.5 w-2.5" /> 持平
      </span>
    )
  }
  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-100">
        <ArrowUp className="h-2.5 w-2.5" /> +{delta}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-700 ring-1 ring-rose-100">
      <ArrowDown className="h-2.5 w-2.5" /> {delta}
    </span>
  )
}

function scoreColor(s: number): string {
  if (s >= 13) return 'text-emerald-600'
  if (s >= 10) return 'text-blue-600'
  if (s >= 7) return 'text-amber-600'
  return 'text-rose-600'
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const today = new Date()
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  if (sameDay) return `今天 ${hm}`
  if (isYesterday) return `昨天 ${hm}`
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${hm}`
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}
