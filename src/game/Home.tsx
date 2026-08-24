interface HomeProps {
  onStart: () => void
  onRecords: () => void
  onExit: () => void
}

export function Home({ onStart, onRecords, onExit }: HomeProps) {
  return (
    <div className="home">
      <h1>팔레트: 드레스코드</h1>
      <p className="slogan">군계일학 — 옷 색이 다른 한 명을 찾아보세요</p>

      <nav className="home-menu">
        <button className="menu-btn primary" onClick={onStart}>
          게임시작
        </button>
        <button className="menu-btn" onClick={onRecords}>
          기록
        </button>
        <button className="menu-btn" onClick={onExit}>
          종료
        </button>
      </nav>
    </div>
  )
}
