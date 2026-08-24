import type { Point } from './geometry'

// Width:height ratio of the fixed character art (see Character.tsx's design-space viewBox).
const CHARACTER_ASPECT = 48 / 72

export interface BoardMetrics {
  squareSide: number
  polygon: Point[]
  boxWidth: number
  boxHeight: number
  gap: number
}

/**
 * Derives the square play area from the device's available space (its *smaller*
 * dimension, per spec §"기기크기에 맞춰서 정사각형"), then sizes characters and their
 * minimum spacing off a conceptual `gridSide x gridSide` density grid — e.g. 25
 * characters reads as a 5x5 grid for sizing purposes only. Actual placement stays
 * Poisson-disc/organic; the grid here just answers "how much room does each character get."
 */
// Poisson-disc sampling is random growth, not a perfect packing — it reliably fills
// only a fraction of the area a same-spacing regular grid would. Sizing characters as
// if the 5x5 grid cell were the real per-character budget leaves Bridson's algorithm no
// slack, so it starves before reaching 25 points. This factor shrinks the *spacing*
// target below the naive grid cell so 25 organically-placed characters actually fit.
const PACKING_SAFETY = 0.68

export function computeBoardMetrics(container: { width: number; height: number }, characterCount: number, margin = 16): BoardMetrics {
  const squareSide = Math.max(0, Math.min(container.width, container.height) - margin * 2)
  const gridSide = Math.max(1, Math.round(Math.sqrt(characterCount)))
  const spacing = (squareSide / gridSide) * PACKING_SAFETY

  const boxHeight = spacing * 0.58
  const boxWidth = boxHeight * CHARACTER_ASPECT
  // Falls short of the ~40-48px touch-error buffer at high density on small screens —
  // a known tension between "25 characters" and "device-fit square" (see spec §10).
  const gap = Math.max(12, spacing - boxHeight)

  const cut = squareSide * 0.14 // corner cut so the scene is a polygon, not a bare rectangle
  const polygon: Point[] = [
    { x: cut, y: 0 },
    { x: squareSide - cut, y: 0 },
    { x: squareSide, y: cut },
    { x: squareSide, y: squareSide - cut },
    { x: squareSide - cut, y: squareSide },
    { x: cut, y: squareSide },
    { x: 0, y: squareSide - cut },
    { x: 0, y: cut },
  ]

  return { squareSide, polygon, boxWidth, boxHeight, gap }
}
