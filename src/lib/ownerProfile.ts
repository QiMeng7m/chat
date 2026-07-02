import type { OwnerProfile } from '../api/types'
import type { ChatMessage } from '../types/chat'

export type { OwnerFact, OwnerProfile } from '../api/types'

export const ASSISTANT_NAME = '小柒'

export const ASSISTANT_GREETING =
  '你好，欢迎来到柒梦的小破站，我是你的AI助手，小柒，我可以为你解决问题，或者了解主人的详细信息。'

/** 触发主人资料检索的关键词 */
export const OWNER_QUERY_KEYWORDS = ['主人', '王鸿博', '柒梦', '站主', '站长'] as const

/** 明确索要概览/介绍时才返回完整资料（避免「爱好怎么样」等误触发） */
const GENERAL_INTRO_PATTERN =
  /(?:详细|全部|所有)(?:介绍|资料|信息)|介绍一下|是谁|什么人|了解一下|说说(?:一下)?(?:主人|站主|柒梦|王鸿博)?|讲讲(?:一下)?(?:主人|站主|柒梦|王鸿博)?|^资料$|^(?:主人|站主|站长|柒梦|王鸿博)(?:的)?(?:资料|信息)$/

const NAME_PATTERNS = /名字|姓名|真名|本名|叫什么/
const NICKNAME_PATTERNS = /网名|昵称|外号|称呼/

/** API 不可用时的兜底资料 */
export function getDefaultOwnerProfile(): OwnerProfile {
  const now = Date.now()
  return {
    version: 1,
    nicknames: ['柒梦'],
    realName: '王鸿博',
    title: '主人',
    summary:
      '王鸿博是「柒梦的小破站」的站主，常用网名柒梦。本站由主人搭建，我是 AI 助手小柒，在这里帮访客聊天答疑。',
    facts: [
      {
        id: 'call',
        topic: '称呼',
        content: '可称「柒梦」「王鸿博」或「主人」。',
      },
      {
        id: 'site',
        topic: '站点',
        content: '柒梦的小破站是王鸿博的个人 AI 对话站点。',
      },
    ],
    updatedAt: now,
  }
}

function hasOwnerKeyword(text: string): boolean {
  return OWNER_QUERY_KEYWORDS.some((kw) => text.includes(kw))
}

/** 本地主人资料回答（非 LLM 流式） */
export function isLocalOwnerAssistantMessage(message: ChatMessage): boolean {
  return message.role === 'assistant' && message.id.startsWith('local-')
}

function isLlmAssistantMessage(message: ChatMessage): boolean {
  return (
    message.role === 'assistant' &&
    !message.id.startsWith('local-') &&
    !message.id.startsWith('greeting-')
  )
}

/** 自最近一条消息向前追溯，直到遇到 LLM 回复；其间若有主人关键词或本地主人回答则视为仍在主人上下文中 */
function wasRecentOwnerConversation(recentMessages: ChatMessage[]): boolean {
  for (let i = recentMessages.length - 1; i >= 0; i--) {
    const msg = recentMessages[i]
    if (isLlmAssistantMessage(msg)) return false
    if (isLocalOwnerAssistantMessage(msg)) return true
    if (msg.role === 'user' && hasOwnerKeyword(msg.content)) return true
  }
  return false
}

/** 短追问或属性词追问（如「体重呢」「那爱好怎么样」） */
function isOwnerFollowUpQuery(text: string): boolean {
  if (NAME_PATTERNS.test(text) || NICKNAME_PATTERNS.test(text)) return true

  const hint = stripOwnerKeywords(text)
  if (hint.length >= 2) return true

  const normalized = text.trim()
  if (normalized.length <= 16 && /(?:呢|吗|啊)[？?]?$/.test(normalized)) return true
  if (isGeneralIntroQuery(normalized)) return true

  return false
}

/**
 * 判断是否应走主人资料检索路径。
 * 除当前句含主人关键词外，若最近对话仍在主人上下文中且当前为追问，也返回 true。
 */
export function isOwnerRelatedQuery(text: string, recentMessages: ChatMessage[] = []): boolean {
  const normalized = text.trim()
  if (!normalized) return false
  if (hasOwnerKeyword(normalized)) return true
  if (!recentMessages.length) return false
  if (!wasRecentOwnerConversation(recentMessages)) return false
  return isOwnerFollowUpQuery(normalized)
}

function formatAliases(profile: OwnerProfile): string {
  const names = [...profile.nicknames]
  if (profile.realName && !names.includes(profile.realName)) {
    names.unshift(profile.realName)
  }
  return names.join('、')
}

function formatFullProfile(profile: OwnerProfile): string {
  const lines: string[] = []
  lines.push(`关于${profile.title}（${formatAliases(profile)}）：`)
  lines.push('')
  lines.push(profile.summary)
  if (profile.facts.length) {
    lines.push('')
    for (const fact of profile.facts) {
      lines.push(`- **${fact.topic}**：${fact.content}`)
    }
  }
  return lines.join('\n')
}

const QUERY_FILLER_WORDS = [
  '请问',
  '告诉',
  '知道',
  '关于',
  '什么',
  '怎么',
  '如何',
  '哪些',
  '哪个',
  '多少',
  '有没有',
  '是什么',
  '有哪些',
  '怎么样',
  '一下',
  '小柒',
  '助手',
  '想问',
  '询问',
  ...OWNER_QUERY_KEYWORDS,
  '吗',
  '呢',
  '啊',
  '呀',
  '的',
  '是',
  '谁',
  '哪',
  '位',
  '有',
  '没',
  '不',
  '我',
  '你',
]

function stripOwnerKeywords(query: string): string {
  let text = query.trim()
  for (const kw of [...OWNER_QUERY_KEYWORDS].sort((a, b) => b.length - a.length)) {
    text = text.replaceAll(kw, '')
  }
  for (const word of [...QUERY_FILLER_WORDS].sort((a, b) => b.length - a.length)) {
    text = text.replaceAll(word, '')
  }
  return text.replace(/[？?！!。，,、；;：:\s]+/g, '').trim()
}

function isGeneralIntroQuery(query: string): boolean {
  const normalized = query.trim()
  if (!normalized) return true
  if (GENERAL_INTRO_PATTERN.test(normalized)) return true
  return (
    stripOwnerKeywords(normalized).length === 0 &&
    OWNER_QUERY_KEYWORDS.some((kw) => normalized.includes(kw))
  )
}

function findMatchingFacts(query: string, profile: OwnerProfile) {
  const normalized = query.trim()
  const byTopic = [...profile.facts]
    .filter((fact) => fact.topic.length >= 2 && normalized.includes(fact.topic))
    .sort((a, b) => b.topic.length - a.topic.length)

  if (byTopic.length) {
    const longestTopic = byTopic[0].topic.length
    return byTopic.filter((fact) => fact.topic.length === longestTopic)
  }

  const topicHint = stripOwnerKeywords(normalized)
  if (topicHint.length < 2) return []

  return profile.facts.filter(
    (fact) =>
      fact.topic.includes(topicHint) ||
      fact.content.includes(topicHint) ||
      topicHint.includes(fact.topic),
  )
}

function answerIdentityQuery(query: string, profile: OwnerProfile): string | null {
  if (NAME_PATTERNS.test(query) && profile.realName) {
    return `${profile.title}的名字是 **${profile.realName}**。`
  }
  if (NICKNAME_PATTERNS.test(query) && profile.nicknames.length) {
    return `${profile.title}的常用称呼有：**${profile.nicknames.join('、')}**。`
  }
  return null
}

/** 根据已存资料生成回答；只返回与问题相关的条目，无匹配时提示暂无 */
export function answerOwnerQuery(
  query: string,
  profile: OwnerProfile = getDefaultOwnerProfile(),
): string {
  const normalized = query.trim()
  if (!normalized || isGeneralIntroQuery(normalized)) {
    return formatFullProfile(profile)
  }

  const identityAnswer = answerIdentityQuery(normalized, profile)
  if (identityAnswer) {
    return identityAnswer
  }

  const matchedFacts = findMatchingFacts(normalized, profile)
  if (matchedFacts.length) {
    return matchedFacts.map((fact) => `**${fact.topic}**：${fact.content}`).join('\n\n')
  }

  const hint = stripOwnerKeywords(normalized) || '这个'
  return `关于「${hint}」，我暂时没有记录${profile.title}的相关信息～`
}

export function createGreetingMessage(): ChatMessage {
  return {
    id: `greeting-${Date.now()}`,
    role: 'assistant',
    content: ASSISTANT_GREETING,
    createdAt: Date.now(),
  }
}

export function createLocalAssistantMessage(content: string): ChatMessage {
  return {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    role: 'assistant',
    content,
    createdAt: Date.now(),
  }
}
