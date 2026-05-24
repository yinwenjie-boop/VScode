import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

interface Props {
  title: string
  defaultOpen?: boolean
  rightSlot?: ReactNode
  children: ReactNode
}

export default function Collapsible({ title, defaultOpen = false, rightSlot, children }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-gray-100">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left active:bg-gray-50"
      >
        <span className="text-sm font-medium text-gray-900">{title}</span>
        <span className="flex items-center gap-2">
          {rightSlot}
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </span>
      </button>
      {open && <div className="border-t border-gray-100 px-4 py-3">{children}</div>}
    </div>
  )
}
