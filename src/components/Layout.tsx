import { NavLink, Outlet } from 'react-router-dom'
import { Home as HomeIcon, ClipboardList, Settings as SettingsIcon } from 'lucide-react'

const tabs = [
  { to: '/', label: '首页', icon: HomeIcon },
  { to: '/history', label: '历史', icon: ClipboardList },
  { to: '/settings', label: '设置', icon: SettingsIcon },
]

export default function Layout() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-gray-50">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-gray-200 bg-white/95 backdrop-blur">
        <ul className="flex h-16 items-stretch justify-around">
          {tabs.map(({ to, label, icon: Icon }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex h-full flex-col items-center justify-center gap-1 text-xs transition-colors ${
                    isActive ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'
                  }`
                }
              >
                <Icon className="h-6 w-6" strokeWidth={2} />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
