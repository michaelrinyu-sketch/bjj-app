import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

export function RootLayout() {
  return (
    <div className="flex min-h-screen bg-surface">
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 pb-20 md:pb-8">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
