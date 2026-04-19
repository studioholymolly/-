import { createClient } from '@/lib/supabase/server'
import { Project, PhotoWithUrl, RetouchedPhotoWithUrl } from '@/lib/types'
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
      <div style={{ minHeight: '100vh', background: '#0a0a0c', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f0f0f4' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>링크를 찾을 수 없습니다</h2>
          <p style={{ fontSize: 13, color: '#7070a0' }}>유효하지 않은 링크이거나 만료된 링크입니다</p>
        </div>
      </div>
    )
  }

  // Get photos with signed URLs
  const { data: photos = [] } = await supabase
    .from('photos')
    .select('*')
    .eq('project_id', project.id)
    .order('sort_order')

  const { data: retouchedPhotos = [] } = await supabase
    .from('retouched_photos')
    .select('*')
    .eq('project_id', project.id)
    .order('sort_order')

  // Generate signed URLs for originals
  const photoUrls: PhotoWithUrl[] = await Promise.all(
    (photos ?? []).map(async (p: any) => {
      const { data } = await supabase.storage.from('originals').createSignedUrl(p.storage_path, 3600)
      return { ...p, signedUrl: data?.signedUrl || '' }
    })
  )

  // Generate signed URLs for retouched
  const retouchedUrls: RetouchedPhotoWithUrl[] = await Promise.all(
    (retouchedPhotos ?? []).map(async (p: any) => {
      const { data } = await supabase.storage.from('retouched').createSignedUrl(p.storage_path, 3600)
      return { ...p, signedUrl: data?.signedUrl || '' }
    })
  )

  return (
    <ClientGallery
      project={project as Project}
      photos={photoUrls}
      retouchedPhotos={retouchedUrls}
      shareToken={token}
    />
  )
}
