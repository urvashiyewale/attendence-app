'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  User,
  Users,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  // Common fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Prefetch main destinations on initial page mount
  useEffect(() => {
    router.prefetch('/student')
    router.prefetch('/teacher')
    router.prefetch('/admin')
  }, [router])

  // Signup fields
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'student' | 'teacher'>('student')
  const [identifier, setIdentifier] = useState('') // Student ID or Employee ID

  // Quick 1-tap demo credentials loader
  function fillDemo(demoRole: 'student' | 'teacher' | 'admin') {
    setError('')
    setMode('signin')
    if (demoRole === 'student') {
      setEmail('student@attendly.edu')
      setPassword('password123')
    } else if (demoRole === 'teacher') {
      setEmail('teacher@attendly.edu')
      setPassword('password123')
    } else {
      setEmail('admin@attendly.edu')
      setPassword('password123')
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Please enter your email address.')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.')
      return
    }
    if (!password) {
      setError('Please enter your password.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    try {
      // Pre-warm dashboard routes in parallel
      router.prefetch('/student')
      router.prefetch('/teacher')
      router.prefetch('/admin')

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password }),
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        setError(result?.message || 'Invalid email or password.')
        setLoading(false)
        return
      }

      const target =
        result.redirectTo ||
        (result.user?.role === 'admin'
          ? '/admin'
          : result.user?.role === 'teacher'
          ? '/teacher'
          : '/student')
      
      // Fast immediate navigation
      router.push(target)
    } catch {
      setError('Unable to reach authentication service. Please check your connection.')
      setLoading(false)
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const trimmedName = fullName.trim()
    const trimmedEmail = email.trim()
    const trimmedId = identifier.trim()

    if (!trimmedName || trimmedName.length < 2) {
      setError('Please enter your full name (minimum 2 characters).')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid institutional email address.')
      return
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }
    if (role === 'student' && !trimmedId) {
      setError('Please enter your Student ID or Roll Number.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: trimmedName,
          email: trimmedEmail,
          password,
          role,
          identifier: trimmedId || undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        setError(result?.message || 'Failed to create account.')
        setLoading(false)
        return
      }

      const target = result.redirectTo || (role === 'teacher' ? '/teacher' : '/student')
      router.push(target)
    } catch {
      setError('Registration error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-[100dvh] w-full bg-[#0b0f19] text-[#1e293b] flex flex-col lg:flex-row overflow-x-hidden">
      {/* Background for Mobile View (Generated 9:16 Portrait Campus Architecture) */}
      <div className="absolute inset-0 lg:hidden pointer-events-none">
        <img
          src="/images/mobile-login-hero.jpg"
          alt="Campus Sunset Ambiance"
          className="size-full object-cover object-top brightness-[0.38] saturate-[1.1]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-[#0b0f19]/80 to-[#0b0f19]/40" />
      </div>

      {/* Visual Brand Panel (Left on Desktop) */}
      <section className="relative hidden overflow-hidden lg:flex lg:w-[48%] lg:flex-col lg:justify-between bg-[#0b0f19] p-10 text-white">
        {/* Desktop Campus Architecture Background */}
        <div className="absolute inset-0">
          <img
            src="/images/mobile-login-hero.jpg"
            alt="Smart Campus Attendance Environment"
            className="size-full object-cover object-center opacity-40 brightness-95 filter transition-transform duration-10000 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-[#0b0f19]/75 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b0f19]/80 via-transparent to-[#0b0f19]" />
        </div>

        {/* Top Logo */}
        <Link href="/" className="relative z-10 flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#6558ee] to-violet-400 shadow-lg shadow-[#6558ee]/40">
            <Zap className="size-6 fill-current text-white" />
          </div>
          <div>
            <p className="text-xl font-extrabold tracking-tight text-white">Attendly</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Smart Attendance Architecture
            </p>
          </div>
        </Link>

        {/* Middle Value Proposition with Floating Visual Card */}
        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
            <ShieldCheck className="size-3.5 text-emerald-400" /> Enterprise Campus Attendance
          </div>

          <h1 className="text-5xl font-extrabold leading-[1.12] tracking-tight text-white">
            Every class counted.<br />
            <span className="bg-gradient-to-r from-[#a59dfe] via-indigo-300 to-emerald-300 bg-clip-text text-transparent">
              Every scan verified.
            </span>
          </h1>

          <p className="text-sm leading-relaxed text-slate-300">
            Cryptographic 15-second dynamic QR token rotation coupled with live GPS classroom geofencing. Built for institutions that demand real-time verification and zero proxy scans.
          </p>

          {/* Floating Live Feature Preview Badge */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-emerald-400 font-semibold">
                <ShieldCheck className="size-4" /> 15s Dynamic QR Active
              </span>
              <span className="font-mono text-[11px] text-slate-400">±100m GPS Geofence</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
              <div className="rounded-lg bg-white/5 p-2">
                <p className="font-bold text-white">Anti-Proxy</p>
                <p className="text-[10px] text-slate-400">Rotating tokens</p>
              </div>
              <div className="rounded-lg bg-white/5 p-2">
                <p className="font-bold text-white">Geofenced</p>
                <p className="text-[10px] text-slate-400">GPS validated</p>
              </div>
              <div className="rounded-lg bg-white/5 p-2">
                <p className="font-bold text-white">Photo ID</p>
                <p className="text-[10px] text-slate-400">Live roster check</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Tagline */}
        <p className="relative z-10 text-xs text-slate-400">
          © 2026 Attendly Systems. Built for high-integrity academic institutions.
        </p>
      </section>

      {/* Auth Card Panel (Right on Desktop, Centered Mobile Experience) */}
      <section className="relative z-10 flex flex-1 flex-col justify-center px-3.5 py-6 sm:px-8 lg:p-12 lg:bg-[#f1f5f9]">
        {/* Mobile Top Brand Header */}
        <div className="mb-4 flex flex-col items-center text-center lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-2">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#6558ee] text-white shadow-lg shadow-[#6558ee]/40 ring-2 ring-white/20">
              <Zap className="size-5 fill-current" />
            </div>
            <div className="text-left">
              <p className="text-lg font-bold text-white tracking-tight">Attendly</p>
              <p className="text-[9px] uppercase tracking-wider text-slate-300">Smart Attendance Portal</p>
            </div>
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-0.5 text-[11px] font-medium text-emerald-300 border border-white/15 backdrop-blur-md">
            <ShieldCheck className="size-3" /> Anti-Proxy Classroom Geofence
          </span>
        </div>

        <div className="mx-auto w-full max-w-md">
          {/* Card Container with subtle backdrop elevation on mobile */}
          <Card className="border-slate-200/80 bg-white/98 shadow-2xl backdrop-blur-lg rounded-2xl sm:rounded-3xl overflow-hidden sm:border-slate-200">
            {/* 1-Tap Quick Demo Role Selector */}
            <div className="bg-slate-50 border-b border-slate-100 p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Quick Demo Access
                </span>
                <span className="text-[10px] font-medium text-slate-400">Tap to auto-fill</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => fillDemo('student')}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100/70 transition-all active:scale-95"
                >
                  <GraduationCap className="size-3.5 text-emerald-600" />
                  <span>Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo('teacher')}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50/70 py-2 text-xs font-semibold text-violet-800 hover:bg-violet-100/70 transition-all active:scale-95"
                >
                  <Users className="size-3.5 text-violet-600" />
                  <span>Teacher</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo('admin')}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/70 py-2 text-xs font-semibold text-rose-800 hover:bg-rose-100/70 transition-all active:scale-95"
                >
                  <ShieldCheck className="size-3.5 text-rose-600" />
                  <span>Admin</span>
                </button>
              </div>
            </div>

            <CardHeader className="p-5 pb-2 sm:p-6 sm:pb-3">
              {/* Mode Selector Tabs (Sign In / Register) */}
              <div className="flex rounded-xl bg-slate-100 p-1 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin')
                    setError('')
                  }}
                  className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                    mode === 'signin'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup')
                    setError('')
                  }}
                  className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                    mode === 'signup'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <CardTitle className="text-xl font-bold tracking-tight text-slate-900">
                {mode === 'signin' ? 'Sign in to Attendly' : 'Register New Account'}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                {mode === 'signin'
                  ? 'Enter your institutional email and password to access your dashboard'
                  : 'Create your academic profile for attendance verification'}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 pt-2 sm:p-6 sm:pt-2 space-y-4">
              {error && (
                <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                  <ShieldAlert className="size-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* SIGN IN FORM */}
              {mode === 'signin' ? (
                <form onSubmit={handleSignIn} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Email Address</label>
                    <div className="relative mt-1">
                      <Mail className="pointer-events-none absolute left-3 top-3 size-4 text-slate-400" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@attendly.edu"
                        className="pl-9 text-xs h-10.5 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Password</label>
                    <div className="relative mt-1">
                      <LockKeyhole className="pointer-events-none absolute left-3 top-3 size-4 text-slate-400" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        className="pl-9 pr-9 text-xs h-10.5 rounded-xl"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center gap-1.5 text-slate-500 cursor-pointer">
                      <input type="checkbox" defaultChecked className="accent-[#6558ee] rounded size-3.5" />
                      Remember me
                    </label>
                    <Link href="/forgot-password" className="font-semibold text-[#6558ee] hover:underline">
                      Forgot password?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 gap-2 rounded-xl bg-[#6558ee] font-semibold text-white shadow-md shadow-[#6558ee]/25 hover:bg-[#5549d8] transition-all active:scale-[0.99]"
                  >
                    {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
                    Sign In to Portal
                  </Button>
                </form>
              ) : (
                /* ROLE-BASED SIGN UP FORM */
                <form onSubmit={handleSignUp} className="space-y-3">
                  {/* Role Selector */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Account Type</label>
                    <div className="mt-1 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRole('student')}
                        className={`rounded-xl border p-2.5 text-center text-xs font-semibold transition-all ${
                          role === 'student'
                            ? 'border-[#6558ee] bg-[#6558ee]/10 text-[#6558ee]'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <GraduationCap className="mx-auto size-4 mb-1" />
                        Student
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('teacher')}
                        className={`rounded-xl border p-2.5 text-center text-xs font-semibold transition-all ${
                          role === 'teacher'
                            ? 'border-[#6558ee] bg-[#6558ee]/10 text-[#6558ee]'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Users className="mx-auto size-4 mb-1" />
                        Faculty / Instructor
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Full Name</label>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="mt-1 text-xs h-10.5 rounded-xl"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Email Address</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your institutional email"
                      className="mt-1 text-xs h-10.5 rounded-xl"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">
                      {role === 'student' ? 'Student Roll / ID' : 'Faculty / Employee ID'}
                    </label>
                    <Input
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={role === 'student' ? 'Student ID or Roll Number' : 'Employee or Faculty ID'}
                      className="mt-1 font-mono text-xs h-10.5 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Password</label>
                    <div className="relative mt-1">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="pr-9 text-xs h-10.5 rounded-xl"
                        minLength={6}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 gap-2 rounded-xl bg-[#6558ee] font-semibold text-white shadow-md shadow-[#6558ee]/25 hover:bg-[#5549d8] mt-2 transition-all active:scale-[0.99]"
                  >
                    {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                    Register as {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <p className="mt-4 text-center text-xs text-slate-400 lg:text-slate-500">
            Need institutional assistance? Contact your campus registrar.
          </p>
        </div>
      </section>
    </main>
  )
}
