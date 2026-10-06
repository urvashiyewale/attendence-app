import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAuditEvent } from '@/lib/audit'

import { getValidationErrorMessage } from '@/lib/format-error'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const validation = loginSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, message: getValidationErrorMessage(validation.error) },
        { status: 400 }
      )
    }

    const { email, password } = validation.data
    const supabase = await createClient()

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user) {
      // Fire-and-forget audit event in background without blocking response
      void logAuditEvent({
        action: 'LOGIN_FAILED',
        entityType: 'AUTH',
        success: false,
        metadata: { email, reason: authError?.message || 'Invalid credentials' },
      })
      return NextResponse.json(
        { ok: false, message: authError?.message || 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Fetch user profile to verify status and role
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('role, status, full_name')
      .eq('id', authData.user.id)
      .maybeSingle()

    if (profile?.status && profile.status !== 'active') {
      await supabase.auth.signOut()
      return NextResponse.json(
        { ok: false, message: 'Your account is deactivated. Contact an administrator.' },
        { status: 403 }
      )
    }

    const role = profile?.role || 'student'
    const redirectUrl = role === 'admin' ? '/admin' : role === 'teacher' ? '/teacher' : '/student'

    // Fire-and-forget success audit log in background
    void logAuditEvent({
      actorId: authData.user.id,
      action: 'LOGIN_SUCCESS',
      entityType: 'AUTH',
      entityId: authData.user.id,
      success: true,
      metadata: { role, email },
    })

    return NextResponse.json({
      ok: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role,
        fullName: profile?.full_name || email,
      },
      redirectTo: redirectUrl,
    })
  } catch (err: unknown) {
    console.error('Login error:', err)
    return NextResponse.json(
      { ok: false, message: 'An unexpected error occurred during sign-in.' },
      { status: 500 }
    )
  }
}
