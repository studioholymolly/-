'use server'

import { createClient } from '@/lib/supabase/server'

export async function toggleFavorite(shareToken: string, photoId: string) {
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects').select('id').eq('share_token', shareToken).single()
  if (!project) return { error: '프로젝트를 찾을 수 없습니다.' }

  const { data: existing } = await supabase
    .from('photo_favorites')
    .select('id')
    .eq('project_id', project.id)
    .eq('photo_id', photoId)
    .maybeSingle()

  if (existing) {
    await supabase.from('photo_favorites').delete().eq('id', existing.id)
    return { ok: true, favorited: false }
  }

  const { error } = await supabase
    .from('photo_favorites')
    .insert({ project_id: project.id, photo_id: photoId })
  if (error) return { error: error.message }

  return { ok: true, favorited: true }
}
