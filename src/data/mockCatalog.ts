import type { FeaturePublic, ModelPublic } from '../api/types'

export const MOCK_MODELS: ModelPublic[] = [
  {
    id: 'deepseek-chat',
    label: 'DeepSeek Chat',
    description: '通用对话，响应快',
    tags: ['fast'],
    supportsVision: false,
    supportsStream: true,
    costTier: 'low',
    recommended: true,
  },
  {
    id: 'deepseek-coder',
    label: 'DeepSeek Coder',
    description: '代码与技术问答',
    tags: ['code'],
    supportsVision: false,
    supportsStream: true,
    costTier: 'low',
  },
  {
    id: 'gpt-4o',
    label: 'GPT-4o',
    description: '强推理 + 视觉',
    tags: ['strong', 'vision'],
    supportsVision: true,
    supportsStream: true,
    costTier: 'high',
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
    defaultModelId: 'deepseek-coder',
  },
  {
    id: 'doc-generate',
    name: '文档生成',
    description: '表单写稿',
    icon: '📄',
    category: 'doc',
    modelPolicy: 'recommended',
    defaultModelId: 'deepseek-chat',
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
    modelPolicy: 'locked',
    defaultModelId: 'gpt-4o',
  },
]

export const DEFAULT_FEATURE_ID = 'tech-qa'
export const DEFAULT_MODEL_ID = 'deepseek-chat'
