import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit'

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['student', 'teacher', 'admin']).default('student'),
  identifier: z.string().optional().nullable(), // Student ID or Employee ID
})

import { getValidationErrorMessage } from '@/lib/format-error'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const validation = signupSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, message: getValidationErrorMessage(validation.error) },
        { status: 400 }
      )
    }

    const { fullName, email, password, role, identifier } = validation.data
    const admin = createAdminClient()

    // 1. Create user in Supabase Auth via Admin API
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { ok: false, message: authError?.message || 'Failed to create user account' },
        { status: 400 }
      )
    }

    // 2. Create profile with requested role
    const profileData: Record<string, any> = {
      id: authData.user.id,
      full_name: fullName,
      email,
      role,
      status: 'active',
    }

    if (role === 'student' && identifier) {
      profileData.student_id = identifier.trim()
    } else if ((role === 'teacher' || role === 'admin') && identifier) {
      profileData.employee_id = identifier.trim()
    }

    const { error: profileError } = await admin
      .from('profiles')
      .upsert(profileData)

    if (profileError) {
      console.error('Profile creation error:', profileError)
      return NextResponse.json({ ok: false, message: profileError.message }, { status: 500 })
    }

    // 3. Log audit event in background (fire-and-forget)
    void logAuditEvent({
      actorId: authData.user.id,
      action: 'USER_CREATED',
      entityType: role.toUpperCase(),
      entityId: authData.user.id,
      metadata: { email, role, fullName },
    })

    // 4. Sign in the newly created user session
    const supabase = await createClient()
    await supabase.auth.signInWithPassword({ email, password })

    const redirectUrl = role === 'admin' ? '/admin' : role === 'teacher' ? '/teacher' : '/student'

    return NextResponse.json({
      ok: true,
      message: 'Account successfully registered!',
      user: { id: authData.user.id, email, role, fullName },
      redirectTo: redirectUrl,
    })
  } catch (err) {
    console.error('Signup error:', err)
    return NextResponse.json(
      { ok: false, message: 'Internal server error during registration.' },
      { status: 500 }
    )
  }
}
