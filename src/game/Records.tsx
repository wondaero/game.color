interface RecordsProps {
  bestStage: number
  onBack: () => void
}

export function Records({ bestStage, onBack }: RecordsProps) {
  return (
    <div className="home">
      <h1>기록</h1>

      <div className="records-card">
        <p className="records-label">최고 도달 스테이지</p>
        <p className="records-value">{bestStage > 0 ? `Stage ${bestStage}` : '아직 기록이 없어요'}</p>
      </div>

      <nav className="home-menu">
        <button className="menu-btn" onClick={onBack}>
          홈으로
        </button>
      </nav>
    </div>
  )
}
