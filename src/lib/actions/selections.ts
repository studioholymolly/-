'use server'

import { createClient } from '@/lib/supabase/server'
import { AnnotationPin } from '@/lib/types'

export async function submitSelections(
  shareToken: string,
  selectedPhotoIds: string[],
  annotations: Record<string, AnnotationPin[]>
) {
  const supabase = await createClient()

  // Lookup project by token (no auth needed)
  const { data: project, error: projError } = await supabase
    .from('projects')
    .select('id, studio_id, status, client_name')
    .eq('share_token', shareToken)
    .single()

  if (projError || !project) {
    return { error: '프로젝트를 찾을 수 없습니다.' }
  }

  if (project.status !== 'selecting') {
    return { error: '셀렉 기간이 아닙니다.' }
  }

  const projectId = project.id

  // Upsert selections
  if (selectedPhotoIds.length > 0) {
    const selectionRows = selectedPhotoIds.map(photoId => ({
      project_id: projectId,
      photo_id: photoId,
      status: 'selected',
      submitted_at: new Date().toISOString(),
    }))

    const { error: selError } = await supabase
      .from('selections')
      .upsert(selectionRows, { onConflict: 'project_id,photo_id' })

    if (selError) {
      console.error('selections upsert error:', selError)
      return { error: selError.message }
    }
  }

  // Insert annotations
  const annotationRows: Array<{
    project_id: string
    photo_id: string
    pin_number: number
    x_pct: number
    y_pct: number
    comment: string
  }> = []

  for (const [photoId, pins] of Object.entries(annotations)) {
    for (const pin of pins) {
      annotationRows.push({
        project_id: projectId,
        photo_id: photoId,
        pin_number: pin.pin_number,
        x_pct: pin.x_pct,
        y_pct: pin.y_pct,
        comment: pin.comment,
      })
    }
  }

  if (annotationRows.length > 0) {
    await supabase.from('annotations').insert(annotationRows)
  }

  // Update project status
  await supabase
    .from('projects')
    .update({ status: 'studio_editing', unread_for_studio: true })
    .eq('id', projectId)

  // Insert notification
  await supabase.from('notifications').insert({
    studio_id: project.studio_id,
    project_id: projectId,
    type: 'selection_submitted',
    message: `${project.client_name}님이 셀렉을 완료했습니다. (${selectedPhotoIds.length}장 선택)`,
    is_read: false,
  })

  return { ok: true }
}

export async function submitRevision(shareToken: string, message: string) {
  const supabase = await createClient()

  const { data: project, error } = await supabase
    .from('projects')
    .select('id, studio_id, status, revision_used, client_name')
    .eq('share_token', shareToken)
    .single()

  if (error || !project) return { error: '프로젝트를 찾을 수 없습니다.' }
  if (project.revision_used) return { error: '수정 요청은 1회만 가능합니다.' }
  if (project.status !== 'client_reviewing') return { error: '검토 기간이 아닙니다.' }

  // Insert revision request
  const { error: revError } = await supabase
    .from('revision_requests')
    .insert({ project_id: project.id, message })

  if (revError) return { error: revError.message }

  // Mark revision used + notify studio
  await supabase
    .from('projects')
    .update({ revision_used: true, unread_for_studio: true })
    .eq('id', project.id)

  await supabase.from('notifications').insert({
    studio_id: project.studio_id,
    project_id: project.id,
    type: 'revision_requested',
    message: `${project.client_name}님이 수정 요청을 남겼습니다.`,
    is_read: false,
  })

  return { ok: true }
}
