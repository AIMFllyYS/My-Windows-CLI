# Claude Source Transplant Map

Source root:

`D:\project\MCP-Skills\ClaudeCode-Collection\ClaudeCode-Collection\claude-code-source`

My-CLI root:

`D:\new_project\My-CLI`

## Transplant Policy

For each source area:

1. Read the Claude Code source file listed here.
2. Identify reusable shape: data model, command registry, state machine, prompt contract, UI layout, or testable helper.
3. Copy/adapt only the reusable shape into My-CLI.
4. Delete account, telemetry, login, billing, entitlement, internal, remote, and vendor-locked behavior.
5. Add focused node:test coverage before or alongside implementation.
6. Commit the round with a source-aware message.

Do not import Claude Code as a runtime dependency.

## Slash Commands And Suggestions

Claude Code source:

- `src/commands.ts`
- `src/types/command.ts`
- `src/commands/model/index.js`
- `src/commands/plan/index.ts`
- `src/commands/skills/index.js`
- `src/commands/agents/index.js`
- `src/components/PromptInput/PromptInput.tsx`
- `src/components/PromptInput/PromptInputFooter.tsx`
- `src/components/PromptInput/PromptInputFooterSuggestions.tsx`
- `src/components/PromptInput/PromptInputHelpMenu.tsx`
- `src/components/PromptInput/PromptInputModeIndicator.tsx`
- `src/components/PromptInput/utils.ts`

My-CLI targets:

- `src/chat/commands.ts`
- `src/chat/typeahead.ts`
- `src/chat/keybindings.ts`
- `src/chat/index.ts`
- `src/chat/models.ts`
- `src/chat/modes.ts`
- `tests/ai-typeahead.test.js`
- `tests/ai-keybindings.test.js`

Copy/adapt:

- Command metadata shape.
- Aliases and hidden commands.
- User-facing description columns.
- Mode-aware availability.
- Footer hint concepts.
- Help menu grouping.
- Selection behavior.

Delete/avoid:

- Provider account availability.
- Usage/billing commands.
- Voice/mobile/remote commands.
- Internal debug commands unless they are local-only and explicitly useful.

## Path And Unified Suggestions

Claude Code source:

- `src/components/PromptInput/usePromptInputPlaceholder.ts`
- `src/components/ContextSuggestions.tsx`
- `src/components/GlobalSearchDialog.tsx`
- `src/hooks/useSlashCommands.ts`
- `src/hooks/useUnifiedSuggestions.ts`
- `src/utils/suggestions/*`

My-CLI targets:

- `src/chat/suggestions.ts`
- `src/chat/path-completion.ts`
- `src/chat/typeahead.ts`
- `tests/ai-suggestions.test.js`
- `tests/ai-path-completion.test.js`

Copy/adapt:

- Unified suggestion source model.
- Path matching.
- Ranking and filtering.
- Workspace-root safety.
- Windows path normalization.

Delete/avoid:

- IDE-only bridge behavior.
- Remote workspace sources.
- Suggestions that depend on account state.

## Permission UI And Permission Flow

Claude Code source:

- `src/components/permissions/PermissionDialog.tsx`
- `src/components/permissions/PermissionPrompt.tsx`
- `src/components/permissions/PermissionRequest.tsx`
- `src/components/permissions/FallbackPermissionRequest.tsx`
- `src/components/permissions/BashPermissionRequest/BashPermissionRequest.tsx`
- `src/components/permissions/BashPermissionRequest/bashToolUseOptions.tsx`
- `src/components/permissions/PowerShellPermissionRequest/PowerShellPermissionRequest.tsx`
- `src/components/permissions/PowerShellPermissionRequest/powershellToolUseOptions.tsx`
- `src/components/permissions/FileEditPermissionRequest/FileEditPermissionRequest.tsx`
- `src/components/permissions/FileWritePermissionRequest/FileWritePermissionRequest.tsx`
- `src/components/permissions/FileWritePermissionRequest/FileWriteToolDiff.tsx`
- `src/components/permissions/FilePermissionDialog/permissionOptions.tsx`
- `src/components/permissions/FilePermissionDialog/usePermissionHandler.ts`
- `src/components/permissions/rules/PermissionRuleList.tsx`
- `src/components/permissions/rules/RecentDenialsTab.tsx`
- `src/utils/permissions/*`

My-CLI targets:

- `src/chat/permissions/engine.ts`
- `src/chat/permissions/prompts.ts`
- `src/chat/tools/fs-write.ts`
- `src/chat/tools/shell.ts`
- `src/chat/ui/layout.ts`
- `src/chat/index.ts`
- `tests/ai-permissions.test.js`
- `tests/ai-permission-dialog.test.js`
- `tests/ai-tools.test.js`

Copy/adapt:

- Permission option vocabulary.
- Allow once.
- Allow for session.
- Reject.
- Reject with feedback.
- Cancel/back.
- Shell-specific command explanations.
- File diff permission panels.
- Recent denial summary.

Delete/avoid:

- Analytics hooks.
- Account-sourced policy.
- Remote sandbox permission sources.
- Org policy fetches.

## Terminal Rendering

Claude Code source:

- `src/components/design-system/Dialog.tsx`
- `src/components/design-system/Byline.tsx`
- `src/components/design-system/KeyboardShortcutHint.tsx`
- `src/components/design-system/Divider.tsx`
- `src/components/design-system/ListItem.tsx`
- `src/components/messages/*`
- `src/components/Spinner/*`
- `src/components/InterruptedByUser.tsx`
- `src/components/CompactSummary.tsx`
- `src/interactiveHelpers.tsx`
- `src/replLauncher.tsx`

My-CLI targets:

- `src/chat/ui/theme.ts`
- `src/chat/ui/layout.ts`
- `src/chat/terminal-ui.ts`
- `src/chat/stream-renderer.ts`
- `src/chat/spinner.ts`
- `src/chat/markdown.ts`
- `src/chat/index.ts`
- `tests/ai-ui.test.js`
- `tests/ai-prompt.test.js`

Copy/adapt:

- Compact header.
- Byline keyboard hints.
- Dialog/panel layout.
- Message timeline.
- Tool activity row structure.
- Spinner states.
- Interrupted-by-user display.

Delete/avoid:

- Full Ink runtime migration unless a dedicated later migration is approved.
- OAuth/account banners.
- Desktop upsell banners.
- Telemetry-driven UI.

## Interrupts And Exit

Claude Code source:

- `src/cli/exit.ts`
- `src/interactiveHelpers.tsx`
- `src/components/InterruptedByUser.tsx`
- `src/components/tasks/AsyncAgentDetailDialog.tsx`
- Keybinding usages under `src/components/**`

My-CLI targets:

- `src/chat/interrupts.ts`
- `src/chat/keybindings.ts`
- `src/chat/typeahead.ts`
- `src/chat/index.ts`
- `src/utils/selector.ts`
- `tests/ai-interrupts.test.js`
- `tests/ai-keybindings.test.js`

Copy/adapt:

- Repeated exit confirmation.
- First interrupt cancellation.
- Esc menu dismissal.
- Parent prompt return.
- Interrupted message display.

Delete/avoid:

- Remote task cancellation.
- IDE bridge cancellation.
- Account/session cleanup.

## Local Agents And Subagents

Claude Code source:

- `src/tasks.ts`
- `src/Task.ts`
- `src/tasks/types.ts`
- `src/tasks/LocalAgentTask/LocalAgentTask.tsx`
- `src/tasks/LocalMainSessionTask.ts`
- `src/tasks/stopTask.ts`
- `src/components/tasks/AsyncAgentDetailDialog.tsx`
- `src/components/tasks/renderToolActivity.js`
- `src/components/tasks/taskStatusUtils.js`
- `src/tools/AgentTool/AgentTool.tsx`
- `src/tools/AgentTool/runAgent.ts`
- `src/tools/AgentTool/forkSubagent.ts`
- `src/tools/AgentTool/loadAgentsDir.ts`
- `src/tools/AgentTool/agentDisplay.ts`
- `src/tools/AgentTool/agentMemory.ts`
- `src/tools/AgentTool/agentMemorySnapshot.ts`
- `src/tools/AgentTool/builtInAgents.ts`
- `src/tools/AgentTool/built-in/generalPurposeAgent.ts`
- `src/tools/AgentTool/built-in/exploreAgent.ts`
- `src/tools/AgentTool/built-in/planAgent.ts`
- `src/tools/AgentTool/built-in/verificationAgent.ts`

My-CLI targets:

- `src/chat/agent/types.ts`
- `src/chat/agent/runner.ts`
- `src/chat/agent/subagents.ts`
- `src/chat/agent/prompt.ts`
- `src/chat/agent/definitions.ts`
- `src/chat/agent/loop.ts`
- `src/chat/tools/registry.ts`
- `src/chat/ui/layout.ts`
- `tests/ai-subagents.test.js`
- `tests/ai-agent-loop.test.js`
- `tests/ai-tool-loop.test.js`

Copy/adapt:

- Task status vocabulary.
- Activity summary.
- Built-in agent definitions.
- Agent memory snapshot shape.
- Stop behavior.
- Tool narrowing.
- Parent-to-child context shaping.

Delete/avoid:

- Remote agents.
- Internal teammate tasks.
- Anthropic platform agent calls.
- Usage/account reporting.

## Skills Runtime

Claude Code source:

- `src/skills/loadSkillsDir.ts`
- `src/skills/bundledSkills.ts`
- `src/skills/mcpSkillBuilders.ts`
- `src/skills/bundled/index.ts`
- `src/services/skillSearch/*`
- `src/commands/skills/index.js`
- `src/tools/SkillTool/SkillTool.ts`
- `src/tools/SkillTool/prompt.ts`
- `src/tools/SkillTool/UI.tsx`

My-CLI targets:

- `src/chat/skills.ts`
- `src/chat/skills/discovery.ts`
- `src/chat/skills/frontmatter.ts`
- `src/chat/skills/runtime.ts`
- `src/chat/skills/format.ts`
- `src/chat/commands.ts`
- `src/chat/tools/registry.ts`
- `tests/ai-skills-runtime.test.js`
- `tests/skills-registry.test.js`

Copy/adapt:

- Directory discovery.
- Bundled skill metadata model.
- Skill search ranking.
- Skill tool prompt shape.
- Lazy loading.
- Context formatting.

Delete/avoid:

- Marketplace/plugin trust flows that require remote services.
- MCP plugin installation behavior unless it maps to local My-CLI skills.
- Any skill text treated as higher-priority system instruction.

## Prompt System And Query Engine

Claude Code source:

- `src/query.ts`
- `src/QueryEngine.ts`
- `src/context.ts`
- `src/tools.ts`
- `src/Tool.ts`
- `src/services/tools/toolExecution.ts`
- `src/services/tools/toolOrchestration.ts`
- `src/services/tools/StreamingToolExecutor.ts`
- `src/utils/messages.js`
- `src/tools/ExitPlanModeTool/ExitPlanModeV2Tool.ts`
- `src/tools/ExitPlanModeTool/prompt.ts`
- `src/tools/TodoWriteTool/TodoWriteTool.ts`

My-CLI targets:

- `src/chat/provider.ts`
- `src/chat/prompt.ts`
- `src/chat/session.ts`
- `src/chat/agent/loop.ts`
- `src/chat/tools.ts`
- `src/chat/tools/registry.ts`
- `src/chat/tools/runner.ts`
- `src/chat/plan-store.ts`
- `tests/ai-agent-loop.test.js`
- `tests/ai-tool-loop.test.js`
- `tests/ai-prompt.test.js`

Copy/adapt:

- Message/tool pairing discipline.
- Tool-result ordering.
- Max tool round stop.
- Plan approval tool semantics.
- Todo/plan style prompts if they remain provider-neutral.

Delete/avoid:

- Claude billing, entitlements, model router, account state, and internal API calls.
- Any data upload or usage report.

## Desktop And Release

Claude/Codex-style reference areas:

- Claude Code desktop-facing UI patterns from `src/components/DesktopHandoff.tsx` and prompt layout components.
- Existing My-CLI desktop under `desktop/**`.
- GitHub release workflow under `.github/workflows/desktop-release.yml`.

My-CLI targets:

- `desktop/src/renderer/App.tsx`
- `desktop/src/renderer/styles.css`
- `desktop/src/renderer/action-catalog.ts`
- `desktop/src/main/*.ts`
- `desktop/src/preload/index.ts`
- `.github/workflows/desktop-release.yml`
- `tests/desktop-actions.test.js`
- `tests/desktop-config.test.js`
- `tests/desktop-release-assets.test.js`

Copy/adapt:

- Desktop shell layout language.
- Session rail, conversation surface, inspector tabs, command panels.
- Release asset display.
- Safe command bridge.

Delete/avoid:

- Desktop upsell.
- OAuth handoff.
- Interactive CLI commands through IPC.
- Unbounded shell command input from renderer.
