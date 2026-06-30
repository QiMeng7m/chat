#!/usr/bin/env node
import { execSync } from 'node:child_process'

try {
  execSync('git rev-parse --git-dir', { stdio: 'ignore' })
  execSync('git config core.hooksPath .githooks', { stdio: 'inherit' })
  console.log('Git hooks 已指向 .githooks（含 pre-push stack-changelog 检查）')
} catch {
  // 尚未 git init 时静默跳过
}
