import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from './supabase.js'
import { initData, teardownData, getMember } from './data.js'
import { useStore } from './useStore.js'

export const AuthCtx = createContext(null) // export: __tasksTest 등 시각 검증 하네스에서 목 유저 주입용

export function AuthProvider({ children }) {
  useStore() // 멤버 정보(이름·역할·비활성화)가 바뀌면 즉시 반영
  const [uid, setUid] = useState(null)
  const [bootProfile, setBootProfile] = useState(null) // 스토어 로딩 전 임시 프로필
  const [booting, setBooting] = useState(true)
  const [notice, setNotice] = useState('') // 승인 대기 등 로그인 화면 안내
  const bootedFor = useRef(null)

  useEffect(() => {
    let mounted = true

    async function boot(session) {
      if (!session) {
        bootedFor.current = null
        setUid(null); setBootProfile(null); setBooting(false)
        return
      }
      const id = session.user.id
      if (bootedFor.current === id) return // 토큰 갱신 등 중복 이벤트 무시
      bootedFor.current = id
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle()
      if (!mounted) return
      if (!prof || !prof.active) {
        setNotice(prof ? '가입 확인됨 — 관리자가 팀 관리에서 활성화하면 이용할 수 있습니다.' : '프로필을 찾을 수 없습니다. 관리자에게 문의하세요.')
        setBooting(false)
        bootedFor.current = null
        await supabase.auth.signOut()
        return
      }
      setBootProfile({ id: prof.id, name: prof.name, role: prof.role, title: prof.title || '', active: true, email: prof.email })
      setUid(id)
      setBooting(false)
      initData()
    }

    supabase.auth.getSession().then(({ data }) => boot(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') boot(session)
      if (event === 'SIGNED_OUT') {
        bootedFor.current = null
        setUid(null); setBootProfile(null)
        teardownData()
      }
      if (event === 'PASSWORD_RECOVERY') {
        const pw = window.prompt('새 비밀번호를 입력하세요 (6자 이상)')
        if (pw && pw.length >= 6) supabase.auth.updateUser({ password: pw }).then(() => alert('비밀번호가 변경되었습니다.'))
      }
    })
    return () => { mounted = false; sub.subscription.unsubscribe() }
  }, [])

  const login = useCallback(async (email, pass) => {
    setNotice('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
    if (!error) return null
    if (error.message.includes('Invalid login credentials')) return '이메일 또는 비밀번호가 올바르지 않습니다.'
    if (error.message.includes('Email not confirmed')) return '이메일 확인이 필요합니다. 받은 메일함의 확인 링크를 눌러주세요.'
    return error.message
  }, [])

  // 첫 가입 (대표 계정) — 그 외 이메일은 "승인 대기" 직원으로 생성됨
  const signup = useCallback(async (email, pass, name) => {
    setNotice('')
    const { data, error } = await supabase.auth.signUp({ email, password: pass, options: { data: { name } } })
    if (error) return error.message
    if (!data.user || data.user.identities?.length === 0) return '이미 가입된 이메일입니다. 로그인해 주세요.'
    if (!data.session) return 'CONFIRM_EMAIL' // 이메일 확인이 켜져 있는 경우
    return null
  }, [])

  const logout = useCallback(() => { supabase.auth.signOut() }, [])

  // 스토어의 멤버 정보가 우선 (이름·역할 변경, 비활성화 즉시 반영)
  const fromStore = uid ? getMember(uid) : null
  const user = uid ? (fromStore ? (fromStore.active ? fromStore : null) : bootProfile) : null
  const isAdmin = user?.role === 'admin'

  return (
    <AuthCtx.Provider value={{ user, login, signup, logout, isAdmin, booting, notice }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth() { return useContext(AuthCtx) }
