import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { Topic } from '../types'

const FREQ_STYLE: Record<Topic['frequency'], string> = {
  高频: 'bg-red-50 text-red-600 ring-red-100',
  常考: 'bg-amber-50 text-amber-700 ring-amber-100',
  中频: 'bg-blue-50 text-blue-600 ring-blue-100',
}

export default function TopicCard({ topic }: { topic: Topic }) {
  return (
    <Link
      to={`/writing/${topic.id}`}
      className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-gray-100 transition-colors active:bg-gray-50"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-base font-medium text-gray-900">{topic.title}</span>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${FREQ_STYLE[topic.frequency]}`}>
            {topic.frequency}
          </span>
        </div>
        <div className="mt-0.5 truncate text-xs text-gray-500">{topic.englishTitle}</div>
        <div className="mt-1 line-clamp-2 text-xs text-gray-500">{topic.requirements}</div>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-gray-300" />
    </Link>
  )
}
