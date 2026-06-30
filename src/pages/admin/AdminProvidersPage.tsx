import { Form, Input, Modal, Popconfirm, Space, Spin, Switch, Table, message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import {
  createProvider,
  deleteProvider,
  listProviders,
  testProvider,
  updateProvider,
} from '../../api/admin'
import { ApiError } from '../../api/http'
import type { ProviderAdmin } from '../../api/types'
import { AdminPageHeader } from '../../components/layout/AdminLayout'
import ThemeButton from '../../components/ui/ThemeButton'
import { adminModalFooter } from '../../components/ui/adminModalFooter'

type ProviderFormValues = {
  name: string
  baseURL: string
  apiKey?: string
  enabled: boolean
}

export default function AdminProvidersPage() {
  const [items, setItems] = useState<ProviderAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ProviderAdmin | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [form] = Form.useForm<ProviderFormValues>()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setItems(await listProviders())
    } catch {
      setItems([])
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
    form.setFieldsValue({ enabled: true })
    setModalOpen(true)
  }

  const openEdit = (row: ProviderAdmin) => {
    setEditing(row)
    form.setFieldsValue({ name: row.name, baseURL: row.baseURL, enabled: row.enabled })
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      if (editing) {
        await updateProvider(editing.id, {
          name: values.name,
          baseURL: values.baseURL,
          enabled: values.enabled,
          ...(values.apiKey ? { apiKey: values.apiKey } : {}),
        })
        message.success('Provider 已更新')
      } else {
        if (!values.apiKey) {
          message.error('请填写 API Key')
          return
        }
        await createProvider({
          name: values.name,
          baseURL: values.baseURL,
          apiKey: values.apiKey,
          enabled: values.enabled,
        })
        message.success('Provider 已添加')
      }
      setModalOpen(false)
      await load()
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleTest = async (id: string) => {
    setTestingId(id)
    try {
      const result = await testProvider(id)
      message.success(`连接成功，延迟 ${result.latencyMs}ms`)
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : '连接测试失败')
    } finally {
      setTestingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteProvider(id)
      message.success('已删除 Provider')
      await load()
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : '删除失败')
    }
  }

  if (loading && items.length === 0) return <Spin />

  return (
    <section>
      <AdminPageHeader
        title="🔌 Provider 管理"
        desc="添加 API 密钥，密钥只存在服务器里 🔐"
        action={
          <ThemeButton variant="primary" onClick={openCreate}>
            + 添加 Provider
          </ThemeButton>
        }
      />
      <div className="admin-card">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={items}
          pagination={false}
          locale={{ emptyText: '暂无 Provider，点击右上角添加' }}
          columns={[
            { title: '名称', dataIndex: 'name' },
            { title: '类型', dataIndex: 'type' },
            { title: 'Base URL', dataIndex: 'baseURL', ellipsis: true },
            { title: '密钥', dataIndex: 'apiKeyMasked' },
            {
              title: '状态',
              dataIndex: 'enabled',
              render: (v: boolean) => (v ? '✅ 启用' : '⏸ 停用'),
            },
            {
              title: '操作',
              key: 'actions',
              render: (_, row) => (
                <Space wrap className="admin-row-actions">
                  <ThemeButton
                    variant="ghost"
                    size="sm"
                    loading={testingId === row.id}
                    onClick={() => void handleTest(row.id)}
                  >
                    测试
                  </ThemeButton>
                  <ThemeButton variant="ghost" size="sm" onClick={() => openEdit(row)}>
                    编辑
                  </ThemeButton>
                  <Popconfirm
                    title="删除 Provider？"
                    description="关联的模型配置也会被删除"
                    okText="删除"
                    cancelText="取消"
                    onConfirm={() => void handleDelete(row.id)}
                  >
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
        title={editing ? '编辑 Provider' : '添加 Provider'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={adminModalFooter(
          () => setModalOpen(false),
          () => void handleSubmit(),
          submitting,
          editing ? '保存' : '添加',
        )}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="显示名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="DeepSeek" />
          </Form.Item>
          <Form.Item
            name="baseURL"
            label="Base URL"
            rules={[{ required: true, message: '请输入 Base URL' }]}
          >
            <Input placeholder="https://api.deepseek.com/v1" />
          </Form.Item>
          <Form.Item
            name="apiKey"
            label="API Key"
            rules={editing ? [] : [{ required: true, message: '请输入 API Key' }]}
            extra={editing ? '留空则不修改密钥' : undefined}
          >
            <Input.Password placeholder="sk-..." />
          </Form.Item>
          <Form.Item name="enabled" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </section>
  )
}
