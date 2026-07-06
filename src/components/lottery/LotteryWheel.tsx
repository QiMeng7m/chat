import { useId, useMemo } from 'react'
import type { LotteryPrize } from '../../api/types'

export type LotteryWheelPhase = 'idle' | 'spinning' | 'stopping'

type LotteryWheelProps = {
  prizes: LotteryPrize[]
  rotation: number
  phase: LotteryWheelPhase
}

const SIZE = 340
const CX = SIZE / 2
const CY = SIZE / 2
const RIM = 14
const R = SIZE / 2 - RIM - 2

function polarToCartesian(angleDeg: number, radius: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: CX + radius * Math.cos(rad),
    y: CY + radius * Math.sin(rad),
  }
}

function segmentPath(index: number, total: number) {
  const slice = 360 / total
  const start = index * slice
  const end = start + slice
  const startPt = polarToCartesian(start, R)
  const endPt = polarToCartesian(end, R)
  const largeArc = slice > 180 ? 1 : 0
  return [
    `M ${CX} ${CY}`,
    `L ${startPt.x} ${startPt.y}`,
    `A ${R} ${R} 0 ${largeArc} 1 ${endPt.x} ${endPt.y}`,
    'Z',
  ].join(' ')
}

function shadeColor(hex: string, amount: number): string {
  const raw = hex.replace('#', '')
  if (raw.length !== 6) return hex
  const r = Math.max(0, Math.min(255, parseInt(raw.slice(0, 2), 16) + amount))
  const g = Math.max(0, Math.min(255, parseInt(raw.slice(2, 4), 16) + amount))
  const b = Math.max(0, Math.min(255, parseInt(raw.slice(4, 6), 16) + amount))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function formatLabel(label: string, total: number) {
  const max = total > 10 ? 3 : total > 6 ? 4 : 6
  return label.length > max ? `${label.slice(0, max)}…` : label
}

export default function LotteryWheel({ prizes, rotation, phase }: LotteryWheelProps) {
  const uid = useId().replace(/:/g, '')

  const segments = useMemo(() => {
    if (prizes.length === 0) return []
    return prizes.map((prize, index) => {
      const slice = 360 / prizes.length
      const mid = index * slice + slice / 2
      const labelPos = polarToCartesian(mid, R * 0.68)
      const textRotate = mid > 90 && mid < 270 ? mid + 180 : mid
      return {
        prize,
        index,
        path: segmentPath(index, prizes.length),
        labelPos,
        textRotate,
        lightPos: polarToCartesian(index * slice + slice / 2, R + RIM * 0.55),
        gradId: `lottery-grad-${uid}-${index}`,
        lightColor: index % 2 === 0 ? '#fff7c2' : '#ffe0f0',
      }
    })
  }, [prizes, uid])

  if (prizes.length === 0) {
    return (
      <div className="lottery-wheel-stage">
        <div className="lottery-wheel-empty">
          <span className="lottery-wheel-empty-icon" aria-hidden="true">
            🎡
          </span>
          <span>请先添加奖励</span>
        </div>
      </div>
    )
  }

  return (
    <div className="lottery-wheel-stage">
      <div className="lottery-wheel-pointer" aria-hidden="true">
        <svg viewBox="0 0 40 52" width="40" height="52">
          <path
            d="M20 48 L34 16 Q20 8 6 16 Z"
            fill="var(--primary)"
            stroke="#fff"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <circle cx="20" cy="42" r="5" fill="#fff" opacity="0.55" />
        </svg>
      </div>

      <div className="lottery-wheel-frame">
        <div
          className={`lottery-wheel-disk${phase === 'spinning' ? ' is-spinning' : ''}${phase === 'stopping' ? ' is-stopping' : ''}`}
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            width={SIZE}
            height={SIZE}
            role="img"
            aria-label="抽奖圆盘"
            className="lottery-wheel-svg"
          >
            <defs>
              {segments.map(({ prize, gradId }) => (
                <linearGradient key={gradId} id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={prize.color} />
                  <stop offset="100%" stopColor={shadeColor(prize.color, -28)} />
                </linearGradient>
              ))}
              <filter id={`lottery-shadow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.18" />
              </filter>
            </defs>

            <circle
              cx={CX}
              cy={CY}
              r={R + RIM}
              fill="var(--surface)"
              stroke="var(--primary)"
              strokeWidth={5}
              filter={`url(#lottery-shadow-${uid})`}
            />

            {segments.map(({ prize, path, gradId }) => (
              <path
                key={prize.id}
                d={path}
                fill={`url(#${gradId})`}
                stroke="#fff"
                strokeWidth={2.5}
                strokeLinejoin="round"
              />
            ))}

            {segments.map(({ lightPos, lightColor, index }) => (
              <circle
                key={`light-${index}`}
                cx={lightPos.x}
                cy={lightPos.y}
                r={4.5}
                fill={lightColor}
                stroke="#fff"
                strokeWidth={1.5}
                className="lottery-wheel-bulb"
                style={{ animationDelay: `${index * 0.12}s` }}
              />
            ))}

            {segments.map(({ prize, labelPos, textRotate }) => (
              <text
                key={`label-${prize.id}`}
                x={labelPos.x}
                y={labelPos.y}
                fill="#fff"
                fontSize={prizes.length > 10 ? 11 : prizes.length > 6 ? 12 : 14}
                fontWeight={800}
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${textRotate}, ${labelPos.x}, ${labelPos.y})`}
                className="lottery-wheel-label"
              >
                {formatLabel(prize.label, prizes.length)}
              </text>
            ))}

            <circle cx={CX} cy={CY} r={34} fill="#fff" stroke="var(--primary)" strokeWidth={4} />
            <circle cx={CX} cy={CY} r={26} fill="var(--primary-soft)" />
            <text
              x={CX}
              y={CY}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={22}
              className="lottery-wheel-hub-icon"
            >
              {phase === 'spinning' ? '✨' : phase === 'stopping' ? '🎯' : '🎲'}
            </text>
          </svg>
        </div>
      </div>

      <div className="lottery-wheel-stand" aria-hidden="true" />
    </div>
  )
}
