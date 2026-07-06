import { Form, Input, InputNumber, Modal, Popconfirm, Select, Spin, Switch, Table, Tag, message } from 'antd'

import { useCallback, useEffect, useState } from 'react'

import { addLotteryPrize, listLotteryPrizes, removeLotteryPrize, updateLotteryPrize } from '../../api/lottery'

import { ApiError } from '../../api/http'

import type { LotteryEffectOp, LotteryEffectTarget, LotteryPrize } from '../../api/types'

import { AdminPageHeader } from '../../components/layout/AdminLayout'

import ThemeButton from '../../components/ui/ThemeButton'

import { adminModalFooter } from '../../components/ui/adminModalFooter'

import { EFFECT_OP_OPTIONS, EFFECT_TARGET_OPTIONS, formatPrizeEffectLabel } from '../../lib/lotteryEffectLabels'



type AddFormValues = {

  label: string

  effectTarget: LotteryEffectTarget

  effectOp: LotteryEffectOp

  effectValue: number

}



const DEFAULT_FORM: AddFormValues = {

  label: '',

  effectTarget: 'none',

  effectOp: '+',

  effectValue: 1,

}



export default function AdminLotteryPage() {

  const [items, setItems] = useState<LotteryPrize[]>([])

  const [loading, setLoading] = useState(true)

  const [createOpen, setCreateOpen] = useState(false)

  const [submitting, setSubmitting] = useState(false)

  const [form] = Form.useForm<AddFormValues>()

  const effectTarget = Form.useWatch('effectTarget', form)

  const effectOp = Form.useWatch('effectOp', form)

  const effectValue = Form.useWatch('effectValue', form)



  const load = useCallback(async () => {

    setLoading(true)

    try {

      setItems(await listLotteryPrizes())

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

    form.setFieldsValue(DEFAULT_FORM)

    setCreateOpen(true)

  }



  const handleCreate = async () => {

    const values = await form.validateFields()

    setSubmitting(true)

    try {

      const payload =

        values.effectTarget === 'none'

          ? { label: values.label.trim(), effectTarget: 'none' as const }

          : {

              label: values.label.trim(),

              effectTarget: values.effectTarget,

              effectOp: values.effectOp,

              effectValue: values.effectValue,

            }

      await addLotteryPrize(payload)

      message.success('奖励已添加')

      setCreateOpen(false)

      await load()

    } catch (err) {

      message.error(err instanceof ApiError ? err.message : '添加失败')

    } finally {

      setSubmitting(false)

    }

  }



  const handleDelete = async (id: string) => {

    try {

      await removeLotteryPrize(id)

      message.success('已删除')

      await load()

    } catch (err) {

      message.error(err instanceof ApiError ? err.message : '删除失败')

    }

  }



  const handleToggleEnabled = async (row: LotteryPrize, enabled: boolean) => {

    try {

      await updateLotteryPrize(row.id, enabled)

      message.success(enabled ? '已启用' : '已禁用')

      await load()

    } catch (err) {

      message.error(err instanceof ApiError ? err.message : '操作失败')

    }

  }



  const previewLabel =

    effectTarget === 'none'

      ? '无（仅展示名称）'

      : formatPrizeEffectLabel({

          effectTarget,

          effectOp: effectOp ?? '+',

          effectValue: effectValue ?? 1,

        })



  if (loading && items.length === 0) return <Spin />



  return (

    <section>

      <AdminPageHeader

        title="🎡 奖池管理"

        desc="配置奖励名称与效果；本周抽中的奖励自动禁用，可手动重新启用"

        action={

          <ThemeButton variant="secondary" onClick={openCreate}>

            + 添加奖励

          </ThemeButton>

        }

      />

      <div className="admin-card">

        <Table

          rowKey="id"

          loading={loading}

          dataSource={items}

          pagination={false}

          locale={{ emptyText: '暂无奖励，点击右上角添加' }}

          columns={[

            {

              title: '颜色',

              dataIndex: 'color',

              width: 72,

              render: (color: string) => (

                <span

                  className="lottery-admin-color-dot"

                  style={{ background: color }}

                  aria-hidden="true"

                />

              ),

            },

            { title: '奖励名称', dataIndex: 'label' },

            {

              title: '效果',

              key: 'effect',

              width: 180,

              render: (_, row) => (

                <span className={`lottery-admin-effect-tag${row.effectTarget !== 'none' ? ' has-effect' : ''}`}>

                  {formatPrizeEffectLabel(row)}

                </span>

              ),

            },

            { title: '排序', dataIndex: 'sortOrder', width: 80 },

            {

              title: '状态',

              key: 'status',

              width: 140,

              render: (_, row) => {

                if (row.enabled !== false) {

                  return <Tag color="success">启用</Tag>

                }

                if (row.drawnThisWeek) {

                  return <Tag color="warning">本周已抽中</Tag>

                }

                return <Tag>已禁用</Tag>

              },

            },

            {

              title: '启用',

              key: 'enabled',

              width: 80,

              render: (_, row) => (

                <Switch

                  checked={row.enabled !== false}

                  onChange={(checked) => void handleToggleEnabled(row, checked)}

                />

              ),

            },

            {

              title: '创建时间',

              dataIndex: 'createdAt',

              width: 180,

              render: (v: string) => new Date(v).toLocaleString('zh-CN'),

            },

            {

              title: '操作',

              key: 'actions',

              width: 160,

              render: (_, row) => (

                <Popconfirm title="确定删除该奖励？" onConfirm={() => void handleDelete(row.id)}>

                  <ThemeButton variant="ghost" size="sm">

                    删除

                  </ThemeButton>

                </Popconfirm>

              ),

            },

          ]}

        />

      </div>



      <Modal

        title="添加奖励"

        open={createOpen}

        onCancel={() => setCreateOpen(false)}

        footer={adminModalFooter(

          () => setCreateOpen(false),

          () => void handleCreate(),

          submitting,

          '添加',

        )}

        destroyOnHidden

      >

        <Form form={form} layout="vertical" style={{ marginTop: 16 }} initialValues={DEFAULT_FORM}>

          <Form.Item

            name="label"

            label="奖励名称"

            rules={[{ required: true, message: '请输入奖励名称' }, { max: 40 }]}

          >

            <Input placeholder="如：再来一次、幸运加倍" maxLength={40} />

          </Form.Item>



          <Form.Item name="effectTarget" label="奖励类型">

            <Select options={EFFECT_TARGET_OPTIONS} />

          </Form.Item>



          {effectTarget !== 'none' && (

            <div className="lottery-admin-effect-row">

              <Form.Item

                name="effectOp"

                label="运算符号"

                rules={[{ required: true, message: '请选择符号' }]}

              >

                <Select options={EFFECT_OP_OPTIONS} />

              </Form.Item>

              <Form.Item

                name="effectValue"

                label="数量"

                rules={[{ required: true, message: '请填写数量' }]}

              >

                <InputNumber

                  min={effectOp === '*' ? 2 : 1}

                  max={99}

                  precision={0}

                  style={{ width: '100%' }}

                />

              </Form.Item>

            </div>

          )}



          <div className="lottery-admin-effect-preview">效果预览：{previewLabel}</div>

        </Form>

      </Modal>

    </section>

  )

}


