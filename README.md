# Chat 前端

React + TypeScript + Vite + Ant Design 对话前端，与桌面 `node` 后端项目分离部署。

> **架构与设计留痕** → 见 [docs/DESIGN.md](./docs/DESIGN.md)

发生**技术栈、依赖或前端架构**变更后，请在 Cursor 对话中执行 **stack-changelog** skill（输入 `stack-changelog` 或「技术栈留痕」）。

**`git push` 前会强制检查**：若待推送提交改了 `package.json`、Vite/TS 配置等技术栈文件，但未同步 `docs/DESIGN.md`，push 将被拒绝。本地自检：`npm run check:stack-changelog`。

**Git 提交并推送**：在 Cursor 对话输入 **`crm`**，执行 [`.cursor/skills/crm/`](./.cursor/skills/crm/SKILL.md)。

## 项目结构

```
chat/
├── src/             # React 源码
├── docs/            # 设计文档与 mockups
├── .cursor/skills/  # Cursor Agent Skills
└── package.json
```

## 快速开始

```bash
npm install
npm run dev
```

- 前端：http://localhost:5173
- 后端 API 代理：`/api` → http://localhost:3000（需单独启动 `node` 项目）

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建（输出 `dist/`） |
| `npm run check:stack-changelog` | 检查待推送变更是否已同步 DESIGN.md |
