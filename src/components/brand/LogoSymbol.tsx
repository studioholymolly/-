/**
 * HLML oval monogram — vector recreation of the studio symbol.
 * Drawn with straight condensed letterforms inside the oval ring;
 * swap the paths for the official asset if an SVG original arrives.
 * Inherits color via `currentColor`.
 */
export default function LogoSymbol({
  size = 28,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={Math.round(size * (250 / 300))}
      viewBox="0 0 300 250"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <ellipse
        cx="150"
        cy="125"
        rx="137"
        ry="111"
        stroke="currentColor"
        strokeWidth="15"
      />
      {/* H */}
      <rect x="60" y="68" width="12" height="114" fill="currentColor" />
      <rect x="90" y="62" width="12" height="126" fill="currentColor" />
      <rect x="72" y="119" width="18" height="12" fill="currentColor" />
      {/* L */}
      <rect x="110" y="58" width="12" height="132" fill="currentColor" />
      <path d="M110 190v-12h32v12h-32Z" fill="currentColor" />
      {/* M */}
      <rect x="150" y="55" width="12" height="140" fill="currentColor" />
      <rect x="196" y="58" width="12" height="134" fill="currentColor" />
      <path
        d="M162 55l17 76 17-76h-10.5l-6.5 32-6.5-32H162Z"
        fill="currentColor"
      />
      {/* L */}
      <rect x="216" y="62" width="12" height="126" fill="currentColor" />
      <path d="M216 188v-12h28v12h-28Z" fill="currentColor" />
    </svg>
  )
}
