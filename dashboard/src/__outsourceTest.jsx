// 프로젝트 폼 외주 담당 선택 시각 검증용 하네스 — /__outsource_test.html 에서만 사용 (배포 번들에 포함되지 않음)
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { addItem } from './data.js'
import { ProjectForm } from './pages/Projects.jsx'
import { ProjectDetail } from './ProjectBits.jsx'
import './styles.css'

// supabase 저장은 미인증이라 조용히 실패 — 로컬 상태만 채워서 폼 UI 검증
const U = 'test-user'
addItem('vendors', { name: '박서연 실장', kind: '헤어·메이크업', settle: '3.3%', contact: '' }, U)
addItem('vendors', { name: '김지원', kind: '스타일리스트', settle: '3.3%', contact: '' }, U)
addItem('vendors', { name: '정민아', kind: '스타일리스트', settle: '계산서', contact: '' }, U)
addItem('vendors', { name: '이현우', kind: '리터처', settle: '계산서', contact: '' }, U)
addItem('vendors', { name: '오세영', kind: '디자인', settle: '계산서', contact: '' }, U)
addItem('clients', { name: '마뗑킴', contact: '', kind: '기존' }, U)

const user = { id: U, name: '테스트', role: 'admin', active: true }

function Harness() {
  const [saved, setSaved] = useState(null)
  if (saved) {
    return <ProjectDetail p={{ id: 'px', stage: 'inquiry', attachments: [], ...saved }} user={user} onClose={() => setSaved(null)} />
  }
  return (
    <ProjectForm stage="inquiry" taskCount={0} user={user}
      onClose={() => {}}
      onSave={(d) => { console.log('SAVE_PAYLOAD', JSON.stringify(d)); setSaved(d) }} />
  )
}

createRoot(document.getElementById('root')).render(<Harness />)
