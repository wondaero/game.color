import { useMemo, useState } from 'react'
import { Character } from './Character'
import { DELTA_E_HARD_FLOOR, generateOddColor, randomBaseColor } from './color'
import { computeGridMetrics } from './gridLayout'
import { useElementSize } from './useElementSize'

export interface RoundMeta {
  targetDeltaE: number
  actualDeltaE: number
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

  const metrics = useMemo(() => computeGridMetrics(size, characterCount), [size, characterCount])
  const ready = metrics.squareSide > 0

  const round = useMemo(() => {
    if (!ready) return null

    const answerIndex = Math.floor(Math.random() * characterCount)
    const baseColor = randomBaseColor()
    const odd = generateOddColor(baseColor, Math.max(targetDeltaE, DELTA_E_HARD_FLOOR))

    return { answerIndex, baseColor, odd }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, characterCount, targetDeltaE, roundKey])

  const handleTap = (index: number) => {
    if (!round || tappedIndex !== null) return
    setTappedIndex(index)
    const correct = index === round.answerIndex
    onAnswer(correct, { targetDeltaE, actualDeltaE: round.odd.actualDeltaE })
  }

  return (
    <div ref={ref} className="board-viewport">
      {round && (
        <div
          className="board-grid"
          style={{
            width: metrics.squareSide,
            height: metrics.squareSide,
            gridTemplateColumns: `repeat(${metrics.gridSide}, 1fr)`,
            gridTemplateRows: `repeat(${metrics.gridSide}, 1fr)`,
          }}
        >
          {Array.from({ length: characterCount }, (_, i) => {
            const isAnswer = i === round.answerIndex
            const highlight = tappedIndex === i ? (isAnswer ? 'correct' : 'wrong') : tappedIndex !== null && isAnswer ? 'correct' : null

            return (
              <div key={i} className="board-cell">
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
