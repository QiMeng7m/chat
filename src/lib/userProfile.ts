import type { UserFact, UserProfile } from '../api/types'
import type { ChatMessage } from '../types/chat'

export type { UserFact, UserProfile } from '../api/types'

export const ASK_NAME_PROMPT =
  '我还不知道你怎么称呼，请告诉我你的名字，例如「我叫张三」，之后我才能帮你记录和查询个人信息。'

export function getDefaultUserProfile(): UserProfile {
  return {
    version: 1,
    nicknames: [],
    summary: '',
    facts: [],
    updatedAt: Date.now(),
  }
}

const SELF_INTRO_PATTERNS = [
  /我叫/,
  /我的名字/,
  /姓名(?:叫|是)/,
  /^[\u4e00-\u9fa5]{2,4}$/,
  /身高\s*\d/,
  /体重\s*\d/,
  /性格(?:比较|偏|很|是)/,
  /我比较/,
  /我是\s*.{1,6}人/,
  /我的.{1,8}(?:是|为)/,
  /记(?:住|一下)/,
  /更新(?:一下)?(?:我的)?资料/,
]

const NAME_CLAIM_PATTERNS = /(?:我叫|我是|我的名字(?:叫|是)?|姓名(?:叫|是)?)/
const NAME_PATTERNS = /名字|姓名|真名|本名|叫什么/
const PERSONAL_INFO_TOPICS = /身高|体重|性格|爱好|年龄|生日|职业|工作|电话|手机/
const GENERAL_INTRO_PATTERN =
  /(?:详细|全部|所有)(?:介绍|资料|信息)|介绍一下|是谁|什么人|了解一下|说说(?:一下)?|讲讲(?:一下)?|^资料$/

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

export type UserProfileAction =
  | { type: 'save'; profile: UserProfile }
  | { type: 'ask_name' }
  | { type: 'query' }
  | { type: 'reject'; message: string }

function slugId(topic: string): string {
  return `fact-${topic.replace(/\s+/g, '-')}`
}

/** 从自然语言自我介绍中提取结构化信息 */
export function parseSelfIntro(text: string): {
  realName?: string
  facts: UserFact[]
} {
  const normalized = text.trim()
  const facts: UserFact[] = []
  let realName: string | undefined

  const nameMatch = normalized.match(
    /(?:我叫|我是|我的名字(?:叫|是)?|姓名(?:叫|是)?)\s*([^\s，,。.!！？?；;]+)/,
  )
  if (nameMatch?.[1]) {
    realName = nameMatch[1].trim()
  }

  const heightMatch = normalized.match(/身高(?:是)?\s*(\d+(?:\.\d+)?)\s*(?:cm|厘米|CM)?/)
  if (heightMatch?.[1]) {
    facts.push({ id: 'height', topic: '身高', content: `${heightMatch[1]}cm` })
  }

  const weightMatch = normalized.match(/体重(?:是)?\s*(\d+(?:\.\d+)?)\s*(?:kg|KG|公斤|斤)?/)
  if (weightMatch?.[1]) {
    facts.push({ id: 'weight', topic: '体重', content: `${weightMatch[1]}kg` })
  }

  const personalityMatch = normalized.match(/性格(?:比较|偏|很|是)?\s*([^\s，,。.!！？?；;]+)/)
  if (personalityMatch?.[1]) {
    facts.push({ id: 'personality', topic: '性格', content: personalityMatch[1] })
  } else {
    const iMatch = normalized.match(/我比较\s*([^\s，,。.!！？?；;]+)/)
    if (iMatch?.[1]) {
      facts.push({ id: 'personality', topic: '性格', content: `比较${iMatch[1]}` })
    }
  }

  const myPattern = /我的\s*([^\s是]{1,8})\s*(?:是|为)\s*([^\s，,。.!！？?；;]+)/g
  let match: RegExpExecArray | null
  while ((match = myPattern.exec(normalized)) !== null) {
    const topic = match[1]?.trim()
    const content = match[2]?.trim()
    if (!topic || !content) continue
    if (facts.some((f) => f.topic === topic)) continue
    facts.push({ id: slugId(topic), topic, content })
  }

  return { realName, facts }
}

/** 从简短回复中解析姓名（含「我叫张三」或单独「张三」） */
export function parseNameOnly(text: string): string | undefined {
  const normalized = text.trim()
  const claimed = parseSelfIntro(normalized).realName
  if (claimed) return claimed
  if (/^[\u4e00-\u9fa5]{2,4}$/.test(normalized)) return normalized
  return undefined
}

export function isSelfIntroMessage(text: string): boolean {
  const normalized = text.trim()
  if (!normalized) return false
  return SELF_INTRO_PATTERNS.some((pattern) => pattern.test(normalized))
}

export function hasBoundName(profile: UserProfile): boolean {
  return Boolean(profile.realName?.trim())
}

function buildSummary(realName: string | undefined, facts: UserFact[]): string {
  const parts: string[] = []
  if (realName) parts.push(`姓名：${realName}`)
  for (const fact of facts) {
    parts.push(`${fact.topic}：${fact.content}`)
  }
  return parts.join('；')
}

/** 将对话提取的信息合并进已有资料；姓名一旦绑定不可更改，重复 topic 覆盖 */
export function mergeUserProfile(
  current: UserProfile,
  extracted: { realName?: string; facts: UserFact[] },
): UserProfile {
  const facts = [...current.facts]
  for (const newFact of extracted.facts) {
    const idx = facts.findIndex((f) => f.topic === newFact.topic || f.id === newFact.id)
    if (idx >= 0) facts[idx] = { ...facts[idx], ...newFact }
    else facts.push(newFact)
  }

  const realName = current.realName ?? extracted.realName
  const summary = buildSummary(realName, facts) || current.summary

  return {
    version: 1,
    realName,
    nicknames: current.nicknames,
    summary,
    facts,
    updatedAt: Date.now(),
  }
}

export function formatSaveConfirmation(profile: UserProfile): string {
  const lines: string[] = ['好的，已记住你的信息：', '']
  if (profile.realName) {
    lines.push(`- **姓名**：${profile.realName}`)
  }
  for (const fact of profile.facts) {
    lines.push(`- **${fact.topic}**：${fact.content}`)
  }
  if (lines.length === 2) {
    return '好的，但我没能从这句话里提取到具体信息，你可以再说详细一点，比如「我叫张三，身高175，体重70kg」。'
  }
  lines.push('')
  lines.push('下次你可以直接问我，比如「我的性格是什么」。')
  return lines.join('\n')
}

/** 尝试为他人保存信息（非「我叫…」且出现他人姓名 + 个人信息词） */
export function getThirdPartyStoreRejectMessage(text: string, ownName?: string): string | null {
  const normalized = text.trim()
  if (NAME_CLAIM_PATTERNS.test(normalized)) return null
  if (/^我(?:的)?/.test(normalized)) return null

  const thirdParty = normalized.match(
    /^([\u4e00-\u9fa5]{2,4})(?:的)?(?=.*(?:身高|体重|性格|爱好|年龄|生日))/,
  )
  if (!thirdParty?.[1]) return null

  const name = thirdParty[1]
  if (ownName && name === ownName) return null

  return `无法为他人「${name}」保存信息。每个账号只能绑定和管理自己的资料，请先说「我叫${ownName ?? '你的名字'}」。`
}

/** 查询他人资料（非本账号绑定姓名） */
export function getThirdPartyQueryRejectMessage(text: string, ownName?: string): string | null {
  const normalized = text.trim()
  if (/^我(?:的)?/.test(normalized)) return null
  if (NAME_PATTERNS.test(normalized) && !ownName) return null

  const foreign = normalized.match(
    /([\u4e00-\u9fa5]{2,4})(?:的)?(?:身高|体重|性格|爱好|年龄|生日|资料|信息)/,
  )
  if (!foreign?.[1]) return null

  const name = foreign[1]
  if (ownName && name === ownName) return null

  return `无法查询「${name}」的个人信息。每个账号只能查看自己绑定的资料${ownName ? `（当前绑定：${ownName}）` : ''}。`
}

export function getNameLockedRejectMessage(boundName: string, attemptedName: string): string {
  return `你的账号已绑定姓名「${boundName}」，无法更改为「${attemptedName}」。`
}

function isLocalUserProfileMessage(message: ChatMessage): boolean {
  return message.role === 'assistant' && message.id.startsWith('user-profile-')
}

function isLlmAssistantMessage(message: ChatMessage): boolean {
  return (
    message.role === 'assistant' &&
    !message.id.startsWith('user-profile-') &&
    !message.id.startsWith('local-') &&
    !message.id.startsWith('greeting-')
  )
}

/** 上一条助手消息是否在询问姓名 */
export function isAwaitingNameResponse(messages: ChatMessage[]): boolean {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]!
    if (msg.role === 'user') return false
    if (isLocalUserProfileMessage(msg) && msg.content.includes('我还不知道怎么称呼')) return true
  }
  return false
}

function wasRecentUserProfileConversation(recentMessages: ChatMessage[]): boolean {
  for (let i = recentMessages.length - 1; i >= 0; i--) {
    const msg = recentMessages[i]!
    if (isLlmAssistantMessage(msg)) return false
    if (isLocalUserProfileMessage(msg)) return true
    if (msg.role === 'user' && isSelfIntroMessage(msg.content)) return true
  }
  return false
}

/** 收集最近对话中待保存的个人信息（不含姓名） */
export function collectPendingFacts(messages: ChatMessage[]): UserFact[] {
  const facts: UserFact[] = []
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]!
    if (isLlmAssistantMessage(msg)) break
    if (msg.role !== 'user') continue
    const { facts: parsed } = parseSelfIntro(msg.content)
    for (const fact of parsed) {
      const idx = facts.findIndex((f) => f.topic === fact.topic)
      if (idx >= 0) facts[idx] = fact
      else facts.unshift(fact)
    }
  }
  return facts
}

export function isPersonalInfoQuery(text: string): boolean {
  const normalized = text.trim()
  if (!normalized) return false
  // 「我叫张三」是姓名声明，不是查询
  if (NAME_CLAIM_PATTERNS.test(normalized)) return false
  // 「我的身高是多少」「我的性格怎么样」
  if (/^我的/.test(normalized)) return true
  // 「我性格怎么样」（排除 我叫/我是/我比较 等陈述）
  if (
    /^我(?!叫|是|比)/.test(normalized) &&
    PERSONAL_INFO_TOPICS.test(normalized) &&
    /(?:什么|多少|几|哪|怎么样|如何|吗|呢|？|\?)/.test(normalized)
  ) {
    return true
  }
  if (PERSONAL_INFO_TOPICS.test(normalized) && /(?:什么|多少|几|哪|吗|呢|？|\?)/.test(normalized)) {
    return true
  }
  return false
}

function isUserProfileFollowUp(text: string): boolean {
  if (NAME_PATTERNS.test(text)) return true
  if (/^我(?:的)?/.test(text.trim())) return true
  const normalized = text.trim()
  if (normalized.length <= 16 && /(?:呢|吗|啊)[？?]?$/.test(normalized)) return true
  return false
}

export function isUserProfileQuery(
  text: string,
  profile: UserProfile,
  recentMessages: ChatMessage[] = [],
): boolean {
  const normalized = text.trim()
  if (!normalized) return false

  if (getThirdPartyQueryRejectMessage(normalized, profile.realName)) return true
  if (isPersonalInfoQuery(normalized)) return true

  if (!hasBoundName(profile)) return false

  if (profile.realName && normalized.includes(profile.realName)) return true
  if (/^我(?:的)?/.test(normalized)) return true
  if (NAME_PATTERNS.test(normalized)) return true

  if (!recentMessages.length) return false
  if (!wasRecentUserProfileConversation(recentMessages)) return false
  return isUserProfileFollowUp(normalized)
}

/**
 * 解析用户资料相关对话的下一步动作。
 * 规则：一账号一姓名；不可代存/查他人；无姓名时先询问。
 */
export function resolveUserProfileAction(
  text: string,
  profile: UserProfile,
  messages: ChatMessage[],
): UserProfileAction | null {
  const normalized = text.trim()
  if (!normalized) return null

  if (isAwaitingNameResponse(messages)) {
    const name = parseNameOnly(normalized)
    if (!name) {
      return { type: 'reject', message: '请直接告诉我你的名字，例如「我叫张三」。' }
    }
    if (hasBoundName(profile) && name !== profile.realName) {
      return {
        type: 'reject',
        message: getNameLockedRejectMessage(profile.realName!, name),
      }
    }
    const pendingFacts = collectPendingFacts(messages)
    const merged = mergeUserProfile(profile, { realName: name, facts: pendingFacts })
    return { type: 'save', profile: merged }
  }

  const thirdPartyQuery = getThirdPartyQueryRejectMessage(normalized, profile.realName)
  if (thirdPartyQuery && (isPersonalInfoQuery(normalized) || PERSONAL_INFO_TOPICS.test(normalized))) {
    return { type: 'reject', message: thirdPartyQuery }
  }

  // 自我介绍 / 资料保存优先于查询，避免「我叫XX」被误判为「还不知道你怎么称呼」
  if (isSelfIntroMessage(normalized)) {
    const thirdPartyStore = getThirdPartyStoreRejectMessage(normalized, profile.realName)
    if (thirdPartyStore) {
      return { type: 'reject', message: thirdPartyStore }
    }

    const extracted = parseSelfIntro(normalized)
    if (hasBoundName(profile) && extracted.realName && extracted.realName !== profile.realName) {
      return {
        type: 'reject',
        message: getNameLockedRejectMessage(profile.realName!, extracted.realName),
      }
    }

    if (!hasBoundName(profile) && !extracted.realName && extracted.facts.length > 0) {
      return { type: 'ask_name' }
    }

    const merged = mergeUserProfile(profile, extracted)
    if (!hasBoundName(merged)) {
      return { type: 'ask_name' }
    }

    return { type: 'save', profile: merged }
  }

  if (isUserProfileQuery(normalized, profile, messages)) {
    if (!hasBoundName(profile)) {
      return { type: 'ask_name' }
    }
    if (thirdPartyQuery) {
      return { type: 'reject', message: thirdPartyQuery }
    }
    return { type: 'query' }
  }

  return null
}

function formatAliases(profile: UserProfile): string {
  const names = [...profile.nicknames]
  if (profile.realName && !names.includes(profile.realName)) {
    names.unshift(profile.realName)
  }
  return names.join('、') || '你'
}

function formatFullProfile(profile: UserProfile): string {
  const subject = formatAliases(profile)
  const lines: string[] = [`关于${subject}的资料：`, '']
  if (profile.summary) lines.push(profile.summary)
  if (profile.facts.length) {
    if (profile.summary) lines.push('')
    for (const fact of profile.facts) {
      lines.push(`- **${fact.topic}**：${fact.content}`)
    }
  }
  return lines.join('\n')
}

function stripQueryKeywords(query: string, profile: UserProfile): string {
  const keywords = [...profile.nicknames]
  if (profile.realName) keywords.push(profile.realName)

  let text = query.trim()
  for (const kw of [...keywords].sort((a, b) => b.length - a.length)) {
    text = text.replaceAll(kw, '')
  }
  for (const word of [...QUERY_FILLER_WORDS].sort((a, b) => b.length - a.length)) {
    text = text.replaceAll(word, '')
  }
  return text.replace(/[？?！!。，,、；;：:\s]+/g, '').trim()
}

function isGeneralIntroQuery(query: string, profile: UserProfile): boolean {
  const normalized = query.trim()
  if (!normalized) return true
  if (GENERAL_INTRO_PATTERN.test(normalized)) return true
  return (
    stripQueryKeywords(normalized, profile).length === 0 &&
    (/^我(?:的)?(?:资料|信息)?$/.test(normalized) ||
      (profile.realName != null && normalized.includes(profile.realName)))
  )
}

function findMatchingFacts(query: string, profile: UserProfile) {
  const normalized = query.trim()
  const byTopic = [...profile.facts]
    .filter((fact) => fact.topic.length >= 2 && normalized.includes(fact.topic))
    .sort((a, b) => b.topic.length - a.topic.length)

  if (byTopic.length) {
    const longestTopic = byTopic[0]!.topic.length
    return byTopic.filter((fact) => fact.topic.length === longestTopic)
  }

  const topicHint = stripQueryKeywords(normalized, profile)
  if (topicHint.length < 2) return []

  return profile.facts.filter(
    (fact) =>
      fact.topic.includes(topicHint) ||
      fact.content.includes(topicHint) ||
      topicHint.includes(fact.topic),
  )
}

function answerIdentityQuery(query: string, profile: UserProfile): string | null {
  const subject = formatAliases(profile)
  if (NAME_PATTERNS.test(query) && profile.realName) {
    return `${subject}的名字是 **${profile.realName}**。`
  }
  return null
}

/** 根据当前账号绑定资料生成回答 */
export function answerUserProfileQuery(
  query: string,
  profile: UserProfile = getDefaultUserProfile(),
): string {
  const normalized = query.trim()
  const subject = formatAliases(profile)

  const thirdParty = getThirdPartyQueryRejectMessage(normalized, profile.realName)
  if (thirdParty) return thirdParty

  if (!normalized || isGeneralIntroQuery(normalized, profile)) {
    return formatFullProfile(profile)
  }

  const identityAnswer = answerIdentityQuery(normalized, profile)
  if (identityAnswer) return identityAnswer

  const matchedFacts = findMatchingFacts(normalized, profile)
  if (matchedFacts.length) {
    if (matchedFacts.length === 1) {
      const fact = matchedFacts[0]!
      return `${subject}的${fact.topic}是 **${fact.content}**。`
    }
    return matchedFacts.map((fact) => `**${fact.topic}**：${fact.content}`).join('\n\n')
  }

  const hint = stripQueryKeywords(normalized, profile) || '这个'
  return `关于「${hint}」，我暂时没有记录${subject}的相关信息～你可以直接告诉我，比如「我的${hint}是……」。`
}

export function createUserProfileAssistantMessage(content: string): ChatMessage {
  return {
    id: `user-profile-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    role: 'assistant',
    content,
    createdAt: Date.now(),
  }
}

export function formatProfileApiError(code: string, fallbackMessage: string): string {
  if (code === 'NAME_TAKEN') {
    return fallbackMessage || '该姓名已被其他账号绑定，请换一个姓名。'
  }
  if (code === 'NAME_LOCKED') {
    return fallbackMessage || '你的账号已绑定姓名，无法更改。'
  }
  if (code === 'NEED_NAME') {
    return ASK_NAME_PROMPT
  }
  return fallbackMessage || '保存个人资料失败，请稍后重试。'
}
