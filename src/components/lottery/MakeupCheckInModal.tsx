import { PlusOutlined } from '@ant-design/icons'
import { Button, Form, InputNumber, Modal, Upload, message } from 'antd'
import type { UploadFile } from 'antd'
import { useEffect, useState } from 'react'
import { uploadLotteryImage } from '../../api/lottery'
import { ApiError } from '../../api/http'
import { formatDayLabel } from '../../lib/checkInCalendar'

type MakeupFormValues = {
  distanceKm: number
}

type MakeupCheckInModalProps = {
  open: boolean
  dateKey: string | null
  makeupAvailable: number
  loading?: boolean
  onCancel: () => void
  onSubmit: (payload: { dateKey: string; imageUrl: string; distanceKm: number }) => Promise<void>
}

export default function MakeupCheckInModal({
  open,
  dateKey,
  makeupAvailable,
  loading = false,
  onCancel,
  onSubmit,
}: MakeupCheckInModalProps) {
  const [form] = Form.useForm<MakeupFormValues>()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) {
      form.resetFields()
      setFileList([])
      setImageUrl(null)
    }
  }, [open, form])

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

  const handleFinish = async (values: MakeupFormValues) => {
    if (!dateKey) return
    if (!imageUrl) {
      message.warning('请先上传打卡图片')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({ dateKey, imageUrl, distanceKm: values.distanceKm })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title={dateKey ? `补卡 · ${formatDayLabel(dateKey)}` : '补卡'}
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnHidden
      className="lottery-makeup-modal"
    >
      <p className="lottery-makeup-hint">
        将消耗 1 次补卡机会（剩余 <strong>{makeupAvailable}</strong> 次）。补卡与正常打卡相同，需上传图片并填写公里数，完成后可获得抽奖机会。
      </p>

      <Form form={form} layout="vertical" onFinish={(values) => void handleFinish(values)}>
        <Form.Item label="打卡图片" required>
          <Upload
            listType="picture-card"
            fileList={fileList}
            accept="image/jpeg,image/png,image/webp,image/gif"
            maxCount={1}
            disabled={loading || uploading || submitting}
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
              <button type="button" className="lottery-upload-btn" disabled={uploading}>
                <PlusOutlined />
                <span>上传图片</span>
              </button>
            )}
          </Upload>
        </Form.Item>

        <Form.Item
          name="distanceKm"
          label="运动数量 (km)"
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
            disabled={loading || submitting}
          />
        </Form.Item>

        <div className="lottery-makeup-actions">
          <Button onClick={onCancel} disabled={submitting}>
            取消
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting || loading}
            disabled={uploading || makeupAvailable <= 0}
          >
            提交补卡
          </Button>
        </div>
      </Form>
    </Modal>
  )
}
