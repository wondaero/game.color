export interface Point {
  x: number
  y: number
}

/** Ray-casting point-in-polygon test. Polygon is a closed ring (last point need not repeat the first). */
export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y

    const intersects =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi

    if (intersects) inside = !inside
  }
  return inside
}

export function polygonBounds(polygon: Point[]) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of polygon) {
    if (p.x < minX) minX = p.x
    if (p.y < minY) minY = p.y
    if (p.x > maxX) maxX = p.x
    if (p.y > maxY) maxY = p.y
  }
  return { minX, minY, maxX, maxY }
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/**
 * Characters are rectangles (bounding boxes), not circles, so a plain center-distance
 * check under-rejects diagonal neighbors and over-rejects axis-aligned ones.
 * Two axis-aligned boxes (each centered on its point) are separated once either axis
 * clears its own combined half-width/half-height + gap.
 */
export function boxesSeparated(
  a: Point,
  aw: number,
  ah: number,
  b: Point,
  bw: number,
  bh: number,
  gap: number,
): boolean {
  const dx = Math.abs(a.x - b.x)
  const dy = Math.abs(a.y - b.y)
  const minDx = (aw + bw) / 2 + gap
  const minDy = (ah + bh) / 2 + gap
  return dx >= minDx || dy >= minDy
}
