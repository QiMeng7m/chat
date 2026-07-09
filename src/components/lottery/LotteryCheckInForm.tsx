import { PlusOutlined } from '@ant-design/icons'
import { Button, Form, InputNumber, Tag, Upload, message } from 'antd'
import type { UploadFile } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import {
  getCheckInCalendar,
  submitLotteryCheckIn,
  submitMakeupCheckIn,
  uploadLotteryImage,
} from '../../api/lottery'
import type { CheckInDayRecord, LotteryStatus } from '../../api/types'
import { ApiError } from '../../api/http'
import { formatMonthKey } from '../../lib/checkInCalendar'
import CheckInCalendar from './CheckInCalendar'
import MakeupCheckInModal from './MakeupCheckInModal'

type CheckInFormValues = {
  distanceKm: number
}

type LotteryCheckInFormProps = {
  disabled?: boolean
  status: LotteryStatus
  onStatusChange: (status: LotteryStatus) => void
}

export default function LotteryCheckInForm({
  disabled = false,
  status,
  onStatusChange,
}: LotteryCheckInFormProps) {
  const [form] = Form.useForm<CheckInFormValues>()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [records, setRecords] = useState<CheckInDayRecord[]>([])
  const [makeupAvailable, setMakeupAvailable] = useState(0)
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [viewMonth, setViewMonth] = useState(() => new Date())
  const [makeupDate, setMakeupDate] = useState<string | null>(null)
  const [makeupSubmitting, setMakeupSubmitting] = useState(false)

  const formDisabled = disabled || !status.canCheckIn

  const loadCalendar = useCallback(async (month: Date) => {
    setCalendarLoading(true)
    try {
      const data = await getCheckInCalendar(formatMonthKey(month))
      setRecords(data.days)
      setMakeupAvailable(data.makeupAvailable)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : '加载打卡日历失败'
      message.error(msg)
    } finally {
      setCalendarLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCalendar(viewMonth)
  }, [viewMonth, loadCalendar])

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const url = await uploadLotteryImage(file)
      setImageUrl(url)
      setFileList([
        {
          uid: '-1',
          name: file.name,
          status: 'done',
          url,
          thumbUrl: url,
        },
      ])
      message.success('图片上传成功')
    } catch (err) {
      setImageUrl(null)
      setFileList([])
      const msg = err instanceof ApiError ? err.message : '图片上传失败'
      message.error(msg)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (values: CheckInFormValues) => {
    if (!imageUrl) {
      message.warning('请先上传打卡图片')
      return
    }

    setSubmitting(true)
    try {
      const result = await submitLotteryCheckIn(imageUrl, values.distanceKm)
      onStatusChange(result.status)
      await loadCalendar(viewMonth)
      message.success(`打卡成功，已获得 ${result.status.drawsGranted} 次抽奖机会`)
      form.resetFields()
      setFileList([])
      setImageUrl(null)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : '提交失败'
      message.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleMakeupSubmit = async (payload: {
    dateKey: string
    imageUrl: string
    distanceKm: number
  }) => {
    if (makeupAvailable <= 0) {
      message.warning('补卡机会不足')
      return
    }

    setMakeupSubmitting(true)
    try {
      const result = await submitMakeupCheckIn(
        payload.dateKey,
        payload.imageUrl,
        payload.distanceKm,
      )
      onStatusChange(result.status)
      await loadCalendar(viewMonth)
      message.success(`补卡成功，已获得 ${result.status.chancesRemaining} 次抽奖机会`)
      setMakeupDate(null)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : '补卡失败'
      message.error(msg)
    } finally {
      setMakeupSubmitting(false)
    }
  }

  return (
    <>
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => void handleSubmit(values)}
        className="lottery-checkin-form"
      >
        <div className="lottery-checkin-head">
          <div>
            <h2>运动打卡</h2>
            <p className="lottery-hint">每日打卡一次，获得 1 次抽奖机会</p>
          </div>
          {status.checkedInToday ? (
            <Tag color="success">今日已打卡</Tag>
          ) : (
            <Tag>未打卡</Tag>
          )}
        </div>

        <CheckInCalendar
          records={records}
          makeupAvailable={makeupAvailable}
          loading={calendarLoading}
          viewMonth={viewMonth}
          onViewMonthChange={setViewMonth}
          onSelectMissed={setMakeupDate}
        />

        <div className="lottery-exercise-stats">
          <div className="lottery-exercise-stat">
            <span className="lottery-exercise-stat-label">本周已累计运动</span>
            <strong>{status.weekDistanceKm.toFixed(2)}</strong>
            <span className="lottery-exercise-stat-unit">km</span>
          </div>
          <div className="lottery-exercise-stat">
            <span className="lottery-exercise-stat-label">本月已累计运动</span>
            <strong>{status.monthDistanceKm.toFixed(2)}</strong>
            <span className="lottery-exercise-stat-unit">公里</span>
          </div>
        </div>

        <Form.Item label="打卡图片" required>
          <Upload
            listType="picture-card"
            fileList={fileList}
            accept="image/jpeg,image/png,image/webp,image/gif"
            maxCount={1}
            disabled={formDisabled || uploading || submitting}
            beforeUpload={(file) => {
              void handleUpload(file)
              return false
            }}
            onRemove={() => {
              setFileList([])
              setImageUrl(null)
            }}
          >
            {fileList.length === 0 && (
              <button type="button" className="lottery-upload-btn" disabled={formDisabled}>
                <PlusOutlined />
                <span>上传图片</span>
              </button>
            )}
          </Upload>
        </Form.Item>

        <Form.Item
          name="distanceKm"
          label="今日运动数量(km)"
          rules={[
            { required: true, message: '请填写运动公里数' },
            { type: 'number', min: 0.01, max: 999, message: '请输入 0.01～999 之间的数值' },
          ]}
        >
          <InputNumber
            min={0.01}
            max={999}
            step={0.1}
            precision={2}
            placeholder="0.00"
            suffix="km"
            style={{ width: '100%' }}
            disabled={formDisabled || submitting}
          />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          block
          loading={submitting}
          disabled={formDisabled || uploading}
          className="lottery-checkin-submit"
        >
          {status.canCheckIn ? '提交打卡' : '今日已打卡'}
        </Button>
      </Form>

      <MakeupCheckInModal
        open={makeupDate != null}
        dateKey={makeupDate}
        makeupAvailable={makeupAvailable}
        loading={makeupSubmitting}
        onCancel={() => setMakeupDate(null)}
        onSubmit={handleMakeupSubmit}
      />
    </>
  )
}
