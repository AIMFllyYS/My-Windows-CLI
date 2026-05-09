# My-Windows-CLI

<!-- Badges -->
<div align="center">

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/AIMFllyYS/My-Windows-CLI/blob/master/LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

</div>

---

[English](README.md) | [中文](README_zh-CN.md)

---

> A powerful Windows CLI tool for developers, providing quick access to project paths, GitHub status, AI CLI commands, and interactive AI chat.

## ✨ Features | 功能特点

| Feature | 功能 |
|---------|------|
| 📁 **Project Paths** - Scan and display all projects in `C:\project` | 项目路径扫描 - 自动扫描 `C:\project` 下所有项目 |
| 🐙 **GitHub Status** - View recent issues and auth commands | GitHub 状态 - 查看最新 Issues 和认证命令 |
| ⚡ **AI CLI Reference** - Commands for Claude, Kiro, Codex, Gemini, Cursor | AI CLI 参考 - Claude, Kiro, Codex, Gemini, Cursor 命令 |
| 🚀 **App Launcher** - Quick launch commands for common apps | 应用启动 - 常用应用的快速启动命令 |
| 🤖 **AI Chat Mode** - Interactive AI conversation with DeepSeek/GLM | AI 对话模式 - 与 DeepSeek/智谱 GLM 的交互式 AI 对话 |
| 🧹 **Clear** - AI-assisted cleanup of useless processes & C drive | AI 辅助清理 - 无用进程清理 + C 盘清理 |

## 🚀 Quick Start | 快速开始

### Prerequisites | 前置要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

### Installation | 安装

```bash
# Clone the repository
git clone https://github.com/AIMFllyYS/My-Windows-CLI.git
cd My-Windows-CLI

# Install dependencies
npm install

# Build TypeScript
npm run build

# Link globally (optional)
npm link

# Package to exe (optional)
npm run pkg
```

### First Run | 首次运行

```bash
# Copy and configure environment variables
cp .env.example .env
# Edit .env and add your API keys

# Run
coding
```

## 📖 Usage | 使用指南

### Basic Commands | 基本命令

```bash
# Full output (all info)
coding

# Short output
coding --short

# Show only specific sections
coding --paths      # Project paths only
coding --apps       # App launch commands only
coding --issues     # GitHub issues only
```

### AI CLI Reference | AI CLI 参考

```bash
# Show all AI CLI auto commands
coding --cli all

# Show specific CLI tool commands
coding --cli cc      # Claude Code
coding --cli kiro    # Kiro
coding --cli codex   # Codex
coding --cli gemini  # Gemini
coding --cli cursor  # Cursor

# With task description
coding --cli cc --task "Fix the login bug"
```

### AI Chat Mode | AI 对话模式

```bash
# Start interactive chat
coding --chat

# Or use alias
coding --ai

# Specify model
coding --chat --model deepseek-chat
```

### Clear Mode | 清理模式

```bash
# AI-assisted useless process cleanup | AI 辅助清理无用后台进程
coding --clear -p
coding --clear --process

# AI-assisted C drive cleanup | AI 辅助 C 盘清理
coding --clear -d
coding --clear --drive

# Both process + drive cleanup | 同时进行进程和硬盘清理
coding --clear -a
coding --clear --all

# Shortcut | 快捷方式
coding --clear-a
```

> **Clear Features | 清理特性**
> - 🤖 AI analyzes which processes/files are safe to remove
> - 🛡️ Local whitelist protects system-critical processes
> - ✅ User confirmation before any deletion
> - 📝 Detailed logs saved to `scripts/logs/`
> - 🧹 C drive: Conservative / Aggressive dual modes

> **AI Chat Features | AI 对话特性**
> - 🔒 Read-only mode - Cannot edit/create/delete files
> - 🛠️ Available tools: `ls`, `dir`, `Read`, `Grep`, `WebSearch`
> - 🔍 Built-in web search with auto AI summarization
> - 🧠 Multiple models: DeepSeek V4, GLM-4.7/4.5/5
> - 💬 Multi-turn conversations
> - 🌐 Uses DeepSeek / ZhiPu API

## 📋 Supported AI CLI Tools | 支持的 AI CLI 工具

| Tool | CLI Command | Auto Mode Command |
|------|-------------|-------------------|
| **Claude Code** | `claude` | `claude chat --no-interactive --dangerously-skip-permissions "task"` |
| **Kiro** | `kiro-cli` | `kiro-cli chat --no-interactive --trust-all-tools "task"` |
| **Codex** | `codex` | `codex --standalone "task"` |
| **Gemini** | `gemini` | `gemini "task"` |
| **Cursor** | `cursor` | `cursor --no-install "task"` |

## ⚙️ Configuration | 配置

### Environment Variables | 环境变量

Create a `.env` file based on `.env.example`:

```bash
# DeepSeek API Key (required for AI chat)
DEEPSEEK_API_KEY=your_api_key_here

# ZhiPu API Key (required for web search and GLM models)
ZHIPU_API_KEY=your_api_key_here

# GitHub Token (optional, for GitHub features)
# Can also be read from ~/project/1037Solo/StudySolo-Dev/backend/.env
```

### Windows Startup | 开机自启动

```powershell
# Run the shortcut creation script
powershell -ExecutionPolicy Bypass -File create_shortcut.ps1
```

## 🛠️ Development | 开发

```bash
# Build
npm run build

# Watch mode (development)
npm run build -- --watch

# Package for distribution
npm run pkg

# Clean build artifacts
npm run clean
```

## 📁 Project Structure | 项目结构

```
My-Windows-CLI/
├── src/
│   ├── index.ts              # Entry point & command parsing
│   ├── modules/
│   │   ├── github/           # GitHub integration
│   │   │   ├── auth.ts       # Account management & switching
│   │   │   ├── issues.ts     # Issues fetching
│   │   │   └── index.ts      # Module exports
│   │   ├── clear/            # AI-assisted cleanup (process + drive)
│   │   │   ├── process.ts    # Process cleanup
│   │   │   ├── drive.ts      # C drive cleanup
│   │   │   ├── scan.ts       # Process scanning
│   │   │   ├── ai-filter.ts  # AI judgment
│   │   │   ├── kill.ts       # Process termination
│   │   │   ├── logger.ts     # Cleanup logs
│   │   │   └── index.ts      # Unified entry
│   │   ├── paths.ts          # Project path scanning
│   │   ├── cli.ts            # AI CLI commands reference
│   │   ├── apps.ts           # App launch commands
│   │   └── chat/             # AI chat (DeepSeek / ZhiPu)
│   ├── utils/
│   │   ├── config.ts         # Shared config management
│   │   └── selector.ts       # Interactive terminal selector
│   └── types/                # TypeScript type definitions
├── scripts/
│   ├── create_shortcut.ps1   # Windows startup shortcut
│   ├── clean-c-drive.ps1     # C drive cleanup PowerShell script
│   ├── logs/                 # Cleanup logs (git-ignored)
│   └── tmp/                  # Temporary files (git-ignored)
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## 🤝 Contributing | 贡献

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License | 许可证

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments | 致谢

- [Anthropic Claude Code](https://docs.anthropic.com/en/docs/claude-code) - AI coding assistant
- [DeepSeek](https://www.deepseek.com/) - LLM API provider
- [ZhiPu AI](https://www.zhipu.ai/) - GLM model API provider
- [pkg](https://github.com/vercel/pkg) - Package Node.js apps
- 乐事学长 - C drive cleanup PowerShell script source

---

<p align="center">
Made with ❤️ by <a href="https://github.com/AIMFllyYS">AIMFllyYS</a>
</p>
