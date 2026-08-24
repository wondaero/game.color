// Placeholder character: fixed head + body silhouette shared by every character,
// with only the cloth (torso) path taking a color prop. This is the seam where the
// real illustration set swaps in later — everything outside `clothColor` stays fixed.

// Design-space coordinates the fixed paths below are authored in. Rendered size is
// controlled separately via width/height props — the SVG viewBox scales the art to fit.
const VIEW_WIDTH = 48
const VIEW_HEIGHT = 72

export interface CharacterProps {
  clothColor: string
  width: number
  height: number
  onTap?: () => void
  highlight?: 'correct' | 'wrong' | null
}

export function Character({ clothColor, width, height, onTap, highlight }: CharacterProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      onClick={onTap}
      role={onTap ? 'button' : undefined}
      style={{ cursor: onTap ? 'pointer' : 'default', overflow: 'visible' }}
    >
      {/* head — fixed for every character */}
      <circle cx={24} cy={16} r={14} fill="#f2c9a0" />
      {/* torso/cloth — the only part that varies */}
      <path d="M12,32 L36,32 L42,70 L6,70 Z" fill={clothColor} />

      {highlight && (
        <circle
          cx={24}
          cy={36}
          r={38}
          fill="none"
          stroke={highlight === 'correct' ? '#2ecc71' : '#e74c3c'}
          strokeWidth={3}
        />
      )}
    </svg>
  )
}
