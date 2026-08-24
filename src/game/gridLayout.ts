// Width:height ratio of the fixed character art (see Character.tsx's design-space viewBox).
const CHARACTER_ASPECT = 48 / 72

export interface GridMetrics {
  squareSide: number
  gridSide: number
  boxWidth: number
  boxHeight: number
}

/**
 * Fixed grid layout (no Poisson-disc/organic placement — the game reads better as a
 * clean N x N grid, e.g. 25 characters as 5x5). The square play area comes from the
 * device's smaller dimension, with margins; each character is sized to fit its cell.
 */
export function computeGridMetrics(container: { width: number; height: number }, characterCount: number, margin = 16): GridMetrics {
  const squareSide = Math.max(0, Math.min(container.width, container.height) - margin * 2)
  const gridSide = Math.max(1, Math.round(Math.sqrt(characterCount)))
  const cellSide = squareSide / gridSide

  const boxHeight = cellSide * 0.7
  const boxWidth = boxHeight * CHARACTER_ASPECT

  return { squareSide, gridSide, boxWidth, boxHeight }
}
