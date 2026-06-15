# Upstream Terminal UI Import Snapshot

This directory is an uncompiled raw import snapshot from the local upstream CLI/agent source tree named in the task prompt.

Purpose:

- Preserve the requested direct file-level copy before adaptation.
- Keep reference code outside `src/` and `desktop/src/` so it is not part of the runtime or TypeScript build.
- Provide a concrete source set for migrating CLI prompt rendering, message rendering, agent/task activity, thinking state, and permission display patterns into My-CLI.

Rules for adaptation:

- Do not import files from this directory directly into runtime code.
- Remove or avoid all Anthropic account, login, telemetry, analytics, billing, quota, subscription, remote teammate, bridge, Chrome, mobile, and internal-only behavior.
- Keep My-CLI provider-neutral and OpenAI-compatible.
- Preserve UTF-8 Chinese text when adapting.
- Prefer small My-CLI-native modules over copying large dependency-heavy Ink components.
- Desktop UI fidelity is driven by the Codex desktop reference, not by the upstream terminal UI.

`FILES.txt` is the authoritative copied-file list.
