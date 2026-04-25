'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function confirmPhotoUpload(
  projectId: string,
  storagePath: string,
  filename: string,
  bucket: 'originals' | 'retouched',
  sortOrder: number
) {
  const supabase = await createClient()

  const table = bucket === 'originals' ? 'photos' : 'retouched_photos'
  const { error } = await supabase
    .from(table)
    .insert({ project_id: projectId, storage_path: storagePath, filename, sort_order: sortOrder })

  if (error) {
    console.error('confirmPhotoUpload error:', error)
    return { error: error.message }
  }

  if (bucket === 'retouched') {
    const { data: proj } = await supabase
      .from('projects').select('status').eq('id', projectId).single()
    if (proj && proj.status !== 'studio_editing' && proj.status !== 'completed') {
      await supabase.from('projects').update({ status: 'studio_editing' }).eq('id', projectId)
    }
  }

  revalidatePath(`/projects/${projectId}`)
  return { ok: true }
}

export async function deletePhoto(photoId: string, bucket: 'originals' | 'retouched', storagePath: string) {
  const supabase = await createClient()

  await supabase.storage.from(bucket).remove([storagePath])

  const table = bucket === 'originals' ? 'photos' : 'retouched_photos'
  await supabase.from(table).delete().eq('id', photoId)

  return { ok: true }
}

export async function getSignedUrls(storagePaths: string[], bucket: 'originals' | 'retouched') {
  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrls(storagePaths, 3600)

  if (error || !data) return []
  return data.map(d => d.signedUrl || '')
}
