import { Button, Spin, message } from 'antd'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { drawLottery, getLotteryStatus, listLotteryPrizes, listLotteryWinRecords } from '../api/lottery'
import type { LotteryPrize, LotteryStatus } from '../api/types'
import { ApiError } from '../api/http'
import LotteryCheckInForm from '../components/lottery/LotteryCheckInForm'
import LotteryWinRecords from '../components/lottery/LotteryWinRecords'
import LotteryWheel, { type LotteryWheelPhase } from '../components/lottery/LotteryWheel'
import { formatPendingBuffSummary } from '../lib/lotteryEffectLabels'
import { useTheme } from '../theme/ThemeProvider'
import '../styles/lottery.css'

const SPIN_SPEED_DEG = 480
const STOP_DURATION_MS = 3200
const STOP_EXTRA_SPINS = 4

const DEFAULT_STATUS: LotteryStatus = {
  checkedInToday: false,
  drawsGranted: 0,
  drawsUsed: 0,
  drawUsedToday: false,
  chancesRemaining: 0,
  canCheckIn: true,
  canDraw: false,
  weekDistanceKm: 0,
  monthDistanceKm: 0,
  pendingEffects: [],
  nextRollCount: 1,
}

export default function LotteryPage() {
  const { meta } = useTheme()
  const [prizes, setPrizes] = useState<LotteryPrize[]>([])
  const [records, setRecords] = useState<Awaited<ReturnType<typeof listLotteryWinRecords>>>([])
  const [status, setStatus] = useState<LotteryStatus>(DEFAULT_STATUS)
  const [loading, setLoading] = useState(true)
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [phase, setPhase] = useState<LotteryWheelPhase>('idle')
  const [rotation, setRotation] = useState(0)
  const [winners, setWinners] = useState<LotteryPrize[]>([])
  const rotationRef = useRef(0)
  const phaseRef = useRef<LotteryWheelPhase>('idle')
  const rafRef = useRef<number | null>(null)
  const lastFrameRef = useRef(0)
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearSpinLoop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const clearStopTimer = useCallback(() => {
    if (stopTimerRef.current != null) {
      clearTimeout(stopTimerRef.current)
      stopTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      clearSpinLoop()
      clearStopTimer()
    }
  }, [clearSpinLoop, clearStopTimer])

  const loadRecords = useCallback(async () => {
    setRecordsLoading(true)
    try {
      setRecords(await listLotteryWinRecords())
    } catch {
      setRecords([])
    } finally {
      setRecordsLoading(false)
    }
  }, [])

  const loadPage = useCallback(async () => {
    setLoading(true)
    try {
      const [items, nextStatus] = await Promise.all([listLotteryPrizes(), getLotteryStatus()])
      setPrizes(items)
      setStatus(nextStatus)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : '加载失败'
      message.error(msg)
    } finally {
      setLoading(false)
    }
    void loadRecords()
  }, [loadRecords])

  useEffect(() => {
    void loadPage()
  }, [loadPage])

  const spinToPrize = (target: LotteryPrize, allPrizes: LotteryPrize[]) => {
    const index = allPrizes.findIndex((p) => p.id === target.id)
    if (index < 0) return

    const slice = 360 / allPrizes.length
    const centerAngle = index * slice + slice / 2
    const current = rotationRef.current
    const currentMod = ((current % 360) + 360) % 360
    const targetMod = (360 - centerAngle + 360) % 360
    let delta = targetMod - currentMod
    if (delta <= 0) delta += 360

    const nextRotation = current + STOP_EXTRA_SPINS * 360 + delta
    rotationRef.current = nextRotation
    setRotation(nextRotation)
  }

  const notifyAppliedEffects = (applied?: { action: string; label: string }[]) => {
    if (!applied?.length) return
    for (const item of applied) {
      if (item.action === 'queued') {
        message.info(`${item.label} 已生效，等待下次抽奖`)
      } else if (item.action === 'immediate') {
        message.success(item.label)
      }
    }
  }

  const startSpin = () => {
    if (prizes.length === 0) {
      message.warning('奖池暂无奖励，请联系管理员配置')
      return
    }
    if (!status.canDraw) {
      message.warning(
        status.checkedInToday ? '今日抽奖机会已用完' : '请先完成今日打卡后再抽奖',
      )
      return
    }
    if (phaseRef.current !== 'idle') return

    clearStopTimer()
    setWinners([])
    phaseRef.current = 'spinning'
    setPhase('spinning')
    lastFrameRef.current = performance.now()

    const tick = (now: number) => {
      if (phaseRef.current !== 'spinning') return
      const dt = (now - lastFrameRef.current) / 1000
      lastFrameRef.current = now
      rotationRef.current += SPIN_SPEED_DEG * dt
      setRotation(rotationRef.current)
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
  }

  const stopSpin = async () => {
    if (phaseRef.current !== 'spinning') return

    clearSpinLoop()
    phaseRef.current = 'stopping'
    setPhase('stopping')

    try {
      const result = await drawLottery()
      const drawn = result.prizes?.length ? result.prizes : [result.prize]
      spinToPrize(drawn[0], prizes)
      setStatus(result.status)

      stopTimerRef.current = setTimeout(() => {
        setWinners(drawn)
        phaseRef.current = 'idle'
        setPhase('idle')
        if (drawn.length === 1) {
          message.success(`恭喜获得：${drawn[0].label}`)
        } else {
          message.success(`恭喜获得 ${drawn.length} 个奖品`)
        }
        notifyAppliedEffects(result.appliedEffects)
        void loadRecords()
      }, STOP_DURATION_MS)
    } catch (err) {
      phaseRef.current = 'idle'
      setPhase('idle')
      const msg = err instanceof ApiError ? err.message : '抽奖失败'
      message.error(msg)
    }
  }

  const handleAction = () => {
    if (phase === 'idle') startSpin()
    else if (phase === 'spinning') void stopSpin()
  }

  const buffSummary = formatPendingBuffSummary(status.nextRollCount, status.canDraw)

  const placeholder =
    phase === 'spinning'
      ? '圆盘旋转中，点击停止抽取奖励'
      : !status.canCheckIn && !status.canDraw && status.nextRollCount <= 1
        ? '今日打卡与抽奖均已完成，明天再来'
        : status.canDraw
          ? buffSummary
            ? `你有 ${status.chancesRemaining} 次机会，${buffSummary}`
            : `你有 ${status.chancesRemaining} 次抽奖机会，点击开始`
          : status.checkedInToday && buffSummary
            ? buffSummary
            : status.checkedInToday
              ? '今日抽奖机会已用完'
              : '请先左侧打卡，获得抽奖机会'

  const canStartDraw = status.canDraw && prizes.length > 0
  const drawLocked = phase === 'idle' && !canStartDraw

  const drawButtonLabel =
    phase === 'spinning'
      ? '⏹ 停止'
      : phase === 'stopping'
        ? '停止中…'
        : prizes.length === 0
          ? '奖池筹备中'
          : !status.canDraw
            ? status.checkedInToday
              ? '今日机会已用完'
              : '请先完成打卡'
            : '🎲 开始抽奖'

  return (
    <div className="lottery-page">
      <Link to="/settings" className="lottery-settings-link">
        ⚙️ 外观
      </Link>

      <div className="lottery-shell lottery-shell-wide">
        <header className="lottery-header">
          <span className="lottery-logo" aria-hidden="true">
            {meta.logoEmoji}
          </span>
          <h1>🎡 圆盘抽奖</h1>
          <p>每日打卡获得机会，奖品可增减次数、里程或下次奖励倍数</p>
        </header>

        <div className="lottery-body lottery-body-split">
          <section className="lottery-panel lottery-checkin-panel">
            <LotteryCheckInForm
              disabled={phase !== 'idle'}
              status={status}
              onStatusChange={setStatus}
            />
          </section>

          <section className="lottery-panel lottery-wheel-panel">
            <div className="lottery-chances-badge">
              今日抽奖机会：剩余 <strong>{status.chancesRemaining}</strong> / 共{' '}
              <strong>{status.drawsGranted}</strong> 次
            </div>

            {buffSummary ? (
              <div className={`lottery-buff-bar${status.canDraw ? '' : ' is-muted'}`} role="status">
                <span className="lottery-buff-icon" aria-hidden="true">
                  ⚡
                </span>
                <span>{buffSummary}</span>
              </div>
            ) : null}

            <Spin spinning={loading}>
              <LotteryWheel prizes={prizes} rotation={rotation} phase={phase} />
            </Spin>

            <div
              className={`lottery-result-banner${winners.length > 0 ? ' has-winner' : ''}${phase === 'spinning' ? ' is-active' : ''}`}
              aria-live="polite"
            >
              {winners.length > 0 ? (
                <>
                  <span className="lottery-result-label">
                    恭喜获得{winners.length > 1 ? `（${winners.length} 个）` : ''}
                  </span>
                  <div className="lottery-prize-chip-list">
                    {winners.map((w) => (
                      <span key={w.id} className="lottery-prize-chip">
                        <span
                          className="lottery-result-dot"
                          style={{ background: w.color }}
                          aria-hidden="true"
                        />
                        {w.label}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <span className="lottery-placeholder">{placeholder}</span>
              )}
            </div>

            <Button
              type={phase === 'spinning' ? 'default' : 'primary'}
              danger={phase === 'spinning'}
              size="large"
              block
              onClick={handleAction}
              loading={phase === 'stopping'}
              disabled={phase === 'stopping' || drawLocked}
              className={`lottery-draw-btn${phase === 'spinning' ? ' lottery-stop-btn' : ''}${drawLocked ? ' is-locked' : ''}`}
            >
              {drawButtonLabel}
            </Button>
          </section>

          <section className="lottery-panel lottery-records-panel">
            <LotteryWinRecords records={records} loading={recordsLoading} />
          </section>
        </div>

        <footer className="lottery-footer">
          <span>
            已有账号？<Link to="/login">去登录</Link>
          </span>
        </footer>
      </div>
    </div>
  )
}
