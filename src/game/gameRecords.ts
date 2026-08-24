// Local-only personal best (spec §6: "온라인 리더보드 없음 — 로컬 개인 최고 기록만 저장").
const BEST_STAGE_KEY = 'palette-dress-code:best-stage'

export function getBestStage(): number {
  try {
    const raw = localStorage.getItem(BEST_STAGE_KEY)
    return raw ? Number.parseInt(raw, 10) || 0 : 0
  } catch {
    return 0
  }
}

export function saveBestStage(stage: number): void {
  try {
    if (stage > getBestStage()) localStorage.setItem(BEST_STAGE_KEY, String(stage))
  } catch {
    // localStorage unavailable (private browsing, storage disabled) — best-effort only.
  }
}
