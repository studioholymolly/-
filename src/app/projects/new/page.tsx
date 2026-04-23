import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createProject } from '@/lib/actions/projects'
import Navbar from '@/components/Navbar'

async function handleCreate(formData: FormData): Promise<void> {
  'use server'
  await createProject(formData)
}

export default async function NewProjectPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>새 프로젝트</h1>
        <p style={{ fontSize: 13, color: 'var(--mu)', marginBottom: 32 }}>프로젝트를 생성하면 클라이언트에게 공유 링크를 보낼 수 있습니다</p>

        <form action={handleCreate}>
          <div style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="프로젝트명 *" name="name" placeholder="예: 2025 봄 룩북" required />
              <Field label="클라이언트명 *" name="client_name" placeholder="예: 닥터리쥬올" required />
              <Field label="클라이언트 이메일 *" name="client_email" type="email" placeholder="client@example.com" required />
              <Field label="셀렉 마감일" name="deadline" type="date" />
            </div>
            <Field
              label="클라이언트 안내 메시지"
              name="custom_message"
              type="textarea"
              defaultValue="마음에 드시는 사진을 모두 선택해 주세요. 수정 요청은 각 사진에 핀을 추가해 남겨주세요 😊"
            />

            <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #6d28d9, #7c3aed)',
                  color: '#fff', padding: '11px 24px',
                  borderRadius: 8, fontSize: 14, fontWeight: 700,
                  border: 'none', cursor: 'pointer',
                }}
              >프로젝트 생성</button>
              <a href="/dashboard" style={{
                background: 'var(--s2)', border: '1px solid var(--bd2)',
                color: 'var(--tx)', padding: '11px 20px',
                borderRadius: 8, fontSize: 14, fontWeight: 600,
                textDecoration: 'none',
              }}>취소</a>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, name, type = 'text', placeholder = '', required = false, defaultValue = '' }: {
  label: string; name: string; type?: string; placeholder?: string; required?: boolean; defaultValue?: string
}) {
  const baseStyle: React.CSSProperties = {
    background: 'var(--s2)', border: '1px solid var(--bd)',
    color: 'var(--tx)', padding: '9px 12px',
    borderRadius: 8, fontSize: 13, fontFamily: 'inherit',
    width: '100%', outline: 'none',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: type === 'textarea' ? '1/-1' : undefined }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>
      {type === 'textarea'
        ? <textarea name={name} placeholder={placeholder} defaultValue={defaultValue} rows={3} style={{ ...baseStyle, resize: 'vertical' }} />
        : <input name={name} type={type} placeholder={placeholder} defaultValue={defaultValue} required={required} style={baseStyle} />
      }
    </div>
  )
}
