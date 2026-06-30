const MOCK_REPLIES = [
  '喵～收到啦！这是 **mock 流式回复**，F-05 会对接真实 SSE 🐾',
  '**推荐步骤：**\n\n1. 看看迁移状态：\n\n```bash\ncd server\nnpx prisma migrate status\n```\n\n2. 开发环境可重置（会清空数据）：\n\n```bash\nnpx prisma migrate reset\n```\n\n搞定请猫猫吃小鱼干～ 🐟',
  '好问题！在开发环境里可以先 `npm run db:migrate` 试试看～\n\n- 先确认 `.env` 里数据库连接\n- 再跑 `npm run db:seed` 补种数据 ✨',
]

function pickReply(userText: string): string {
  const index = userText.length % MOCK_REPLIES.length
  return MOCK_REPLIES[index]!.replace('收到啦', `收到啦：「${userText.slice(0, 40)}${userText.length > 40 ? '…' : ''}」`)
}

export async function* mockStreamReply(
  userText: string,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const text = pickReply(userText)
  for (const char of text) {
    if (signal?.aborted) return
    yield char
    await new Promise((resolve) => setTimeout(resolve, 18 + Math.random() * 22))
  }
}
