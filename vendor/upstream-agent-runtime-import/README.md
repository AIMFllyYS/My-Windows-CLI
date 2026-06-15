# Upstream Agent Runtime Import Snapshot

This directory is an uncompiled raw import snapshot from the local upstream CLI/agent source tree named in the task prompt.

Purpose:

- Preserve the requested direct file-level copy before adaptation.
- Capture the upstream CLI query loop, tool contracts, permissions, task/subagent runtime, file tools, shell tools, plan review, todo, skill, and message-processing mechanics.
- Keep all copied code outside `src/` and `desktop/src/` so it is not part of the runtime or TypeScript build.

Adaptation boundary:

- These files are reference material only. Do not import from this directory in production code.
- Runtime work must copy only the useful mechanism into My-CLI-native modules, then strip or rewrite incompatible dependencies.
- Any account, login/logout, OAuth, telemetry, analytics, Statsig/GrowthBook, billing, quota, subscription, entitlement, remote bridge, Chrome bridge, mobile bridge, cloud teammate, and internal-only behavior is forbidden in My-CLI runtime.
- Provider integration must stay OpenAI-compatible and provider-neutral.
- Desktop UI is not sourced from this directory; the desktop shell should be rebuilt against the Codex desktop visual target and My-CLI's Electron/React stack.
- Preserve UTF-8 Chinese text when adapting.

`FILES.txt` is the authoritative copied-file list.
