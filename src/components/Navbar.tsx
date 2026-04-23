import Link from 'next/link'
import { signOut } from '@/lib/actions/auth'
import { STUDIO_SHORT_NAME } from '@/lib/brand'

interface NavbarProps {
  unreadCount?: number
}

export default function Navbar({ unreadCount = 0 }: NavbarProps) {
  return (
    <nav style={{
      background: 'var(--s1)',
      borderBottom: '1px solid var(--bd)',
      padding: '0 24px',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <Link href="/dashboard" style={{ textDecoration: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>📷</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--tx)' }}>{STUDIO_SHORT_NAME}</span>
        </div>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link href="/projects/new" style={{
          background: 'var(--vio)',
          color: '#fff', padding: '7px 14px',
          borderRadius: 8, fontSize: 13, fontWeight: 700,
          textDecoration: 'none',
        }}>
          + 새 프로젝트
        </Link>

        {unreadCount > 0 && (
          <div style={{ position: 'relative' }}>
            <span style={{ fontSize: 20 }}>🔔</span>
            <span style={{
              position: 'absolute', top: -6, right: -6,
              background: 'var(--red)', color: '#fff',
              fontSize: 9, fontWeight: 800,
              padding: '1px 5px', borderRadius: 10,
              minWidth: 16, textAlign: 'center',
            }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
          </div>
        )}

        <form action={signOut}>
          <button type="submit" style={{
            background: 'none', border: '1px solid var(--bd2)',
            color: 'var(--mu)', padding: '6px 12px',
            borderRadius: 7, fontSize: 12, cursor: 'pointer',
          }}>로그아웃</button>
        </form>
      </div>
    </nav>
  )
}
