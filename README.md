# My-Windows-CLI

A powerful Windows CLI tool for developers - providing quick access to project paths, GitHub status, AI CLI commands, and interactive AI chat.

## Features

### Quick Info Commands
```bash
coding              # Full output: paths + GitHub + CLI + apps
coding --short      # Short output
coding --paths      # Project paths only
coding --apps       # App launch commands only
coding --issues     # GitHub issues only
```

### CLI Reference
```bash
coding --cli cc      # Claude Code commands
coding --cli kiro    # Kiro CLI commands
coding --cli codex   # Codex CLI commands
coding --cli gemini  # Gemini CLI commands
coding --cli all     # All CLI auto commands
coding --cli cc --task "your task"  # With task description
```

### AI Chat Mode
```bash
coding --chat        # Start interactive AI chat
coding --ai          # Alias for --chat
coding --chat --model deepseek-chat  # Specify model
```

AI Chat features:
- Interactive multi-turn conversations
- Read-only mode (no file editing)
- Available tools: ls, dir, Read, Grep, WebSearch
- Uses DeepSeek API

### GitHub Integration
```bash
coding --issues      # Show recent issues + auth commands
```

Auth commands:
- `gh auth status` - Check login status
- `gh auth login` - Interactive login
- `gh auth logout` - Logout
- `gh auth login --with-token <TOKEN>` - Token login

## Installation

```bash
# Clone the repository
git clone https://github.com/AIMFllyYS/My-Windows-CLI.git
cd My-Windows-CLI

# Install dependencies
npm install

# Build
npm run build

# Link globally
npm link

# Package to exe (optional)
npm run pkg
```

## Supported AI CLI Tools

| Tool | Command | Auto Mode |
|------|---------|-----------|
| Claude Code | `claude` | `claude chat --no-interactive --dangerously-skip-permissions "task"` |
| Kiro | `kiro-cli` | `kiro-cli chat --no-interactive --trust-all-tools "task"` |
| Codex | `codex` | `codex --standalone "task"` |
| Gemini | `gemini` | `gemini "task"` |
| Cursor | `cursor` | `cursor --no-install "task"` |

## Tech Stack

- Node.js / TypeScript
- pkg (for exe packaging)
- DeepSeek API (AI chat)

## License

MIT
