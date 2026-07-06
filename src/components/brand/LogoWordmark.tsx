/**
 * STUDIO. HOLYMOLLY wordmark — typeset recreation of the studio
 * logotype in the site's display face (Jost, Futura-family).
 * `stacked` renders the two-line lockup used at display sizes.
 */
export default function LogoWordmark({
  stacked = false,
  className,
}: {
  stacked?: boolean
  className?: string
}) {
  if (stacked) {
    return (
      <span className={`hm-wordmark hm-display ${className ?? ''}`}>
        STUDIO.
        <br />
        HOLYMOLLY
      </span>
    )
  }
  return (
    <span className={`hm-wordmark hm-display ${className ?? ''}`}>
      STUDIO. HOLYMOLLY
    </span>
  )
}
