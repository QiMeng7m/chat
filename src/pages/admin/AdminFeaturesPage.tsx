import { Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Spin, Switch, Table, Tag, message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import {
  createFeature,
  deleteFeature,
  listAdminFeatures,
  listAdminModels,
  updateFeature,
} from '../../api/admin'
import { ApiError } from '../../api/http'
import type { FeatureAdmin, FeatureCategory, ModelPolicy } from '../../api/types'
import { AdminPageHeader } from '../../components/layout/AdminLayout'
import ThemeButton from '../../components/ui/ThemeButton'
import { adminModalFooter } from '../../components/ui/adminModalFooter'

const CATEGORY_OPTIONS: { label: string; value: FeatureCategory }[] = [
  { label: 'chat', value: 'chat' },
  { label: 'code', value: 'code' },
  { label: 'doc', value: 'doc' },
  { label: 'image', value: 'image' },
  { label: 'other', value: 'other' },
]

const POLICY_OPTIONS: { label: string; value: ModelPolicy }[] = [
  { label: 'free', value: 'free' },
  { label: 'recommended', value: 'recommended' },
  { label: 'locked', value: 'locked' },
]

type FeatureFormValues = {
  id: string
  name: string
  description: string
  icon?: string
  category: FeatureCategory
  modelPolicy: ModelPolicy
  defaultModelId?: string
  systemPrompt: string
  enabled: boolean
  sortOrder: number
}

export default function AdminFeaturesPage() {
  const [items, setItems] = useState<FeatureAdmin[]>([])
  const [modelOptions, setModelOptions] = useState<{ label: string; value: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<FeatureAdmin | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm<FeatureFormValues>()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [features, models] = await Promise.all([listAdminFeatures(), listAdminModels()])
      setItems(features)
      setModelOptions(models.map((m) => ({ label: m.label, value: m.id })))
    } catch {
      setItems([])
      setModelOptions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({
      category: 'chat',
      modelPolicy: 'free',
      enabled: true,
      sortOrder: 0,
      systemPrompt: '',
      description: '',
    })
    setModalOpen(true)
  }

  const openEdit = (row: FeatureAdmin) => {
    setEditing(row)
    form.setFieldsValue({
      id: row.id,
      name: row.name,
      description: row.description,
      icon: row.icon,
      category: row.category,
      modelPolicy: row.modelPolicy,
      defaultModelId: row.defaultModelId,
      systemPrompt: row.systemPrompt,
      enabled: row.enabled,
      sortOrder: row.sortOrder,
    })
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      if (editing) {
        await updateFeature(editing.id, values)
        message.success('Feature 已更新')
      } else {
        await createFeature({ ...values, uiSchema: { type: 'plain' } })
        message.success('Feature 已创建')
      }
      setModalOpen(false)
      await load()
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteFeature(id)
      message.success('Feature 已删除')
      await load()
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : '删除失败')
    }
  }

  if (loading && items.length === 0) return <Spin />

  return (
    <section>
      <AdminPageHeader
        title="🎀 Feature 管理"
        desc="编辑场景 Prompt，用户端即时生效"
        action={
          <ThemeButton variant="primary" onClick={openCreate}>
            + 添加 Feature
          </ThemeButton>
        }
      />
      <div className="admin-card">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={items}
          pagination={false}
          columns={[
            { title: '场景', render: (_, r) => `${r.icon ?? '🎀'} ${r.name}` },
            { title: 'ID', dataIndex: 'id' },
            { title: '分类', dataIndex: 'category' },
            { title: '模型策略', dataIndex: 'modelPolicy', render: (v: string) => <Tag>{v}</Tag> },
            { title: '状态', dataIndex: 'enabled', render: (v: boolean) => (v ? '启用' : '停用') },
            {
              title: '操作',
              key: 'actions',
              render: (_, row) => (
                <Space wrap className="admin-row-actions">
                  <ThemeButton variant="ghost" size="sm" onClick={() => openEdit(row)}>
                    编辑
                  </ThemeButton>
                  <Popconfirm title="确定删除？" okText="删除" cancelText="取消" onConfirm={() => void handleDelete(row.id)}>
                    <ThemeButton variant="danger" size="sm">
                      删除
                    </ThemeButton>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </div>

      <Modal
        title={editing ? `编辑：${editing.name}` : '添加 Feature'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={adminModalFooter(
          () => setModalOpen(false),
          () => void handleSubmit(),
          submitting,
          '💾 保存',
        )}
        destroyOnHidden
        width={640}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="id"
            label="Feature ID"
            rules={[
              { required: true },
              { pattern: /^[a-z0-9-]+$/, message: '仅小写字母、数字和连字符' },
            ]}
          >
            <Input disabled={Boolean(editing)} placeholder="custom-polish" />
          </Form.Item>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="icon" label="图标">
            <Input placeholder="🎀" maxLength={4} />
          </Form.Item>
          <Form.Item name="systemPrompt" label="System Prompt" rules={[{ required: true }]}>
            <Input.TextArea rows={6} style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item name="defaultModelId" label="默认模型">
            <Select allowClear options={modelOptions} />
          </Form.Item>
          <Form.Item name="category" label="分类" rules={[{ required: true }]}>
            <Select options={CATEGORY_OPTIONS} />
          </Form.Item>
          <Form.Item name="modelPolicy" label="模型策略" rules={[{ required: true }]}>
            <Select options={POLICY_OPTIONS} />
          </Form.Item>
          <Form.Item name="sortOrder" label="排序">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="enabled" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </section>
  )
}
