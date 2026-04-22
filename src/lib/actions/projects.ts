'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createProject(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const name = formData.get('name') as string
  const client_name = formData.get('client_name') as string
  const client_email = formData.get('client_email') as string
  const deadline = formData.get('deadline') as string || null
  const custom_message = formData.get('custom_message') as string || null

  const { data, error } = await supabase
    .from('projects')
    .insert({
      studio_id: user.id,
      name,
      client_name,
      client_email,
      deadline: deadline || null,
      custom_message,
      status: 'draft',
    })
    .select('id')
    .single()

  if (error) {
    console.error('createProject error:', error)
    return { error: error.message }
  }

  redirect(`/projects/${data.id}`)
}

export async function updateProject(projectId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const name = formData.get('name') as string
  const client_name = formData.get('client_name') as string
  const client_email = formData.get('client_email') as string
  const deadline = (formData.get('deadline') as string) || null
  const custom_message = (formData.get('custom_message') as string) || null

  const { error } = await supabase
    .from('projects')
    .update({
      name,
      client_name,
      client_email,
      deadline,
      custom_message,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)
    .eq('studio_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/dashboard')
  return { ok: true }
}

export async function updateProjectStatus(projectId: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  await supabase
    .from('projects')
    .update({ status })
    .eq('id', projectId)
    .eq('studio_id', user.id)

  revalidatePath(`/projects/${projectId}`)
}

export async function setDriveLink(projectId: string, driveLink: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  await supabase
    .from('projects')
    .update({ drive_link: driveLink, status: 'completed' })
    .eq('id', projectId)
    .eq('studio_id', user.id)

  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/dashboard')
}

export async function setDriveLinkOriginals(projectId: string, driveLink: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  await supabase
    .from('projects')
    .update({ drive_link_originals: driveLink || null })
    .eq('id', projectId)
    .eq('studio_id', user.id)

  revalidatePath(`/projects/${projectId}`)
}

export async function setDriveLinkRetouched(projectId: string, driveLink: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  await supabase
    .from('projects')
    .update({ drive_link: driveLink || null })
    .eq('id', projectId)
    .eq('studio_id', user.id)

  revalidatePath(`/projects/${projectId}`)
}

export async function regenerateShareToken(projectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // 24 random bytes → 48 hex chars (matches the schema default)
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  const newToken = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')

  const { error } = await supabase
    .from('projects')
    .update({ share_token: newToken, updated_at: new Date().toISOString() })
    .eq('id', projectId)
    .eq('studio_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/projects/${projectId}`)
  return { ok: true, token: newToken }
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('studio_id', user.id)

  revalidatePath('/dashboard')
  redirect('/dashboard')
}
