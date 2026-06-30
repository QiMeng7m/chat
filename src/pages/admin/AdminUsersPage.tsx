import { Form, Input, InputNumber, Modal, Select, Spin, Switch, Table, Tag, message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { createUser, listUsers, updateUser } from '../../api/admin'
import { ApiError } from '../../api/http'
import type { UserAdmin, UserRole } from '../../api/types'
import { AdminPageHeader } from '../../components/layout/AdminLayout'
import ThemeButton from '../../components/ui/ThemeButton'
import { adminModalFooter } from '../../components/ui/adminModalFooter'
import { useTheme } from '../../theme/ThemeProvider'

type CreateFormValues = {
  email: string
  password: string
  role: UserRole
  dailyQuota: number
}

type EditFormValues = {
  role: UserRole
  dailyQuota: number
  enabled: boolean
}

export default function AdminUsersPage() {
  const { meta } = useTheme()
  const [items, setItems] = useState<UserAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<UserAdmin | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [createForm] = Form.useForm<CreateFormValues>()
  const [editForm] = Form.useForm<EditFormValues>()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setItems(await listUsers())
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
    createForm.resetFields()
    createForm.setFieldsValue({ role: 'user', dailyQuota: 100 })
    setCreateOpen(true)
  }

  const openEdit = (row: UserAdmin) => {
    setEditing(row)
    editForm.setFieldsValue({ role: row.role, dailyQuota: row.dailyQuota, enabled: row.enabled })
    setEditOpen(true)
  }

  const handleCreate = async () => {
    const values = await createForm.validateFields()
    setSubmitting(true)
    try {
      await createUser(values)
      message.success('用户已创建')
      setCreateOpen(false)
      await load()
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : '创建失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!editing) return
    const values = await editForm.validateFields()
    setSubmitting(true)
    try {
      await updateUser(editing.id, values)
      message.success('用户已更新')
      setEditOpen(false)
      await load()
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : '更新失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && items.length === 0) return <Spin />

  return (
    <section>
      <AdminPageHeader
        title={`👥 ${meta.usersLabel}管理`}
        desc="创建账号、调整角色与每日请求配额"
        action={
          <ThemeButton variant="secondary" onClick={openCreate}>
            + 创建用户
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
            { title: '邮箱', dataIndex: 'email' },
            {
              title: '角色',
              dataIndex: 'role',
              render: (role: UserRole) =>
                role === 'admin' ? <Tag color="purple">{meta.adminRole}</Tag> : <Tag>{role}</Tag>,
            },
            { title: '每日配额', dataIndex: 'dailyQuota' },
            {
              title: '今日用量',
              dataIndex: 'todayUsage',
              render: (v: number | undefined, row: UserAdmin) => {
                if (v === undefined) return '—'
                return v >= row.dailyQuota ? (
                  <span style={{ color: 'var(--warning)' }}>{v}</span>
                ) : (
                  v
                )
              },
            },
            { title: '状态', dataIndex: 'enabled', render: (v: boolean) => (v ? '正常' : '已禁用') },
            {
              title: '操作',
              key: 'actions',
              render: (_, row) => (
                <ThemeButton variant="ghost" size="sm" onClick={() => openEdit(row)}>
                  编辑
                </ThemeButton>
              ),
            },
          ]}
        />
      </div>

      <Modal
        title="创建用户"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        footer={adminModalFooter(
          () => setCreateOpen(false),
          () => void handleCreate(),
          submitting,
          '创建',
        )}
        destroyOnHidden
      >
        <Form form={createForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="member@example.com" />
          </Form.Item>
          <Form.Item name="password" label="初始密码" rules={[{ required: true, min: 8 }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]}>
            <Select
              options={[
                { label: '普通用户', value: 'user' },
                { label: meta.adminRole, value: 'admin' },
              ]}
            />
          </Form.Item>
          <Form.Item name="dailyQuota" label="每日配额" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editing ? `编辑：${editing.email}` : '编辑用户'}
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        footer={adminModalFooter(
          () => setEditOpen(false),
          () => void handleEdit(),
          submitting,
          '保存',
        )}
        destroyOnHidden
      >
        <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="role" label="角色" rules={[{ required: true }]}>
            <Select
              options={[
                { label: '普通用户', value: 'user' },
                { label: meta.adminRole, value: 'admin' },
              ]}
            />
          </Form.Item>
          <Form.Item name="dailyQuota" label="每日配额" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="enabled" label="账号启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </section>
  )
}
