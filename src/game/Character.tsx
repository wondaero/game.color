// Placeholder character built from plain divs (no SVG) — a circle head + a square/rect
// cloth block. Cheap to render and iterate on while real character art isn't in yet;
// only the cloth color varies per character.

export interface CharacterProps {
  clothColor: string
  width: number
  height: number
  onTap?: () => void
  highlight?: 'correct' | 'wrong' | null
}

export function Character({ clothColor, width, height, onTap, highlight }: CharacterProps) {
  const headSize = width
  const clothHeight = Math.max(0, height - headSize)

  return (
    <div
      onClick={onTap}
      role={onTap ? 'button' : undefined}
      style={{
        position: 'relative',
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: onTap ? 'pointer' : 'default',
      }}
    >
      <span
        style={{
          width: headSize,
          height: headSize,
          borderRadius: '50%',
          background: '#f2c9a0',
          flexShrink: 0,
        }}
      />
      <span
        style={{
          width,
          height: clothHeight,
          background: clothColor,
        }}
      />

      {highlight && (
        <div
          style={{
            position: 'absolute',
            inset: -6,
            borderRadius: 10,
            border: `3px solid ${highlight === 'correct' ? '#2ecc71' : '#e74c3c'}`,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  )
}
