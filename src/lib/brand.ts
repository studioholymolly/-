/**
 * Studio branding — single source of truth.
 *
 * To customize for your own studio, set these in `.env.local` (or in Vercel
 * project settings for production):
 *
 *   NEXT_PUBLIC_STUDIO_NAME="스튜디오 이름"
 *   NEXT_PUBLIC_STUDIO_SHORT_NAME="짧은 이름"
 *
 * `NEXT_PUBLIC_*` variables are baked into the client bundle at build time,
 * so changing them requires a redeploy.
 */
export const STUDIO_NAME =
  process.env.NEXT_PUBLIC_STUDIO_NAME || '스튜디오 홀리몰리'

export const STUDIO_SHORT_NAME =
  process.env.NEXT_PUBLIC_STUDIO_SHORT_NAME || '홀리몰리'
