import { distance, type Point } from './geometry'
import { poissonDiscSample } from './poissonDisc'

export interface RoundLayoutConfig {
  polygon: Point[]
  characterCount: number
  boxWidth: number
  boxHeight: number
  gap: number
  /**
   * Acceptable [min, max] center-to-center distance from the answer character to its
   * nearest neighbor. Poisson-disc placement is random, so this range isn't guaranteed
   * by construction — this is the post-placement validation/retry step from the spec.
   */
  answerNeighborDistRange: [number, number]
  maxPlacementAttempts?: number
}

export interface RoundLayout {
  positions: Point[]
  answerIndex: number
  answerNeighborDist: number
}

function nearestNeighborDistance(index: number, positions: Point[]): number {
  let min = Infinity
  for (let i = 0; i < positions.length; i++) {
    if (i === index) continue
    const d = distance(positions[index], positions[i])
    if (d < min) min = d
  }
  return min
}

function shuffledIndices(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// When Poisson-disc can't fit `characterCount` at all (a very cramped polygon/box/gap
// combination), placing fewer characters beats throwing and crashing the round —
// so a count shortfall is weighted far above a neighbor-distance mismatch below.
const SHORTFALL_PENALTY = 1_000_000

/**
 * Runs Poisson-disc placement and picks an answer index whose nearest-neighbor
 * distance falls inside `answerNeighborDistRange`. If no attempt places the full
 * `characterCount`, degrades to however many points it could fit rather than
 * throwing — a cramped device shouldn't crash the round.
 */
export function generateRoundLayout(config: RoundLayoutConfig): RoundLayout {
  const maxAttempts = config.maxPlacementAttempts ?? 20
  const [minDist, maxDist] = config.answerNeighborDistRange

  let best: RoundLayout | null = null
  let bestScore = Infinity

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const sampled = poissonDiscSample({
      polygon: config.polygon,
      boxWidth: config.boxWidth,
      boxHeight: config.boxHeight,
      gap: config.gap,
      maxPoints: config.characterCount * 3,
    })

    const chosenCount = Math.min(sampled.length, config.characterCount)
    if (chosenCount === 0) continue

    const shortfall = config.characterCount - chosenCount
    const chosen = shuffledIndices(sampled.length)
      .slice(0, chosenCount)
      .map((i) => sampled[i])

    for (const candidateIndex of shuffledIndices(chosen.length)) {
      const nnd = nearestNeighborDistance(candidateIndex, chosen)
      const deviation = nnd < minDist ? minDist - nnd : nnd > maxDist ? nnd - maxDist : 0

      if (shortfall === 0 && deviation === 0) {
        return { positions: chosen, answerIndex: candidateIndex, answerNeighborDist: nnd }
      }

      const score = shortfall * SHORTFALL_PENALTY + deviation
      if (score < bestScore) {
        bestScore = score
        best = { positions: chosen, answerIndex: candidateIndex, answerNeighborDist: nnd }
      }
    }
  }

  if (best) return best

  throw new Error('Could not place a single character within the given polygon — check the polygon geometry.')
}
