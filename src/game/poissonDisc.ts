import { boxesSeparated, pointInPolygon, polygonBounds, type Point } from './geometry'

export interface PoissonDiscOptions {
  polygon: Point[]
  /** Character bounding-box width/height — placement uses rectangle separation, not a single radius. */
  boxWidth: number
  boxHeight: number
  /** Extra clearance on top of the bounding boxes (touch-target buffer). */
  gap: number
  maxPoints?: number
  maxAttemptsPerPoint?: number
}

/**
 * Bridson's Poisson-disc algorithm, adapted for rectangular (bounding-box) footprints
 * confined to an arbitrary polygon instead of a rectangular canvas. Candidate points
 * are still generated in an annulus around active points (this is what keeps the
 * distribution organic instead of grid-like); acceptance is a polygon containment
 * check plus a rectangle-separation check against nearby placed points.
 */
export function poissonDiscSample(options: PoissonDiscOptions): Point[] {
  const { polygon, boxWidth, boxHeight, gap, maxPoints = 200, maxAttemptsPerPoint = 30 } = options
  const bounds = polygonBounds(polygon)

  // Reference radius for candidate spacing/grid sizing. Using the larger footprint
  // dimension keeps the acceleration grid conservative for non-square boxes.
  const r = Math.max(boxWidth, boxHeight) + gap
  const cellSize = r / Math.SQRT2
  const gridW = Math.max(1, Math.ceil((bounds.maxX - bounds.minX) / cellSize))
  const gridH = Math.max(1, Math.ceil((bounds.maxY - bounds.minY) / cellSize))
  const grid: (number | null)[] = new Array(gridW * gridH).fill(null)

  const cellOf = (p: Point) => {
    const gx = Math.min(gridW - 1, Math.max(0, Math.floor((p.x - bounds.minX) / cellSize)))
    const gy = Math.min(gridH - 1, Math.max(0, Math.floor((p.y - bounds.minY) / cellSize)))
    return { gx, gy }
  }

  const points: Point[] = []
  const active: number[] = []

  const isValid = (candidate: Point): boolean => {
    if (!pointInPolygon(candidate, polygon)) return false

    const { gx, gy } = cellOf(candidate)
    // A rectangle's neighbors can lie outside the ±1 cell ring the classic circle
    // algorithm checks, since cellSize was sized off `r`, not the exact box diagonal.
    for (let ny = gy - 2; ny <= gy + 2; ny++) {
      if (ny < 0 || ny >= gridH) continue
      for (let nx = gx - 2; nx <= gx + 2; nx++) {
        if (nx < 0 || nx >= gridW) continue
        const idx = grid[ny * gridW + nx]
        if (idx === null) continue
        if (!boxesSeparated(candidate, boxWidth, boxHeight, points[idx], boxWidth, boxHeight, gap)) {
          return false
        }
      }
    }
    return true
  }

  const place = (p: Point) => {
    const index = points.length
    points.push(p)
    active.push(index)
    const { gx, gy } = cellOf(p)
    grid[gy * gridW + gx] = index
  }

  let seed: Point | null = null
  for (let i = 0; i < 1000; i++) {
    const candidate = {
      x: bounds.minX + Math.random() * (bounds.maxX - bounds.minX),
      y: bounds.minY + Math.random() * (bounds.maxY - bounds.minY),
    }
    if (pointInPolygon(candidate, polygon)) {
      seed = candidate
      break
    }
  }
  if (!seed) return []
  place(seed)

  while (active.length > 0 && points.length < maxPoints) {
    const activeSlot = Math.floor(Math.random() * active.length)
    const originIndex = active[activeSlot]
    const origin = points[originIndex]

    let found = false
    for (let attempt = 0; attempt < maxAttemptsPerPoint; attempt++) {
      const angle = Math.random() * Math.PI * 2
      const radius = r + Math.random() * r // annulus: [r, 2r]
      const candidate = {
        x: origin.x + Math.cos(angle) * radius,
        y: origin.y + Math.sin(angle) * radius,
      }
      if (isValid(candidate)) {
        place(candidate)
        found = true
        break
      }
    }

    if (!found) active.splice(activeSlot, 1)
  }

  return points
}
