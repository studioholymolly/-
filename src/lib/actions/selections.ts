'use server'

import { createClient } from '@/lib/supabase/server'
import { AnnotationPin } from '@/lib/types'

export async function submitSelections(
  shareToken: string,
  selectedPhotoIds: string[],
  annotations: Record<string, AnnotationPin[]>,
  comments: Record<string, string> = {},
  memo: string = ''
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

  // Allow re-submission while the project is still in selecting, selection_done, or studio_editing
  // (anytime before the retouched photos are released to the client)
  const editableStatuses = ['selecting', 'selection_done', 'studio_editing']
  if (!editableStatuses.includes(project.status)) {
    return { error: '지금은 셀렉을 수정할 수 없습니다. 스튜디오에 문의해 주세요.' }
  }

  const projectId = project.id

  // Count total photos for the history log
  const { count: totalCount } = await supabase
    .from('photos').select('*', { count: 'exact', head: true }).eq('project_id', projectId)

  // Replace-all strategy: wipe previous selections/annotations and insert fresh set.
  // (Using DELETE + INSERT instead of upsert so deselections are persisted too.)
  await supabase.from('selections').delete().eq('project_id', projectId)
  await supabase.from('annotations').delete().eq('project_id', projectId)

  if (selectedPhotoIds.length > 0) {
    const selectionRows = selectedPhotoIds.map(photoId => ({
      project_id: projectId,
      photo_id: photoId,
      status: 'selected',
      comment: (comments[photoId] ?? '').trim() || null,
      submitted_at: new Date().toISOString(),
    }))

    const { error: selError } = await supabase.from('selections').insert(selectionRows)
    if (selError) {
      console.error('selections insert error:', selError)
      return { error: selError.message }
    }
  }

  // Flatten + insert annotations
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

  const submissionRow: Record<string, unknown> = {
    project_id: projectId,
    selected_count: selectedPhotoIds.length,
    total_count: totalCount ?? 0,
    pin_count: annotationRows.length,
  }
  const memoTrimmed = memo.trim()
  if (memoTrimmed) submissionRow.memo = memoTrimmed
  const { error: subErr } = await supabase.from('submissions').insert(submissionRow)
  if (subErr && memoTrimmed) {
    delete submissionRow.memo
    await supabase.from('submissions').insert(submissionRow)
  }

  // Count how many submissions existed before this one — to label notification accurately
  const { count: submissionCount } = await supabase
    .from('submissions').select('*', { count: 'exact', head: true }).eq('project_id', projectId)
  const isResubmission = (submissionCount ?? 0) > 1

  // Update project status (stays at selection_done on re-submit) and raise the unread flag again
  await supabase
    .from('projects')
    .update({ status: 'selection_done', unread_for_studio: true })
    .eq('id', projectId)

  // Notification
  const label = isResubmission ? '셀렉을 재제출했습니다' : '셀렉을 완료했습니다'
  await supabase.from('notifications').insert({
    studio_id: project.studio_id,
    project_id: projectId,
    type: 'selection_submitted',
    message: `${project.client_name}님이 ${label}. (${selectedPhotoIds.length}장 선택, 메모 ${annotationRows.length}개)`,
    is_read: false,
  })

  return { ok: true, isResubmission }
}

/**
 * Client confirms "수정 없음" — no revisions needed. Marks the project as completed
 * so the client immediately sees the drive link, and locks further revision edits.
 */
export async function submitNoRevision(shareToken: string) {
  const supabase = await createClient()

  const { data: project, error } = await supabase
    .from('projects')
    .select('id, studio_id, status, revision_used, client_name')
    .eq('share_token', shareToken)
    .single()

  if (error || !project) return { error: '프로젝트를 찾을 수 없습니다.' }
  if (project.revision_used) return { error: '수정 요청은 1회만 가능합니다.' }
  if (project.status !== 'client_reviewing') return { error: '검토 기간이 아닙니다.' }

  await supabase
    .from('projects')
    .update({ revision_used: true, status: 'completed', unread_for_studio: true })
    .eq('id', project.id)

  await supabase.from('notifications').insert({
    studio_id: project.studio_id,
    project_id: project.id,
    type: 'revision_requested',
    message: `${project.client_name}님이 수정 없이 완료했습니다.`,
    is_read: false,
  })

  return { ok: true }
}

/**
 * Client submits a revision with per-retouched-photo selections, annotations, and comments.
 * This is the "수정 있음" path. Only allowed once (revision_used flag).
 */
export async function submitRevisionSelections(
  shareToken: string,
  selectedRetouchedPhotoIds: string[],
  annotations: Record<string, AnnotationPin[]>,
  comments: Record<string, string> = {},
  memo: string = ''
) {
  const supabase = await createClient()

  const { data: project, error } = await supabase
    .from('projects')
    .select('id, studio_id, status, revision_used, client_name')
    .eq('share_token', shareToken)
    .single()

  if (error || !project) return { error: '프로젝트를 찾을 수 없습니다.' }
  if (project.revision_used) return { error: '수정 요청은 1회만 가능합니다.' }
  if (project.status !== 'client_reviewing') return { error: '검토 기간이 아닙니다.' }
  if (selectedRetouchedPhotoIds.length === 0) {
    return { error: '수정이 필요한 사진을 하나 이상 선택해 주세요.' }
  }

  const projectId = project.id

  // Replace-all: wipe previous revision data, then insert fresh.
  await supabase.from('revision_selections').delete().eq('project_id', projectId)
  await supabase.from('revision_annotations').delete().eq('project_id', projectId)

  const selectionRows = selectedRetouchedPhotoIds.map(photoId => ({
    project_id: projectId,
    retouched_photo_id: photoId,
    comment: (comments[photoId] ?? '').trim() || null,
  }))
  const { error: selError } = await supabase.from('revision_selections').insert(selectionRows)
  if (selError) return { error: selError.message }

  const annotationRows: Array<{
    project_id: string
    retouched_photo_id: string
    pin_number: number
    x_pct: number
    y_pct: number
    comment: string
  }> = []
  for (const [photoId, pins] of Object.entries(annotations)) {
    // Only keep annotations on photos that were actually selected for revision
    if (!selectedRetouchedPhotoIds.includes(photoId)) continue
    for (const pin of pins) {
      annotationRows.push({
        project_id: projectId,
        retouched_photo_id: photoId,
        pin_number: pin.pin_number,
        x_pct: pin.x_pct,
        y_pct: pin.y_pct,
        comment: pin.comment,
      })
    }
  }
  if (annotationRows.length > 0) {
    await supabase.from('revision_annotations').insert(annotationRows)
  }

  await supabase.from('revision_requests').insert({ project_id: projectId, message: memo.trim() })

  // Flip back to studio_editing so the studio knows to do a second pass
  await supabase
    .from('projects')
    .update({ revision_used: true, status: 'studio_editing', unread_for_studio: true })
    .eq('id', projectId)

  await supabase.from('notifications').insert({
    studio_id: project.studio_id,
    project_id: projectId,
    type: 'revision_requested',
    message: `${project.client_name}님이 수정 요청을 보냈습니다. (${selectedRetouchedPhotoIds.length}장 선택, 메모 ${annotationRows.length}개)`,
    is_read: false,
  })

  return { ok: true }
}
