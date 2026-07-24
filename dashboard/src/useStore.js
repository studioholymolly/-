import { useSyncExternalStore } from 'react'
import { subscribe, getState } from './data.js'

// 스토어가 바뀔 때마다 컴포넌트를 다시 그린다 (공유 데이터 반영)
export function useStore() {
  return useSyncExternalStore(subscribe, getState, getState)
}
