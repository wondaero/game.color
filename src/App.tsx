import { useState } from 'react'
import './App.css'
import { Board, type RoundMeta } from './game/Board'
import { DELTA_E_HARD_FLOOR } from './game/color'
import { Home } from './game/Home'
import { getBestStage, saveBestStage } from './game/gameRecords'
import { Records } from './game/Records'

const CHARACTER_COUNT = 25
const STARTING_DELTA_E = 12
const DELTA_E_STEP_PER_STAGE = 1.2

type Screen = 'home' | 'game' | 'records'

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [stage, setStage] = useState(1)
  const [roundKey, setRoundKey] = useState(0)
  const [status, setStatus] = useState<'playing' | 'correct' | 'wrong'>('playing')
  const [lastMeta, setLastMeta] = useState<RoundMeta | null>(null)

  const targetDeltaE = Math.max(DELTA_E_HARD_FLOOR, STARTING_DELTA_E - (stage - 1) * DELTA_E_STEP_PER_STAGE)

  const startGame = () => {
    setStage(1)
    setStatus('playing')
    setLastMeta(null)
    setRoundKey((k) => k + 1)
    setScreen('game')
  }

  const exitGame = () => {
    if (window.confirm('게임을 종료할까요?')) {
      // Capacitor 패키징 후에는 @capacitor/app의 App.exitApp()으로 교체.
      window.close()
    }
  }

  const handleAnswer = (correct: boolean, meta: RoundMeta) => {
    setStatus(correct ? 'correct' : 'wrong')
    setLastMeta(meta)
    if (correct) saveBestStage(stage + 1)
  }

  const nextRound = () => {
    if (status === 'correct') setStage((s) => s + 1)
    setStatus('playing')
    setRoundKey((k) => k + 1)
  }

  if (screen === 'home') {
    return <Home onStart={startGame} onRecords={() => setScreen('records')} onExit={exitGame} />
  }

  if (screen === 'records') {
    return <Records bestStage={getBestStage()} onBack={() => setScreen('home')} />
  }

  return (
    <div className="app">
      <header className="app-header">
        <button className="home-link" onClick={() => setScreen('home')}>
          ← 홈
        </button>
        <p className="stage">Stage {stage} · ΔE {targetDeltaE.toFixed(1)}</p>
      </header>

      <div className="board-area">
        <Board key={roundKey} characterCount={CHARACTER_COUNT} targetDeltaE={targetDeltaE} roundKey={roundKey} onAnswer={handleAnswer} />
      </div>

      <footer className="app-footer">
        {status === 'playing' && <p>다른 색 옷을 입은 캐릭터를 탭하세요.</p>}
        {status === 'correct' && (
          <div className="result correct">
            <p>정답입니다!</p>
            <button onClick={nextRound}>다음 스테이지</button>
          </div>
        )}
        {status === 'wrong' && (
          <div className="result wrong">
            <p>아쉬워요, 다시 시도해보세요.</p>
            <button onClick={nextRound}>다시하기</button>
          </div>
        )}
        {lastMeta && <p className="debug">actual ΔE {lastMeta.actualDeltaE.toFixed(2)}</p>}
      </footer>
    </div>
  )
}

export default App
