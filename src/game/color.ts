// sRGB <-> CIE Lab (D65) conversions and a ΔE-driven "odd color" generator.
// Perceptual difficulty is tuned by picking a target ΔE (CIE76, Euclidean distance
// in Lab space) rather than raw RGB offsets, so the same difficulty setting reads
// consistently across the whole color range.

export interface Rgb {
  r: number
  g: number
  b: number
}

export interface Lab {
  L: number
  a: number
  b: number
}

// Perceptually indistinguishable below this — never generate a pair closer than this.
export const DELTA_E_HARD_FLOOR = 2.3

export function hexToRgb(hex: string): Rgb {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return { r, g, b }
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const toHex = (v: number) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

const D65 = { x: 0.95047, y: 1.0, z: 1.08883 }

function srgbToLinear(c: number): number {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

function linearToSrgb(v: number): number {
  const c = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055
  return c * 255
}

function labF(t: number): number {
  const delta = 6 / 29
  return t > delta ** 3 ? Math.cbrt(t) : t / (3 * delta ** 2) + 4 / 29
}

function labFInv(t: number): number {
  const delta = 6 / 29
  return t > delta ? t ** 3 : (t - 4 / 29) * 3 * delta ** 2
}

export function rgbToLab({ r, g, b }: Rgb): Lab {
  const rl = srgbToLinear(r)
  const gl = srgbToLinear(g)
  const bl = srgbToLinear(b)

  const x = (0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl) / D65.x
  const y = (0.2126729 * rl + 0.7151522 * gl + 0.072175 * bl) / D65.y
  const z = (0.0193339 * rl + 0.119192 * gl + 0.9503041 * bl) / D65.z

  const fx = labF(x)
  const fy = labF(y)
  const fz = labF(z)

  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  }
}

export function labToRgb({ L, a, b }: Lab): Rgb {
  const fy = (L + 16) / 116
  const fx = fy + a / 500
  const fz = fy - b / 200

  const x = D65.x * labFInv(fx)
  const y = D65.y * labFInv(fy)
  const z = D65.z * labFInv(fz)

  const rl = 3.2404542 * x - 1.5371385 * y - 0.4985314 * z
  const gl = -0.969266 * x + 1.8760108 * y + 0.041556 * z
  const bl = 0.0556434 * x - 0.2040259 * y + 1.0572252 * z

  return {
    r: clamp(linearToSrgb(rl), 0, 255),
    g: clamp(linearToSrgb(gl), 0, 255),
    b: clamp(linearToSrgb(bl), 0, 255),
  }
}

export function deltaE76(a: Lab, b: Lab): number {
  return Math.hypot(a.L - b.L, a.a - b.a, a.b - b.b)
}

export interface OddColorResult {
  hex: string
  actualDeltaE: number
}

/**
 * Perturbs `baseHex` by a random direction in Lab space so the result is
 * approximately `targetDeltaE` away from it, then re-measures the actual ΔE
 * after sRGB gamut clipping (perturbing near-boundary colors can clip harder
 * than the target). Retries a few directions and keeps the closest-to-target
 * result that still clears DELTA_E_HARD_FLOOR.
 */
export function generateOddColor(baseHex: string, targetDeltaE: number, maxAttempts = 40): OddColorResult {
  const target = Math.max(targetDeltaE, DELTA_E_HARD_FLOOR)
  const baseLab = rgbToLab(hexToRgb(baseHex))

  let best: OddColorResult | null = null

  for (let i = 0; i < maxAttempts; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const dir = {
      L: Math.sin(phi) * Math.cos(theta),
      a: Math.sin(phi) * Math.sin(theta),
      b: Math.cos(phi),
    }

    const candidateLab: Lab = {
      L: clamp(baseLab.L + dir.L * target, 0, 100),
      a: baseLab.a + dir.a * target,
      b: baseLab.b + dir.b * target,
    }

    const rgb = labToRgb(candidateLab)
    const actualLab = rgbToLab(rgb)
    const actualDeltaE = deltaE76(baseLab, actualLab)

    if (actualDeltaE >= DELTA_E_HARD_FLOOR) {
      const result = { hex: rgbToHex(rgb), actualDeltaE }
      const isCloserToTarget = !best || Math.abs(actualDeltaE - target) < Math.abs(best.actualDeltaE - target)
      if (isCloserToTarget) best = result
      if (Math.abs(actualDeltaE - target) < 0.1) return result
    }
  }

  if (best) return best

  // Last-resort fallback: nudge lightness only, which never clips against the gamut edge.
  const fallbackLab: Lab = { ...baseLab, L: clamp(baseLab.L + DELTA_E_HARD_FLOOR, 0, 100) }
  const rgb = labToRgb(fallbackLab)
  return { hex: rgbToHex(rgb), actualDeltaE: deltaE76(baseLab, rgbToLab(rgb)) }
}

export function randomBaseColor(): string {
  const h = Math.floor(Math.random() * 360)
  const s = 55 + Math.random() * 30
  const l = 40 + Math.random() * 25
  return hslToHex(h, s, l)
}

function hslToHex(h: number, s: number, l: number): string {
  const sN = s / 100
  const lN = l / 100
  const k = (n: number) => (n + h / 30) % 12
  const a = sN * Math.min(lN, 1 - lN)
  const f = (n: number) => lN - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return rgbToHex({ r: 255 * f(0), g: 255 * f(8), b: 255 * f(4) })
}
