import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PenLine, BookOpen, FileQuestion, Plus, AlertCircle, ChevronRight } from 'lucide-react'
import TopicCard from '../components/TopicCard'
import { TOPICS } from '../data/topics'
import { db } from '../db'
import { useConfigStore } from '../store/configStore'

export default function Home() {
  const [todayCount, setTodayCount] = useState<number>(0)
  const configured = useConfigStore((s) => s.isConfigured())

  useEffect(() => {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    db.essays
      .where('createdAt')
      .above(startOfDay.getTime())
      .count()
      .then(setTodayCount)
      .catch(() => setTodayCount(0))
  }, [])

  return (
    <div className="px-4 pt-5 pb-6">
      <header className="rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 p-5 text-white shadow-sm">
        <div className="text-xs/5 opacity-90">英语作文练习</div>
        <h1 className="mt-1 text-xl font-semibold">同学，今天来写一篇？</h1>
        <p className="mt-1 text-sm/6 opacity-90">
          今日已写 <span className="font-semibold">{todayCount}</span> 篇 · 写完即批，按中考标准评分
        </p>
      </header>

      {!configured && (
        <Link
          to="/settings"
          className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 active:bg-amber-100"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">尚未配置 API，无法开始批改 · 去设置</span>
          <ChevronRight className="h-4 w-4 shrink-0" />
        </Link>
      )}

      <section className="mt-5">
        <h2 className="mb-2 text-sm font-medium text-gray-700">练习模块</h2>
        <div className="grid grid-cols-3 gap-3">
          <ModuleCard to="/writing" enabled icon={<PenLine className="h-5 w-5" />} label="英语作文" />
          <ModuleCard to="/reading" icon={<BookOpen className="h-5 w-5" />} label="阅读理解" />
          <ModuleCard to="/cloze" icon={<FileQuestion className="h-5 w-5" />} label="完形填空" />
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-700">高频话题</h2>
          <Link
            to="/writing"
            className="inline-flex items-center gap-1 text-xs text-primary-700 active:text-primary-800"
          >
            <Plus className="h-3.5 w-3.5" />
            自定义题目
          </Link>
        </div>
        <div className="space-y-2">
          {TOPICS.map((t) => (
            <TopicCard key={t.id} topic={t} />
          ))}
        </div>
      </section>
    </div>
  )
}

function ModuleCard({
  to, label, icon, enabled = false,
}: { to: string; label: string; icon: React.ReactNode; enabled?: boolean }) {
  const base = 'flex flex-col items-center justify-center gap-2 rounded-2xl p-4 text-center ring-1 transition-colors'
  if (enabled) {
    return (
      <Link to={to} className={`${base} bg-white ring-gray-100 hover:bg-primary-50 active:bg-primary-100`}>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-700">{icon}</span>
        <span className="text-sm font-medium text-gray-900">{label}</span>
      </Link>
    )
  }
  return (
    <div className={`${base} cursor-not-allowed bg-gray-50 ring-gray-100`}>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-200 text-gray-400">{icon}</span>
      <span className="text-sm font-medium text-gray-400">{label}</span>
      <span className="text-[10px] text-gray-400">敬请期待</span>
    </div>
  )
}
