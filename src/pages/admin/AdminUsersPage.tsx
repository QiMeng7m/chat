import { Form, Input, InputNumber, Modal, Select, Spin, Switch, Table, Tag, message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { createUser, listUsers, updateUser } from '../../api/admin'
import { ApiError } from '../../api/http'
import type { UserAdmin, UserRole } from '../../api/types'
import { AdminPageHeader } from '../../components/layout/AdminLayout'
import ThemeButton from '../../components/ui/ThemeButton'
import { adminModalFooter } from '../../components/ui/adminModalFooter'
import { userRoleLabel, userRoleSelectOptions } from '../../lib/userRoles'
import { useTheme } from '../../theme/ThemeProvider'

type CreateFormValues = {
  username: string
  password: string
  role: UserRole
  quotaLimit: number
}

type EditFormValues = {
  role: UserRole
  quotaLimit: number
  quotaUsed: number
  enabled: boolean
  proAccess: boolean
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
    createForm.setFieldsValue({ role: 'user', quotaLimit: 100 })
    setCreateOpen(true)
  }

  const openEdit = (row: UserAdmin) => {
    setEditing(row)
    editForm.setFieldsValue({
      role: row.role,
      quotaLimit: row.quotaLimit,
      quotaUsed: row.quotaUsed,
      enabled: row.enabled,
      proAccess: row.proAccess,
    })
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
        desc="创建账号、调整总配额与已用次数（超额需管理员开通）"
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
            { title: '账号', dataIndex: 'username' },
            {
              title: '角色',
              dataIndex: 'role',
              render: (role: UserRole) =>
                role === 'admin' ? (
                  <Tag color="purple">{userRoleLabel(role, meta.adminRole)}</Tag>
                ) : role === 'runner' ? (
                  <Tag color="green">{userRoleLabel(role, meta.adminRole)}</Tag>
                ) : (
                  <Tag>{userRoleLabel(role, meta.adminRole)}</Tag>
                ),
            },
            { title: '总配额', dataIndex: 'quotaLimit' },
            {
              title: '已用',
              dataIndex: 'quotaUsed',
              render: (v: number, row: UserAdmin) =>
                v >= row.quotaLimit ? (
                  <span style={{ color: 'var(--warning)' }}>{v}</span>
                ) : (
                  v
                ),
            },
            {
              title: '剩余',
              dataIndex: 'quotaRemaining',
              render: (v: number) => (v <= 0 ? <Tag color="warning">已用完</Tag> : v),
            },
            {
              title: '注册 IP',
              dataIndex: 'registeredIp',
              render: (v: string | undefined) => v ?? '—',
            },
            {
              title: 'DeepSeek V4 Pro',
              dataIndex: 'proAccess',
              render: (v: boolean, row: UserAdmin) =>
                row.role === 'admin' ? (
                  <Tag color="purple">管理员</Tag>
                ) : v ? (
                  <Tag color="blue">已开通</Tag>
                ) : (
                  <Tag>未开通</Tag>
                ),
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
          <Form.Item name="username" label="账号" rules={[{ required: true, min: 2, max: 32 }]}>
            <Input placeholder="member01" />
          </Form.Item>
          <Form.Item name="password" label="初始密码" rules={[{ required: true, min: 6 }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]}>
            <Select options={userRoleSelectOptions(meta.adminRole)} />
          </Form.Item>
          <Form.Item name="quotaLimit" label="总配额" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editing ? `编辑：${editing.username}` : '编辑用户'}
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
            <Select options={userRoleSelectOptions(meta.adminRole)} />
          </Form.Item>
          <Form.Item name="quotaLimit" label="总配额" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="quotaUsed" label="已用次数" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.role !== cur.role}>
            {({ getFieldValue }) =>
              getFieldValue('role') === 'admin' ? null : (
                <Form.Item
                  name="proAccess"
                  label="DeepSeek V4 Pro 权限"
                  valuePropName="checked"
                  extra="开通后该用户可在对话页选用 DeepSeek V4 Pro 模型"
                >
                  <Switch />
                </Form.Item>
              )
            }
          </Form.Item>
          <Form.Item name="enabled" label="账号启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </section>
  )
}
