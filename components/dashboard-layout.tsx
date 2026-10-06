'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Activity,
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  QrCode,
  School,
  Settings2,
  ShieldCheck,
  User,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserButton, UserButtonUser } from '@/components/user-button'

interface NavItem {
  label: string
  href: string
  icon: any
  badge?: string
}

const adminNav: NavItem[] = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Students', href: '/admin/students', icon: GraduationCap },
  { label: 'Teachers', href: '/admin/teachers', icon: Users },
  { label: 'Courses & Classes', href: '/admin/courses', icon: BookOpen },
  { label: 'Enrollments', href: '/admin/enrollments', icon: School },
  { label: 'Reports & Analytics', href: '/admin/reports', icon: Activity },
  { label: 'Audit Logs', href: '/admin/audit-logs', icon: ShieldCheck },
  { label: 'Settings', href: '/admin/settings', icon: Settings2 },
]

const teacherNav: NavItem[] = [
  { label: 'Overview', href: '/teacher', icon: LayoutDashboard },
  { label: 'My Classes', href: '/teacher/classes', icon: BookOpen },
  { label: 'Start Attendance', href: '/teacher/attendance/new', icon: QrCode, badge: 'Live QR' },
  { label: 'Session History', href: '/teacher/sessions', icon: CalendarCheck },
  { label: 'Class Reports', href: '/teacher/reports', icon: Activity },
  { label: 'My Profile', href: '/teacher/profile', icon: User },
]

const studentNav: NavItem[] = [
  { label: 'Dashboard', href: '/student', icon: LayoutDashboard },
  { label: 'Scan QR Attendance', href: '/student/scan', icon: QrCode, badge: 'Scan' },
  { label: 'My Enrolled Courses', href: '/student/courses', icon: BookOpen },
  { label: 'Attendance History', href: '/student/attendance', icon: CalendarCheck },
  { label: 'Student Profile', href: '/student/profile', icon: User },
]

// Bottom navigation items for mobile
interface BottomNavItem {
  label: string
  href: string
  icon: any
  isPrimaryAction?: boolean
}

const studentBottomNav: BottomNavItem[] = [
  { label: 'Home', href: '/student', icon: LayoutDashboard },
  { label: 'Courses', href: '/student/courses', icon: BookOpen },
  { label: 'Scan QR', href: '/student/scan', icon: QrCode, isPrimaryAction: true },
  { label: 'History', href: '/student/attendance', icon: CalendarCheck },
  { label: 'Profile', href: '/student/profile', icon: User },
]

const teacherBottomNav: BottomNavItem[] = [
  { label: 'Home', href: '/teacher', icon: LayoutDashboard },
  { label: 'Classes', href: '/teacher/classes', icon: BookOpen },
  { label: 'Start QR', href: '/teacher/attendance/new', icon: QrCode, isPrimaryAction: true },
  { label: 'Sessions', href: '/teacher/sessions', icon: CalendarCheck },
  { label: 'Reports', href: '/teacher/reports', icon: Activity },
]

const adminBottomNav: BottomNavItem[] = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Students', href: '/admin/students', icon: GraduationCap },
  { label: 'Teachers', href: '/admin/teachers', icon: Users },
  { label: 'Courses', href: '/admin/courses', icon: BookOpen },
  { label: 'Reports', href: '/admin/reports', icon: Activity },
]

export function DashboardLayout({
  children,
  role = 'admin',
}: {
  children: React.ReactNode
  role?: 'admin' | 'teacher' | 'student'
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<UserButtonUser | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadSession() {
    try {
      const res = await fetch('/api/auth/session')
      const data = await res.json()
      if (data.authenticated && data.user) {
        setUser(data.user)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSession()
  }, [])

  function handleAvatarUpdate(newAvatarUrl: string) {
    setUser((prev) => (prev ? { ...prev, avatarUrl: newAvatarUrl } : null))
  }

  const navItems = role === 'admin' ? adminNav : role === 'teacher' ? teacherNav : studentNav
  const bottomNavItems =
    role === 'admin' ? adminBottomNav : role === 'teacher' ? teacherBottomNav : studentBottomNav

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch {
      router.push('/login')
    }
  }

  const roleLabel = role === 'admin' ? 'Administrator' : role === 'teacher' ? 'Faculty Instructor' : 'Student'
  const roleBadgeStyle =
    role === 'admin'
      ? 'bg-rose-500/15 text-rose-200 border-rose-500/30'
      : role === 'teacher'
      ? 'bg-violet-500/15 text-violet-200 border-violet-500/30'
      : 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30'

  return (
    <div className="flex min-h-screen bg-[#f3f7f9] text-[#24345f]">
      {/* Sidebar Desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#1e2746] text-slate-200 transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <Link href={`/${role}`} className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#6558ee] text-white shadow-md shadow-[#6558ee]/30">
              <Zap className="size-5 fill-current" />
            </div>
            <div>
              <p className="text-base font-bold tracking-tight text-white">Attendly</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-400">Smart Attendance</p>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="size-5" />
          </Button>
        </div>

        {/* User Badge Info with Avatar */}
        <div className="border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative size-10 shrink-0 overflow-hidden rounded-full ring-2 ring-white/20">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName || 'User'}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-[#6558ee] font-bold text-white text-xs">
                  {(user?.fullName || role)[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">
                {user?.fullName || roleLabel}
              </p>
              <p className="truncate text-[11px] text-slate-400">{user?.email || `${role}@attendly.edu`}</p>
              <span className={`inline-block mt-1 rounded px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider border ${roleBadgeStyle}`}>
                {role}
              </span>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-4">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Navigation</p>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#6558ee] text-white shadow-md shadow-[#6558ee]/25'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="size-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300 border border-emerald-500/30">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* System Status / Logout */}
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
              </span>
              <p className="text-[11px] font-medium text-emerald-400">Campus Network Active</p>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Real-time attendance active</p>
          </div>

          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-2.5 rounded-xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-300"
          >
            <LogOut className="size-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Backdrop for mobile sidebar */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-16 sm:h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-3 sm:px-8 backdrop-blur-md">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Button
              variant="outline"
              size="icon"
              className="border-slate-200 text-slate-600 lg:hidden size-9"
              onClick={() => setMobileOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="size-4.5" />
            </Button>
            <div>
              <p className="text-[11px] font-medium text-slate-500 sm:text-xs">{roleLabel} Workspace</p>
              <h1 className="text-sm font-bold text-slate-900 sm:text-lg tracking-tight">Attendly Smart Portal</h1>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {role === 'teacher' && (
              <Link href="/teacher/attendance/new">
                <Button className="hidden h-9 gap-1.5 rounded-xl bg-[#6558ee] text-xs font-semibold text-white shadow-sm hover:bg-[#5549d8] sm:inline-flex">
                  <QrCode className="size-3.5" /> Start Attendance
                </Button>
              </Link>
            )}
            {role === 'student' && (
              <Link href="/student/scan">
                <Button className="hidden h-9 gap-1.5 rounded-xl bg-[#6558ee] text-xs font-semibold text-white shadow-sm hover:bg-[#5549d8] sm:inline-flex">
                  <QrCode className="size-3.5" /> Scan QR Now
                </Button>
              </Link>
            )}

            {/* Dedicated UserButton with Avatar & Photo Upload */}
            <div className="flex items-center pl-1 sm:border-l sm:border-slate-200 sm:pl-3">
              <UserButton user={user} onAvatarUpdate={handleAvatarUpdate} />
            </div>
          </div>
        </header>

        {/* Page Content (with bottom padding for mobile bottom bar + safe area) */}
        <main className="flex-1 w-full max-w-full overflow-x-hidden p-3.5 sm:p-8 lg:p-10 pb-24 sm:pb-8 lg:pb-10">
          {children}
        </main>
      </div>

      {/* Mobile Docked Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-slate-200/90 bg-white/95 px-2 backdrop-blur-md lg:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom,0px)]"
      >
        {bottomNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          if (item.isPrimaryAction) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative -top-3 flex flex-col items-center"
              >
                <div className="flex size-12 items-center justify-center rounded-2xl bg-[#6558ee] text-white shadow-lg shadow-[#6558ee]/40 ring-4 ring-white transition-transform active:scale-95 group-hover:bg-[#5549d8]">
                  <Icon className="size-6" />
                </div>
                <span className="mt-0.5 text-[10px] font-bold text-[#6558ee]">
                  {item.label}
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center py-1 transition-colors ${
                isActive ? 'text-[#6558ee]' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`size-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full bg-[#6558ee]" />
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-1 ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
