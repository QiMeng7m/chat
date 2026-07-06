import { Empty, List } from 'antd'
import type { LotteryWinRecord } from '../../api/types'

type LotteryWinRecordsProps = {
  records: LotteryWinRecord[]
  loading?: boolean
}

function formatTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function LotteryWinRecords({ records, loading = false }: LotteryWinRecordsProps) {
  return (
    <div className="lottery-records">
      <h3 className="lottery-records-title">🏆 获奖记录</h3>
      <List
        className="lottery-records-list"
        loading={loading}
        dataSource={records}
        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无获奖记录" /> }}
        renderItem={(item) => (
          <List.Item className="lottery-records-item">
            <span
              className="lottery-records-dot"
              style={{ background: item.prizeColor }}
              aria-hidden="true"
            />
            <div className="lottery-records-text">
              <span className="lottery-records-line">
                <strong>{item.displayName}</strong>
                <span> 抽到了 </span>
                <strong style={{ color: item.prizeColor }}>{item.prizeLabel}</strong>
              </span>
              <span className="lottery-records-time">{formatTime(item.createdAt)}</span>
            </div>
          </List.Item>
        )}
      />
    </div>
  )
}
