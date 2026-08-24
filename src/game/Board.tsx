import { useMemo, useState } from 'react'
import { computeBoardMetrics } from './boardLayout'
import { Character } from './Character'
import { DELTA_E_HARD_FLOOR, generateOddColor, randomBaseColor } from './color'
import { polygonBounds } from './geometry'
import { generateRoundLayout } from './placement'
import { useElementSize } from './useElementSize'

export interface RoundMeta {
  targetDeltaE: number
  actualDeltaE: number
  answerNeighborDist: number
}

interface BoardProps {
  characterCount: number
  targetDeltaE: number
  roundKey: number
  onAnswer: (correct: boolean, meta: RoundMeta) => void
}

export function Board({ characterCount, targetDeltaE, roundKey, onAnswer }: BoardProps) {
  const { ref, size } = useElementSize<HTMLDivElement>()
  const [tappedIndex, setTappedIndex] = useState<number | null>(null)

  const metrics = useMemo(() => computeBoardMetrics(size, characterCount), [size, characterCount])
  const ready = metrics.squareSide > 0

  const round = useMemo(() => {
    if (!ready) return null

    // Neighbor-distance validation range scales with the board so it stays meaningful
    // across device sizes instead of a fixed pixel band tuned for one screen.
    const answerNeighborDistRange: [number, number] = [metrics.squareSide * 0.2, metrics.squareSide * 0.45]

    const layout = generateRoundLayout({
      polygon: metrics.polygon,
      characterCount,
      boxWidth: metrics.boxWidth,
      boxHeight: metrics.boxHeight,
      gap: metrics.gap,
      answerNeighborDistRange,
    })

    const baseColor = randomBaseColor()
    const odd = generateOddColor(baseColor, Math.max(targetDeltaE, DELTA_E_HARD_FLOOR))

    return { layout, baseColor, odd }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, characterCount, targetDeltaE, roundKey, metrics.squareSide])

  const handleTap = (index: number) => {
    if (!round || tappedIndex !== null) return
    setTappedIndex(index)
    const correct = index === round.layout.answerIndex
    onAnswer(correct, {
      targetDeltaE,
      actualDeltaE: round.odd.actualDeltaE,
      answerNeighborDist: round.layout.answerNeighborDist,
    })
  }

  const bounds = polygonBounds(metrics.polygon)

  return (
    <div ref={ref} className="board-viewport">
      {round && (
        <div className="board-square" style={{ width: metrics.squareSide, height: metrics.squareSide }}>
          <svg
            width={metrics.squareSide}
            height={metrics.squareSide}
            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
          >
            <polygon
              points={metrics.polygon.map((p) => `${p.x - bounds.minX},${p.y - bounds.minY}`).join(' ')}
              fill="none"
              stroke="rgba(0,0,0,0.08)"
              strokeDasharray="4 4"
            />
          </svg>

          {round.layout.positions.map((p, i) => {
            const isAnswer = i === round.layout.answerIndex
            const highlight = tappedIndex === i ? (isAnswer ? 'correct' : 'wrong') : tappedIndex !== null && isAnswer ? 'correct' : null

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: p.x - bounds.minX - metrics.boxWidth / 2,
                  top: p.y - bounds.minY - metrics.boxHeight / 2,
                }}
              >
                <Character
                  clothColor={isAnswer ? round.odd.hex : round.baseColor}
                  width={metrics.boxWidth}
                  height={metrics.boxHeight}
                  onTap={() => handleTap(i)}
                  highlight={highlight}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
