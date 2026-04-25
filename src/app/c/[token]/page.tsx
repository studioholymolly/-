import { createClient } from '@/lib/supabase/server'
import { Project, PhotoWithUrl, RetouchedPhotoWithUrl, Selection, Annotation, AnnotationPin, RevisionSelection, RevisionAnnotation } from '@/lib/types'
import ClientGallery from '@/components/client/ClientGallery'

export default async function ClientPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()

  // Lookup project by token (no auth)
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('share_token', token)
    .single()

  if (error || !project) {
    return (
      <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a0a0c' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>링크를 찾을 수 없습니다</h2>
          <p style={{ fontSize: 13, color: '#6b6b80' }}>유효하지 않은 링크이거나 만료된 링크입니다</p>
        </div>
      </div>
    )
  }

  // Fetch photos, retouched, prior selections/annotations (for re-submission) in parallel
  const [
    photosRes, retouchedRes, selectionsRes, annotationsRes, submissionsRes,
    revisionSelectionsRes, revisionAnnotationsRes, revisionRequestRes, favoritesRes,
  ] = await Promise.all([
    supabase.from('photos').select('*').eq('project_id', project.id).order('sort_order'),
    supabase.from('retouched_photos').select('*').eq('project_id', project.id).order('sort_order'),
    supabase.from('selections').select('*').eq('project_id', project.id),
    supabase.from('annotations').select('*').eq('project_id', project.id),
    supabase.from('submissions').select('*').eq('project_id', project.id).order('created_at', { ascending: false }),
    supabase.from('revision_selections').select('*').eq('project_id', project.id),
    supabase.from('revision_annotations').select('*').eq('project_id', project.id),
    supabase.from('revision_requests').select('message').eq('project_id', project.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('photo_favorites').select('photo_id').eq('project_id', project.id),
  ])

  const photos = (photosRes.data ?? []) as PhotoWithUrl[]
  const retouchedPhotos = (retouchedRes.data ?? []) as RetouchedPhotoWithUrl[]

  // Batch signed URLs
  const [origSigned, retSigned] = await Promise.all([
    photos.length
      ? supabase.storage.from('originals').createSignedUrls(photos.map(p => p.storage_path), 3600)
      : Promise.resolve({ data: [] as Array<{ signedUrl: string; path?: string | null }> }),
    retouchedPhotos.length
      ? supabase.storage.from('retouched').createSignedUrls(retouchedPhotos.map(p => p.storage_path), 3600)
      : Promise.resolve({ data: [] as Array<{ signedUrl: string; path?: string | null }> }),
  ])
  const photoUrls: PhotoWithUrl[] = photos.map((p, i) => ({ ...p, signedUrl: origSigned.data?.[i]?.signedUrl || '' }))
  const retouchedUrls: RetouchedPhotoWithUrl[] = retouchedPhotos.map((p, i) => ({ ...p, signedUrl: retSigned.data?.[i]?.signedUrl || '' }))

  // Precompute previous selections + annotations so the client can edit them
  const selections = (selectionsRes.data ?? []) as Selection[]
  const annotations = (annotationsRes.data ?? []) as Annotation[]
  const initialSelectedIds = selections.filter(s => s.status === 'selected').map(s => s.photo_id)
  const initialComments: Record<string, string> = {}
  for (const s of selections) {
    if (s.comment && s.comment.trim()) initialComments[s.photo_id] = s.comment
  }
  const initialAnnotations: Record<string, AnnotationPin[]> = {}
  for (const a of annotations) {
    if (!initialAnnotations[a.photo_id]) initialAnnotations[a.photo_id] = []
    initialAnnotations[a.photo_id].push({
      pin_number: a.pin_number,
      x_pct: a.x_pct,
      y_pct: a.y_pct,
      comment: a.comment ?? '',
    })
  }
  // Sort each photo's pins and renumber starting from 1
  for (const photoId of Object.keys(initialAnnotations)) {
    initialAnnotations[photoId] = initialAnnotations[photoId]
      .sort((a, b) => a.pin_number - b.pin_number)
      .map((p, i) => ({ ...p, pin_number: i + 1 }))
  }

  const submissionCount = submissionsRes.data?.length ?? 0
  const latestMemo = (submissionsRes.data?.[0] as { memo?: string | null } | undefined)?.memo ?? ''
  const latestRevisionMemo = (revisionRequestRes.data as { message?: string | null } | null)?.message ?? ''
  const initialFavoriteIds = (favoritesRes.data ?? []).map((f: { photo_id: string }) => f.photo_id)

  // Hydrate previous revision submission (re-render on refresh after submit)
  const revisionSelections = (revisionSelectionsRes.data ?? []) as RevisionSelection[]
  const revisionAnnotationsList = (revisionAnnotationsRes.data ?? []) as RevisionAnnotation[]
  const initialRevisionSelectedIds = revisionSelections.map(r => r.retouched_photo_id)
  const initialRevisionComments: Record<string, string> = {}
  for (const r of revisionSelections) {
    if (r.comment && r.comment.trim()) initialRevisionComments[r.retouched_photo_id] = r.comment
  }
  const initialRevisionAnnotations: Record<string, AnnotationPin[]> = {}
  for (const a of revisionAnnotationsList) {
    if (!initialRevisionAnnotations[a.retouched_photo_id]) initialRevisionAnnotations[a.retouched_photo_id] = []
    initialRevisionAnnotations[a.retouched_photo_id].push({
      pin_number: a.pin_number,
      x_pct: a.x_pct,
      y_pct: a.y_pct,
      comment: a.comment ?? '',
    })
  }
  for (const photoId of Object.keys(initialRevisionAnnotations)) {
    initialRevisionAnnotations[photoId] = initialRevisionAnnotations[photoId]
      .sort((a, b) => a.pin_number - b.pin_number)
      .map((p, i) => ({ ...p, pin_number: i + 1 }))
  }

  return (
    <ClientGallery
      project={project as Project}
      photos={photoUrls}
      retouchedPhotos={retouchedUrls}
      shareToken={token}
      initialSelectedIds={initialSelectedIds}
      initialAnnotations={initialAnnotations}
      initialComments={initialComments}
      initialRevisionSelectedIds={initialRevisionSelectedIds}
      initialRevisionAnnotations={initialRevisionAnnotations}
      initialRevisionComments={initialRevisionComments}
      submissionCount={submissionCount}
      initialMemo={latestMemo}
      initialRevisionMemo={latestRevisionMemo}
      initialFavoriteIds={initialFavoriteIds}
    />
  )
}
