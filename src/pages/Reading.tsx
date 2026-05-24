import { BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Reading() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
        <BookOpen className="h-8 w-8" />
      </span>
      <h1 className="mt-4 text-lg font-semibold text-gray-900">阅读理解</h1>
      <p className="mt-1 text-sm text-gray-500">敬请期待</p>
      <Link
        to="/"
        className="mt-5 inline-flex rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 active:bg-gray-50"
      >
        返回首页
      </Link>
    </div>
  )
}
