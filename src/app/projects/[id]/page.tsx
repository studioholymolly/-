import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { markProjectNotificationsRead, getUnreadCount } from '@/lib/actions/notifications'
import Navbar from '@/components/Navbar'
import StatusBadge from '@/components/StatusBadge'
import BackButton from '@/components/BackButton'
import ProjectTabs from '@/components/project/ProjectTabs'
import { formatDate } from '@/lib/utils'
import { Project, Photo, RetouchedPhoto, Selection, Annotation, RevisionRequest, RevisionSelection, RevisionAnnotation, PhotoWithUrl, RetouchedPhotoWithUrl, Submission } from '@/lib/types'

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects').select('*').eq('id', id).single()
  if (!project) notFound()

  // Run every independent read in parallel — all ~1 RTT instead of N
  const [
    photosRes,
    retouchedRes,
    selectionsRes,
    annotationsRes,
    revisionRes,
    submissionsRes,
    revisionSelectionsRes,
    revisionAnnotationsRes,
    unreadCount,
  ] = await Promise.all([
    supabase.from('photos').select('*').eq('project_id', id).order('sort_order'),
    supabase.from('retouched_photos').select('*').eq('project_id', id).order('sort_order'),
    supabase.from('selections').select('*').eq('project_id', id),
    supabase.from('annotations').select('*').eq('project_id', id),
    supabase.from('revision_requests').select('*').eq('project_id', id).maybeSingle(),
    supabase.from('submissions').select('*').eq('project_id', id).order('created_at', { ascending: false }),
    supabase.from('revision_selections').select('*').eq('project_id', id),
    supabase.from('revision_annotations').select('*').eq('project_id', id),
    getUnreadCount(),
  ])

  const photos = (photosRes.data ?? []) as Photo[]
  const retouchedPhotos = (retouchedRes.data ?? []) as RetouchedPhoto[]
  const selections = (selectionsRes.data ?? []) as Selection[]
  const annotations = (annotationsRes.data ?? []) as Annotation[]
  const revisionRequest = revisionRes.data as RevisionRequest | null
  const submissions = (submissionsRes.data ?? []) as Submission[]
  const revisionSelections = (revisionSelectionsRes.data ?? []) as RevisionSelection[]
  const revisionAnnotations = (revisionAnnotationsRes.data ?? []) as RevisionAnnotation[]

  // Batch signed URLs — 1 round trip per bucket instead of N
  const [origSignedRes, retSignedRes] = await Promise.all([
    photos.length
      ? supabase.storage.from('originals').createSignedUrls(photos.map(p => p.storage_path), 3600)
      : Promise.resolve({ data: [] as Array<{ signedUrl: string; path?: string | null }> }),
    retouchedPhotos.length
      ? supabase.storage.from('retouched').createSignedUrls(retouchedPhotos.map(p => p.storage_path), 3600)
      : Promise.resolve({ data: [] as Array<{ signedUrl: string; path?: string | null }> }),
  ])

  const photoUrls: PhotoWithUrl[] = photos.map((p, i) => ({
    ...p,
    signedUrl: origSignedRes.data?.[i]?.signedUrl || '',
  }))
  const retouchedUrls: RetouchedPhotoWithUrl[] = retouchedPhotos.map((p, i) => ({
    ...p,
    signedUrl: retSignedRes.data?.[i]?.signedUrl || '',
  }))

  // Only mark read if there's actually something unread (skip a pointless 2-query round trip)
  if (project.unread_for_studio) {
    await markProjectNotificationsRead(id)
  }
  const selectedPhotoIds = Array.from(
    new Set((selections as Selection[]).filter(s => s.status === 'selected').map(s => s.photo_id))
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar unreadCount={unreadCount} />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>
        {/* Back / Home */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <BackButton />
          <Link href="/dashboard" style={{
            background: 'var(--s2)', border: '1px solid var(--bd2)',
            color: 'var(--tx)', padding: '7px 14px',
            borderRadius: 8, fontSize: 13, fontWeight: 600,
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>🏠 홈</Link>
        </div>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--mu)', marginBottom: 6 }}>
              <a href="/dashboard" style={{ color: 'var(--mu)', textDecoration: 'none' }}>대시보드</a> / {project.name}
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>{project.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <StatusBadge status={(project as Project).status} />
              <span style={{ fontSize: 12, color: 'var(--mu)' }}>{project.client_name} · {project.client_email}</span>
              {project.retouching_start_date && <span style={{ fontSize: 12, color: 'var(--mu)' }}>보정 시작 {formatDate(project.retouching_start_date)}</span>}
              {project.deadline && <span style={{ fontSize: 12, color: '#f59e0b' }}>보정 마감 {formatDate(project.deadline)}</span>}
            </div>
          </div>
        </div>

        <ProjectTabs
          project={project as Project}
          photos={photoUrls}
          retouchedPhotos={retouchedUrls}
          selections={selections as Selection[]}
          annotations={annotations as Annotation[]}
          revisionRequest={revisionRequest as RevisionRequest | null}
          selectedPhotoIds={selectedPhotoIds}
          submissions={submissions}
          revisionSelections={revisionSelections}
          revisionAnnotations={revisionAnnotations}
        />
      </div>
    </div>
  )
}
