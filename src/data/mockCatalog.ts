import type { FeaturePublic, ModelPublic } from '../api/types'

export const MOCK_MODELS: ModelPublic[] = [
  {
    id: 'deepseek/deepseek-v4-flash',
    label: 'DeepSeek V4 Flash',
    description: '快速响应，所有用户可用',
    tags: ['fast'],
    supportsVision: false,
    supportsStream: true,
    costTier: 'low',
    recommended: true,
  },
  {
    id: 'deepseek/deepseek-v4-pro',
    label: 'DeepSeek V4 Pro',
    description: '旗舰推理，需管理员授权',
    tags: ['strong'],
    supportsVision: false,
    supportsStream: true,
    costTier: 'high',
    requiresPermission: true,
  },
]

export const MOCK_FEATURES: FeaturePublic[] = [
  {
    id: 'free-chat',
    name: '自由闲聊',
    description: '想聊啥聊啥',
    icon: '💬',
    category: 'chat',
    modelPolicy: 'free',
  },
  {
    id: 'tech-qa',
    name: '技术问答',
    description: '代码 debug',
    icon: '🛠',
    category: 'code',
    modelPolicy: 'recommended',
    defaultModelId: 'deepseek/deepseek-v4-flash',
  },
  {
    id: 'doc-generate',
    name: '文档生成',
    description: '表单写稿',
    icon: '📄',
    category: 'doc',
    modelPolicy: 'recommended',
    defaultModelId: 'deepseek/deepseek-v4-flash',
    uiSchema: {
      type: 'form',
      fields: [
        { key: 'title', label: '📌 标题', type: 'text', required: true, placeholder: 'Q2 技术复盘' },
        {
          key: 'docType',
          label: '📂 文档类型',
          type: 'select',
          options: [
            { label: '技术方案', value: 'tech-plan' },
            { label: '会议纪要', value: 'meeting' },
            { label: '项目总结', value: 'summary' },
          ],
        },
        {
          key: 'points',
          label: '💡 要点',
          type: 'textarea',
          required: true,
          placeholder: '列出文档要点…',
        },
      ],
    },
  },
  {
    id: 'polish',
    name: '文本润色',
    description: '变更好看',
    icon: '✨',
    category: 'other',
    modelPolicy: 'free',
  },
  {
    id: 'summarize',
    name: '内容摘要',
    description: '长文变短',
    icon: '📋',
    category: 'other',
    modelPolicy: 'free',
  },
  {
    id: 'vision',
    name: '图片分析',
    description: '看懂截图',
    icon: '🖼',
    category: 'image',
    modelPolicy: 'free',
    defaultModelId: 'deepseek/deepseek-v4-flash',
  },
]

export const DEFAULT_FEATURE_ID = 'tech-qa'
export const DEFAULT_MODEL_ID = 'deepseek/deepseek-v4-flash'
