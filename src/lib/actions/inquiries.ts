'use server'

import { createClient } from '@/lib/supabase/server'

export type InquiryResult = { ok: true } | { error: string }

const SHOOT_TYPES = ['뷰티', '제품', 'F&B', '의류', '인물', '영상', 'BX 디자인', '기타'] as const
const BUDGETS = ['150~300만 원', '300~500만 원', '500~1,000만 원', '1,000만 원 이상', '아직 미정'] as const

export async function submitInquiry(formData: FormData): Promise<InquiryResult> {
  // Honeypot: bots fill every field; humans never see this one.
  if (formData.get('website')) return { ok: true }

  const shoot_type = (formData.get('shoot_type') as string) || ''
  const project_name = ((formData.get('project_name') as string) || '').trim()
  const name = ((formData.get('name') as string) || '').trim()
  const contact = ((formData.get('contact') as string) || '').trim()
  const preferred_date = (formData.get('preferred_date') as string) || null
  const delivery_date = (formData.get('delivery_date') as string) || null
  const budget = (formData.get('budget') as string) || null
  const reference_url = ((formData.get('reference_url') as string) || '').trim()
  const message = ((formData.get('message') as string) || '').trim()

  if (!SHOOT_TYPES.includes(shoot_type as (typeof SHOOT_TYPES)[number])) {
    return { error: '작업 종류를 선택해 주세요.' }
  }
  if (!project_name || project_name.length > 200) {
    return { error: '프로젝트명(브랜드명)을 확인해 주세요.' }
  }
  if (!name || name.length > 100) {
    return { error: '성함을 확인해 주세요.' }
  }
  if (!contact || contact.length > 200) {
    return { error: '연락처를 확인해 주세요.' }
  }
  if (!message || message.length > 4000) {
    return { error: '문의 내용을 확인해 주세요. (최대 4,000자)' }
  }
  if (budget && !BUDGETS.includes(budget as (typeof BUDGETS)[number])) {
    return { error: '예산 범위를 다시 선택해 주세요.' }
  }
  if (reference_url.length > 500) {
    return { error: '참고 자료 링크가 너무 깁니다. (최대 500자)' }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.from('inquiries').insert({
      shoot_type,
      project_name,
      name,
      contact,
      preferred_date: preferred_date || null,
      delivery_date: delivery_date || null,
      budget: budget || null,
      reference_url: reference_url || null,
      message,
    })
    if (error) throw error
  } catch (err) {
    console.error('submitInquiry error:', err)
    return { error: '전송 중 문제가 발생했어요. 잠시 후 다시 시도하거나 이메일로 문의해 주세요.' }
  }

  return { ok: true }
}
