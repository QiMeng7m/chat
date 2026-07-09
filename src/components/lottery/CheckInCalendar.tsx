import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import { Button, Spin } from 'antd'
import { useMemo } from 'react'
import {
  addMonths,
  buildMonthGrid,
  countMonthCheckIns,
  formatMonthLabel,
  getWeekdayLabels,
  type CheckInDayRecord,
  type CalendarCell,
} from '../../lib/checkInCalendar'

type CheckInCalendarProps = {
  records: CheckInDayRecord[]
  makeupAvailable: number
  loading?: boolean
  viewMonth: Date
  onViewMonthChange: (month: Date) => void
  onSelectMissed?: (dateKey: string) => void
}

function cellTooltip(cell: CalendarCell): string | undefined {
  if (!cell.date || cell.status === 'empty') return undefined

  if (cell.record) {
    const kindLabel = cell.record.kind === 'makeup' ? '补卡' : '已打卡'
    return `${cell.day} 日 · ${kindLabel} · ${cell.record.distanceKm.toFixed(2)} km`
  }

  if (cell.status === 'today') return `${cell.day} 日 · 今天`
  if (cell.status === 'missed') return `${cell.day} 日 · 缺卡 · 点击补卡`
  if (cell.status === 'missed-disabled') return `${cell.day} 日 · 缺卡 · 补卡机会不足`
  if (cell.status === 'future') return `${cell.day} 日 · 未到`

  return undefined
}

export default function CheckInCalendar({
  records,
  makeupAvailable,
  loading = false,
  viewMonth,
  onViewMonthChange,
  onSelectMissed,
}: CheckInCalendarProps) {
  const monthKey = `${viewMonth.getFullYear()}-${String(viewMonth.getMonth() + 1).padStart(2, '0')}`
  const monthCheckIns = countMonthCheckIns(records, monthKey)

  const cells = useMemo(
    () => buildMonthGrid(viewMonth, records, { makeupAvailable }),
    [viewMonth, records, makeupAvailable],
  )

  const handleCellClick = (cell: CalendarCell) => {
    if (cell.status !== 'missed' || !cell.date) return
    onSelectMissed?.(cell.date)
  }

  return (
    <div className="lottery-checkin-calendar">
      <div className="lottery-calendar-nav">
        <Button
          type="text"
          size="small"
          icon={<LeftOutlined />}
          aria-label="上一月"
          disabled={loading}
          onClick={() => onViewMonthChange(addMonths(viewMonth, -1))}
        />
        <span className="lottery-calendar-month">{formatMonthLabel(viewMonth)}</span>
        <Button
          type="text"
          size="small"
          icon={<RightOutlined />}
          aria-label="下一月"
          disabled={loading}
          onClick={() => onViewMonthChange(addMonths(viewMonth, 1))}
        />
      </div>

      <Spin spinning={loading} size="small">
        <div className="lottery-calendar-weekdays" aria-hidden="true">
          {getWeekdayLabels().map((label) => (
            <span key={label} className="lottery-calendar-weekday">
              {label}
            </span>
          ))}
        </div>

        <div className="lottery-calendar-grid" role="grid" aria-label="打卡月历">
          {cells.map((cell, index) => {
            if (cell.status === 'empty') {
              return (
                <span
                  key={`empty-${index}`}
                  className="lottery-calendar-cell is-empty"
                  role="gridcell"
                  aria-hidden="true"
                />
              )
            }

            const tooltip = cellTooltip(cell)
            const clickable = cell.status === 'missed'

            return (
              <button
                key={cell.date}
                type="button"
                className={`lottery-calendar-cell is-${cell.status}`}
                role="gridcell"
                disabled={!clickable || loading}
                title={tooltip}
                onClick={() => handleCellClick(cell)}
                aria-label={tooltip}
              >
                <span className="lottery-calendar-day">{cell.day}</span>
              </button>
            )
          })}
        </div>
      </Spin>

      <div className="lottery-calendar-summary">
        本月打卡 <strong>{monthCheckIns}</strong> 天 · 补卡机会{' '}
        <strong>{makeupAvailable}</strong> 次
      </div>

      <div className="lottery-calendar-legend" aria-hidden="true">
        <span className="lottery-calendar-legend-item">
          <span className="lottery-calendar-dot is-checked" /> 已打卡
        </span>
        <span className="lottery-calendar-legend-item">
          <span className="lottery-calendar-dot is-makeup" /> 补卡
        </span>
        <span className="lottery-calendar-legend-item">
          <span className="lottery-calendar-dot is-missed" /> 可补卡
        </span>
      </div>
    </div>
  )
}
