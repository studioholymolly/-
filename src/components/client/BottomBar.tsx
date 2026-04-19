'use client'

interface Props {
  totalCount: number
  selectedCount: number
  onSubmit: () => void
}

export default function BottomBar({ totalCount, selectedCount, onSubmit }: Props) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'rgba(10,10,12,0.95)',
      backdropFilter: 'blur(12px)',
      borderTop: '1px solid #28282e',
      padding: '14px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#22c55e' }}>{selectedCount}</span>
          <span style={{ fontSize: 13, color: '#7070a0' }}> / {totalCount}장 선택됨</span>
        </div>
        {/* Progress bar */}
        <div style={{ width: 120, height: 4, background: '#28282e', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            width: `${totalCount > 0 ? (selectedCount / totalCount) * 100 : 0}%`,
            height: '100%', background: '#22c55e',
            borderRadius: 2, transition: 'width 0.3s',
          }} />
        </div>
      </div>
      <button
        onClick={onSubmit}
        disabled={selectedCount === 0}
        style={{
          background: selectedCount === 0 ? '#374151' : 'linear-gradient(135deg,#16a34a,#22c55e)',
          color: selectedCount === 0 ? '#6b7280' : '#fff',
          border: 'none', padding: '11px 24px',
          borderRadius: 8, fontSize: 14, fontWeight: 700,
          cursor: selectedCount === 0 ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
        }}
      >
        {selectedCount === 0 ? '사진을 선택해 주세요' : `셀렉 완료 (${selectedCount}장) →`}
      </button>
    </div>
  )
}
