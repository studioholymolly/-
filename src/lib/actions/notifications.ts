'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('studio_id', user.id)
    .eq('is_read', false)

  return count || 0
}

export async function markProjectNotificationsRead(projectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('studio_id', user.id)
    .eq('project_id', projectId)

  await supabase
    .from('projects')
    .update({ unread_for_studio: false })
    .eq('id', projectId)
    .eq('studio_id', user.id)

  revalidatePath('/dashboard')
  revalidatePath(`/projects/${projectId}`)
}

export async function markAllNotificationsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('studio_id', user.id)
    .eq('is_read', false)

  revalidatePath('/dashboard')
}
