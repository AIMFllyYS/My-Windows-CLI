# Current State And Gap Audit

Audit date: 2026-06-14.

## Verified Repository State

- Branch: `codex/ai-cli-claude-port`.
- Current untracked file at audit time: `tmp_input.txt`.
- Existing test files include AI config, modes, permissions, prompt, tools, tool loop, skills runtime, subagents, keybindings, typeahead, UI, desktop actions, desktop config, and desktop release assets.
- Current root package already has:
  - `build`
  - `desktop:install`
  - `desktop:build`
  - `desktop:dist:win`
  - `desktop:dist:mac`

Recent completed commits show that the branch already contains:

- Slash suggestion ranking and alias handling.
- Slash keybinding resolver.
- Plan approval tool and plan approval panel.
- Current plan persistence.
- Agent definitions registry.
- Scoped subagent prompts and task tool.
- Provider tool filtering by mode.
- Desktop release asset display.
- Desktop clear, skills, and install safety adjustments.

## Implemented Runtime Surfaces

### Commands

`src/chat/commands.ts` already defines:

- `/chat`
- `/agent`
- `/plan`
- `/plan open`
- `/agent spawn <task>`
- `/agent list`
- `/agent cancel <id>`
- `/setting`
- `/model`
- `/model info`
- `/skills`
- `/skill <id|name>`
- `/search <query>`
- `/clear`
- `/help`
- `/exit`

Gap:

- The registry shape is useful, but it is still smaller than Claude Code command metadata.
- Source annotations, command availability, command argument UI, plugin/skill command injection, and richer suggestion grouping need another pass.

### Typeahead And Keybindings

`src/chat/typeahead.ts` already implements:

- Slash suggestions.
- Alias matching.
- Mid-input slash completion.
- Visible command rendering.
- Selection movement.
- Prompt-level key handling.

Gap:

- Visual rendering still has terminal glyph/encoding risk.
- Path completion, unified suggestions, command-help integration, footer hints, and richer menu layout still need Claude Code-style porting.

### Session Modes

`src/chat/session.ts` already supports:

- `chat`, `agent`, `plan`.
- `ask`, `bypass`, `plan`.
- Active model.
- Active skill IDs.
- Current plan and plan file path.
- Subagent queue reference.

Gap:

- Mode prompt contracts need a stricter audit against actual tool availability.
- `/plan` should have stronger approval lifecycle tests across rejection, editing, approval, and transition back to agent.

### Permissions

`src/chat/permissions/engine.ts` already supports:

- Workspace path resolution.
- Dangerous path denial.
- Read allow.
- Chat write denial.
- Plan write denial.
- Agent ask/bypass.
- Session allow/deny tools and rules.

Gap:

- Permission prompt UI is still much flatter than Claude Code.
- File write/edit diff preview, shell-specific options, allow-once vs allow-session clarity, reject feedback, and Recent Denials-style UX are not yet fully modeled.

### Provider And Tool Loop

`src/chat/provider.ts` already supports:

- Custom OpenAI-compatible base URL.
- API key.
- Model override.
- Streaming and non-streaming calls.
- Tool specs for custom provider and Zhipu.

`src/chat/agent/loop.ts` already supports:

- Tool call rounds.
- Permission-required result.
- Plan-approval-required result.
- Agent task delegation hook.

Gap:

- Error messages in provider output show encoding damage in the current file. This must be fixed in a dedicated UTF-8 pass.
- OpenAI-compatible tool calling should be provider-neutral, not selectively attached only for some providers.
- Tool result pairing, malformed tool call handling, and multi-tool ordering need more negative tests.

### Skills

`src/chat/skills.ts` already supports:

- Skill root discovery.
- `SKILL.md` detection.
- Metadata preview reads.
- On-demand content loading.
- Active skill prompt context.
- UTF-8 read path.

Gap:

- This is a single file. It should split into discovery, frontmatter, runtime, formatting, and injection modules.
- Frontmatter parsing is regex-based and should be formalized enough for known Claude skill metadata.
- Trigger matching, slash command integration, and skill source precedence need tests.

### Subagents

`src/chat/agent/**` already supports:

- Queue creation.
- Enqueue, list, cancel, run next.
- Parent permission narrowing.
- Scoped tool specs.
- Prompt building.
- Built-in agent definitions.
- Task tool integration.

Gap:

- Activity timeline is still thin.
- No robust parallel scheduling policy.
- Cancellation propagation to active model/tool work needs stricter behavior.
- Agent memory/snapshot/source loading from Claude Code has not been deeply ported.

### Terminal UI

`src/chat/ui/layout.ts` already supports:

- Status header.
- Mode pill.
- Permission box.
- Plan approval panel.
- Timeline entry.

Gap:

- Current output contains mojibake in Chinese labels and glyphs.
- UI still needs a systematic pass against Claude Code Dialog, Byline, KeyboardShortcutHint, messages, Spinner, and prompt footer components.
- Snapshot tests should assert visible width and absence of replacement characters.

### Desktop

`desktop/src/renderer/App.tsx` already has:

- Left sidebar.
- Main conversation area.
- Right inspector tabs.
- Tools panel.
- Native clear/install/skills panels.
- Settings release panel.

`desktop/src/renderer/action-catalog.ts` already lists:

- `hi --clear`
- `hi --skills`
- `hi --install`
- `hi --state`
- `hi --api`
- `hi --pay`

Gap:

- Desktop is still a dashboard, not a real AI conversation client.
- Visual design needs stronger Claude/Codex parity.
- Release panel is present, but workflow verification and GitHub release asset checks should be part of release rounds.
- IPC must remain noninteractive and whitelist-only.

## Risk Register

### P0 Risks

- Accidentally porting login, telemetry, account, billing, or Anthropic internal code.
- `--auto-accept` allowing writes outside the workspace.
- Desktop IPC running interactive or unbounded commands that hang the renderer.
- Provider tool-call pairing drift causing malformed model/tool messages.
- UTF-8 damage to Chinese docs, prompts, or runtime messages.

### P1 Risks

- Rebuilding from scratch instead of copying Claude Code structure.
- Over-broad refactors that touch unrelated CLI modules.
- Slash menu looks better but stops executing canonical commands.
- Skills content becomes trusted instruction instead of contextual reference.
- Subagents can widen parent permission.
- Desktop release artifacts are built locally but not attached to GitHub Releases.

### P2 Risks

- UI snapshot tests become too brittle around terminal colors.
- Model metadata stays hand-curated and drifts.
- Path completion gets slow on large repos.
- Desktop visual polish hides command output needed for debugging.

## Immediate Next Move

Start with Round 0 in `03-execution-rounds.md`: create a checkpoint commit for this planning pack, then execute Round 1 only after the user explicitly starts implementation.
