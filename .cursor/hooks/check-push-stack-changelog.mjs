#!/usr/bin/env node
/**
 * Cursor beforeShellExecution：拦截 git push，要求先完成 stack-changelog 留痕
 */
import { spawnSync } from 'node:child_process'
import { createInterface } from 'node:readline'

async function readStdin() {
  const rl = createInterface({ input: process.stdin })
  const lines = []
  for await (const line of rl) lines.push(line)
  return lines.join('\n')
}

function allow() {
  console.log(JSON.stringify({ permission: 'allow' }))
}

function deny() {
  console.log(
    JSON.stringify({
      permission: 'deny',
      user_message:
        '检测到技术栈相关变更未写入 docs/DESIGN.md。请先在对话执行 stack-changelog（或「技术栈留痕」），完成留痕后再 push。',
      agent_message:
        'Push blocked by stack-changelog gate. Read and execute .cursor/skills/stack-changelog/SKILL.md, update docs/DESIGN.md (especially §2.1 and §9), then retry git push.',
    }),
  )
}

const raw = await readStdin()
let command = ''
try {
  command = JSON.parse(raw).command ?? ''
} catch {
  allow()
  process.exit(0)
}

if (!/\bgit\s+push\b/.test(command)) {
  allow()
  process.exit(0)
}

if (/\b(--no-verify|-n)\b/.test(command)) {
  allow()
  process.exit(0)
}

const result = spawnSync('node', ['scripts/check-stack-changelog.mjs'], {
  encoding: 'utf8',
  env: { ...process.env, STACK_CHECK_MODE: 'pending' },
})

if (result.status !== 0) {
  deny()
  process.exit(0)
}

allow()
