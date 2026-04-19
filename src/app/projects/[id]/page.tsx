import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { markProjectNotificationsRead, getUnreadCount } from '@/lib/actions/notifications'
import Navbar from '@/components/Navbar'
import StatusBadge from '@/components/StatusBadge'
import ProjectTabs from '@/components/project/ProjectTabs'
import { formatDate } from '@/lib/utils'
import { Project, Photo, RetouchedPhoto, Selection, Annotation, RevisionRequest, PhotoWithUrl, RetouchedPhotoWithUrl } from '@/lib/types'

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: project } = await supabase
    .from('projects').select('*').eq('id', id).eq('studio_id', user.id).single()
  if (!project) notFound()

  // Mark notifications read
  await markProjectNotificationsRead(id)

  // Fetch photos
  const { data: photos = [] } = await supabase
    .from('photos').select('*').eq('project_id', id).order('sort_order')

  const { data: retouchedPhotos = [] } = await supabase
    .from('retouched_photos').select('*').eq('project_id', id).order('sort_order')

  const { data: selections = [] } = await supabase
    .from('selections').select('*').eq('project_id', id)

  const { data: annotations = [] } = await supabase
    .from('annotations').select('*').eq('project_id', id)

  const { data: revisionRequest } = await supabase
    .from('revision_requests').select('*').eq('project_id', id).single()

  // Generate signed URLs for original photos
  const photoUrls: PhotoWithUrl[] = await Promise.all(
    (photos as Photo[]).map(async (p) => {
      const { data } = await supabase.storage.from('originals').createSignedUrl(p.storage_path, 3600)
      return { ...p, signedUrl: data?.signedUrl || '' }
    })
  )

  // Generate signed URLs for retouched photos
  const retouchedUrls: RetouchedPhotoWithUrl[] = await Promise.all(
    (retouchedPhotos as RetouchedPhoto[]).map(async (p) => {
      const { data } = await supabase.storage.from('retouched').createSignedUrl(p.storage_path, 3600)
      return { ...p, signedUrl: data?.signedUrl || '' }
    })
  )

  const unreadCount = await getUnreadCount()
  const selectedPhotoIds = Array.from(
    new Set((selections as Selection[]).filter(s => s.status === 'selected').map(s => s.photo_id))
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar unreadCount={unreadCount} />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>
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
              {project.deadline && <span style={{ fontSize: 12, color: '#f59e0b' }}>마감 {formatDate(project.deadline)}</span>}
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
        />
      </div>
    </div>
  )
}
