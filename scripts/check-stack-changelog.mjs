#!/usr/bin/env node
/**
 * 检测待推送提交中是否改了技术栈相关文件但未同步 docs/DESIGN.md。
 * 用于 pre-push hook、Cursor beforeShellExecution、手动 npm run check:stack-changelog
 *
 * 跳过：SKIP_STACK_CHANGELOG=1 或 git push --no-verify
 */
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const DESIGN_DOC = 'docs/DESIGN.md'

const STACK_PATTERNS = [
  /^package\.json$/,
  /package-lock\.json$/,
  /pnpm-lock\.yaml$/,
  /yarn\.lock$/,
  /^vite\.config\./,
  /tsconfig[^/]*\.json$/,
  /docker-compose[^/]*\.ya?ml$/,
]

function norm(p) {
  return p.replace(/\\/g, '/')
}

function isStackFile(file) {
  const p = norm(file)
  return STACK_PATTERNS.some((re) => re.test(p))
}

function isDesignDoc(file) {
  return norm(file) === DESIGN_DOC
}

function git(cmd) {
  return execSync(`git ${cmd}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

function filesInRange(range) {
  if (!range) return []
  try {
    const out = git(`diff --name-only ${range}`)
    return out ? out.split('\n').filter(Boolean) : []
  } catch {
    return []
  }
}

function parsePrePushStdin(stdin) {
  const ranges = []
  for (const line of stdin.trim().split('\n').filter(Boolean)) {
    const parts = line.split(/\s+/)
    if (parts.length < 4) continue
    const [, localSha, , remoteSha] = parts
    if (/^0+$/.test(localSha)) continue

    if (/^0+$/.test(remoteSha)) {
      let base = localSha
      for (const cmd of [
        'merge-base HEAD refs/remotes/origin/HEAD',
        'merge-base HEAD origin/main',
        'rev-list --max-parents=0 HEAD',
      ]) {
        try {
          base = git(cmd).split('\n').pop()
          break
        } catch {
          /* try next */
        }
      }
      ranges.push(`${base}..${localSha}`)
    } else {
      ranges.push(`${remoteSha}..${localSha}`)
    }
  }
  return ranges
}

function pendingPushFiles() {
  try {
    const out = git('diff --name-only @{upstream}...HEAD')
    return out ? out.split('\n').filter(Boolean) : []
  } catch {
    try {
      const out = git('diff --name-only HEAD~1..HEAD')
      return out ? out.split('\n').filter(Boolean) : []
    } catch {
      return []
    }
  }
}

function collectFiles() {
  if (process.env.SKIP_STACK_CHANGELOG === '1') {
    return { files: [], skipped: true }
  }

  let stdin = ''
  try {
    stdin = readFileSync(0, 'utf8')
  } catch {
    /* no stdin */
  }

  const all = new Set()

  if (stdin.trim()) {
    for (const range of parsePrePushStdin(stdin)) {
      filesInRange(range).forEach((f) => all.add(f))
    }
  } else if (process.argv[2]) {
    filesInRange(process.argv[2]).forEach((f) => all.add(f))
  } else if (process.env.STACK_CHECK_MODE === 'pending') {
    pendingPushFiles().forEach((f) => all.add(f))
  } else {
    pendingPushFiles().forEach((f) => all.add(f))
  }

  return { files: [...all], skipped: false }
}

function failMessage() {
  return `
push 被拒绝：检测到技术栈相关文件变更，但 docs/DESIGN.md 未同步更新。

请在 Cursor 对话中执行 stack-changelog skill：
  → 输入「stack-changelog」或「技术栈留痕」

Skill：.cursor/skills/stack-changelog/SKILL.md

临时跳过（仅紧急情况）：
  SKIP_STACK_CHANGELOG=1 git push
  或 git push --no-verify
`.trim()
}

function main() {
  try {
    git('rev-parse --git-dir')
  } catch {
    process.exit(0)
  }

  const { files, skipped } = collectFiles()
  if (skipped) process.exit(0)

  const stackChanged = files.some(isStackFile)
  const designChanged = files.some(isDesignDoc)

  if (stackChanged && !designChanged) {
    console.error(failMessage())
    if (files.length) {
      console.error('\n相关变更文件：')
      files.filter(isStackFile).forEach((f) => console.error(`  - ${f}`))
    }
    process.exit(1)
  }

  process.exit(0)
}

main()
