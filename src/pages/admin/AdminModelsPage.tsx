import { Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Spin, Switch, Table, Tag, message } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createModel,
  deleteModel,
  listAdminModels,
  listProviders,
  updateModel,
} from '../../api/admin'
import { ApiError } from '../../api/http'
import type { ModelAdmin, ModelTag } from '../../api/types'
import { AdminPageHeader } from '../../components/layout/AdminLayout'
import ThemeButton from '../../components/ui/ThemeButton'
import { adminModalFooter } from '../../components/ui/adminModalFooter'

const TAG_OPTIONS: { label: string; value: ModelTag }[] = [
  { label: 'fast', value: 'fast' },
  { label: 'strong', value: 'strong' },
  { label: 'code', value: 'code' },
  { label: 'vision', value: 'vision' },
  { label: 'cheap', value: 'cheap' },
]

type ModelFormValues = {
  providerId: string
  modelId: string
  label: string
  description?: string
  tags: ModelTag[]
  supportsVision: boolean
  costTier: ModelAdmin['costTier']
  enabled: boolean
  sortOrder: number
}

export default function AdminModelsPage() {
  const [items, setItems] = useState<ModelAdmin[]>([])
  const [providers, setProviders] = useState<Awaited<ReturnType<typeof listProviders>>>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ModelAdmin | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm<ModelFormValues>()

  const providerMap = useMemo(
    () => new Map(providers.map((p) => [p.id, p.name])),
    [providers],
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [models, provs] = await Promise.all([listAdminModels(), listProviders()])
      setItems(models)
      setProviders(provs)
    } catch {
      setItems([])
      setProviders([])
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
      tags: [],
      supportsVision: false,
      costTier: 'low',
      enabled: true,
      sortOrder: 0,
      providerId: providers[0]?.id,
    })
    setModalOpen(true)
  }

  const openEdit = (row: ModelAdmin) => {
    setEditing(row)
    form.setFieldsValue({
      providerId: row.providerId,
      modelId: row.modelId,
      label: row.label,
      description: row.description,
      tags: row.tags,
      supportsVision: row.supportsVision,
      costTier: row.costTier,
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
        await updateModel(editing.id, {
          label: values.label,
          description: values.description,
          tags: values.tags,
          supportsVision: values.supportsVision,
          costTier: values.costTier,
          enabled: values.enabled,
          sortOrder: values.sortOrder,
        })
        message.success('模型已更新')
      } else {
        await createModel(values)
        message.success('模型已添加')
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
      await deleteModel(id)
      message.success('模型已删除')
      await load()
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : '删除失败')
    }
  }

  if (loading && items.length === 0) return <Spin />

  return (
    <section>
      <AdminPageHeader
        title="🤖 模型管理"
        desc="配置对外展示的模型列表"
        action={
          <ThemeButton variant="primary" onClick={openCreate} disabled={providers.length === 0}>
            + 添加模型
          </ThemeButton>
        }
      />
      <div className="admin-card">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={items}
          pagination={false}
          locale={{ emptyText: '暂无模型，请先添加 Provider' }}
          columns={[
            { title: '显示名', dataIndex: 'label' },
            { title: 'Model ID', dataIndex: 'modelId' },
            {
              title: 'Provider',
              dataIndex: 'providerId',
              render: (id: string) => providerMap.get(id) ?? id,
            },
            {
              title: '标签',
              dataIndex: 'tags',
              render: (tags: string[]) => tags.map((t) => <Tag key={t}>{t}</Tag>),
            },
            {
              title: 'Vision',
              dataIndex: 'supportsVision',
              render: (v: boolean) => (v ? '是' : '否'),
            },
            {
              title: '状态',
              dataIndex: 'enabled',
              render: (v: boolean) => (v ? '启用' : '停用'),
            },
            {
              title: '操作',
              key: 'actions',
              render: (_, row) => (
                <Space wrap className="admin-row-actions">
                  <ThemeButton variant="ghost" size="sm" onClick={() => openEdit(row)}>
                    编辑
                  </ThemeButton>
                  <Popconfirm title="确定删除该模型？" okText="删除" cancelText="取消" onConfirm={() => void handleDelete(row.id)}>
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
        title={editing ? '编辑模型' : '添加模型'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={adminModalFooter(
          () => setModalOpen(false),
          () => void handleSubmit(),
          submitting,
          editing ? '保存' : '添加',
        )}
        destroyOnHidden
        width={520}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="providerId" label="Provider" rules={[{ required: true }]}>
            <Select disabled={Boolean(editing)} options={providers.map((p) => ({ label: p.name, value: p.id }))} />
          </Form.Item>
          <Form.Item name="modelId" label="上游 Model ID" rules={[{ required: true }]}>
            <Input disabled={Boolean(editing)} placeholder="deepseek-chat" />
          </Form.Item>
          <Form.Item name="label" label="显示名" rules={[{ required: true }]}>
            <Input placeholder="DeepSeek Chat" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Select mode="multiple" options={TAG_OPTIONS} />
          </Form.Item>
          <Form.Item name="costTier" label="成本档位">
            <Select options={[{ label: 'free', value: 'free' }, { label: 'low', value: 'low' }, { label: 'high', value: 'high' }]} />
          </Form.Item>
          <Form.Item name="sortOrder" label="排序">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="supportsVision" label="Vision" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="enabled" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </section>
  )
}
