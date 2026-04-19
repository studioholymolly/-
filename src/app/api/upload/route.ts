import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { projectId, filename, bucket } = await request.json()

  if (!projectId || !filename || !bucket) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  const ext = filename.split('.').pop()
  const safeFilename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const storagePath = `${projectId}/${safeFilename}`

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(storagePath)

  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Failed' }, { status: 500 })
  }

  return NextResponse.json({
    signedUrl: data.signedUrl,
    storagePath,
    token: data.token,
  })
}
