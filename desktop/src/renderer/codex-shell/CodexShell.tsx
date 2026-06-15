import React, { useMemo, useState } from 'react';
import { desktopActions } from '../action-catalog';
import { ConversationView } from './ConversationView';
import { InspectorPane } from './InspectorPane';
import { SessionRail } from './SessionRail';
import type {
  ActiveActionId,
  ActivityItem,
  ClearProcess,
  ConversationMessage,
  ConversationSession,
  InspectorTab,
  InstallCategory,
  InstallTarget,
  Mode,
  ReleaseAsset,
  ReleaseInfo,
  SkillPackage,
  SkillTarget,
} from './types';

const MODE_HINTS: Record<Mode, string> = {
  chat: 'read-only conversation',
  agent: 'asks before tools',
  plan: 'plan review, no edits',
};

const START_SESSIONS: ConversationSession[] = [
  { id: 'local', title: 'My-CLI workspace', subtitle: 'D:/new_project/My-CLI', status: 'active' },
  { id: 'plan', title: 'Plan review', subtitle: 'approval flow', status: 'ready' },
  { id: 'release', title: 'Desktop release', subtitle: 'assets and build', status: 'queued' },
];

const START_MESSAGES: Record<string, ConversationMessage[]> = {
  local: [
    { id: 'system-1', role: 'system', content: '0-1 CLI Desktop is now an embedded AI workspace: chat, agent, plan, skills, tools, and release controls live in one shell.', meta: 'runtime' },
    { id: 'assistant-1', role: 'assistant', content: 'Ask in the composer below. Responses render as rich markdown, while tool activity and plan state stay visible above the thread.', meta: 'ready' },
  ],
  plan: [
    { id: 'plan-1', role: 'assistant', content: 'Plan mode is read-only until you approve an implementation path.', meta: 'plan' },
  ],
  release: [
    { id: 'release-1', role: 'assistant', content: 'Release checks and downloadable assets are available in Settings.', meta: 'release' },
  ],
};

const START_ACTIVITY: ActivityItem[] = [
  { title: 'Thinking', status: 'idle', detail: 'Reasoning and status updates appear here while the agent works.' },
  { title: 'Tools', status: 'guarded', detail: 'Tool calls use the same permission-aware runtime as the CLI.' },
  { title: 'Plan', status: 'locked', detail: 'Plan approval keeps write actions explicit.' },
];

function createMessage(role: ConversationMessage['role'], content: string, meta?: string): ConversationMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content,
    meta,
  };
}

export function CodexShell(): React.ReactElement {
  const [sessions, setSessions] = useState<ConversationSession[]>(START_SESSIONS);
  const [activeSessionId, setActiveSessionId] = useState('local');
  const [messagesBySession, setMessagesBySession] = useState<Record<string, ConversationMessage[]>>(START_MESSAGES);
  const [activity, setActivity] = useState<ActivityItem[]>(START_ACTIVITY);
  const [mode, setMode] = useState<Mode>('chat');
  const [tab, setTab] = useState<InspectorTab>('tools');
  const [activeAction, setActiveAction] = useState<ActiveActionId>(null);
  const [installTargets, setInstallTargets] = useState<InstallTarget[]>([]);
  const [installCategory, setInstallCategory] = useState<InstallCategory>('cli');
  const [selectedInstallKey, setSelectedInstallKey] = useState<string | null>(null);
  const [installLatest, setInstallLatest] = useState(false);
  const [skillPackages, setSkillPackages] = useState<SkillPackage[]>([]);
  const [skillTargets, setSkillTargets] = useState<SkillTarget[]>([]);
  const [selectedSkillKey, setSelectedSkillKey] = useState<string | null>(null);
  const [selectedSkillTargets, setSelectedSkillTargets] = useState<string[]>([]);
  const [clearProcesses, setClearProcesses] = useState<ClearProcess[]>([]);
  const [selectedClearPids, setSelectedClearPids] = useState<number[]>([]);
  const [output, setOutput] = useState('Ready.');
  const [copyStatus, setCopyStatus] = useState('');
  const [commandBusy, setCommandBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [releaseStatus, setReleaseStatus] = useState('Release status not checked.');
  const [releaseInfo, setReleaseInfo] = useState<ReleaseInfo | null>(null);

  const activeSession = sessions.find((session) => session.id === activeSessionId) || sessions[0];
  const messages = messagesBySession[activeSessionId] || [];
  const title = useMemo(() => `${activeSession.title} / ${MODE_HINTS[mode]}`, [activeSession.title, mode]);

  function appendMessage(sessionId: string, message: ConversationMessage): void {
    setMessagesBySession((current) => ({
      ...current,
      [sessionId]: [...(current[sessionId] || []), message],
    }));
  }

  function createSession(): void {
    const id = `session-${Date.now()}`;
    setSessions((current) => [{ id, title: 'Untitled chat', subtitle: 'new conversation', status: 'active' }, ...current.map((item) => ({ ...item, status: item.status === 'active' ? 'ready' : item.status }))]);
    setMessagesBySession((current) => ({
      ...current,
      [id]: [createMessage('assistant', 'New conversation ready. Choose a mode and start typing.', 'ready')],
    }));
    setActiveSessionId(id);
  }

  async function sendMessage(text: string): Promise<void> {
    const userMessage = createMessage('user', text, `/${mode}`);
    appendMessage(activeSessionId, userMessage);
    setAiBusy(true);
    setActivity([{ title: 'Thinking', status: 'running', detail: 'The embedded agent is preparing a response.' }, ...START_ACTIVITY.slice(1)]);
    try {
      if (!window.zeroOneCli?.sendAiMessage) {
        appendMessage(activeSessionId, createMessage('assistant', 'Desktop bridge is unavailable in browser preview.', 'offline'));
        return;
      }
      const response = await window.zeroOneCli.sendAiMessage({
        sessionId: activeSessionId,
        mode,
        messages: [...messages, userMessage],
        text,
      });
      if (response.activity?.length) setActivity(response.activity);
      appendMessage(activeSessionId, response.message || createMessage('assistant', response.output || response.error || 'No response returned.', response.ok ? 'done' : 'error'));
    } finally {
      setAiBusy(false);
    }
  }

  async function runCommand(command: string): Promise<void> {
    if (commandBusy || !window.zeroOneCli) return;
    setCommandBusy(true);
    setCopyStatus('');
    try {
      const result = await window.zeroOneCli.runCommand(command);
      setOutput(result.output || (result.ok ? 'Done.' : 'Command failed.'));
    } finally {
      setCommandBusy(false);
    }
  }

  async function openAction(id: string): Promise<void> {
    const action = desktopActions.find((item) => item.id === id);
    if (!action) return;
    setActiveAction(action.id);
    if (!window.zeroOneCli) {
      setOutput('Desktop bridge is unavailable in browser preview.');
      return;
    }
    if (action.kind === 'cli-command') {
      await runCommand(action.command);
      return;
    }
    if (action.kind === 'native-clear') {
      const scan = await window.zeroOneCli.scanClearProcesses();
      setClearProcesses(scan.processes);
      setSelectedClearPids([]);
      setOutput(scan.output || (scan.ok ? 'Process scan completed.' : 'Process scan failed.'));
      return;
    }
    if (action.kind === 'native-skills') {
      const catalog = await window.zeroOneCli.listSkillPackages();
      setSkillPackages(catalog.packages);
      setSkillTargets(catalog.targets);
      setSelectedSkillKey(catalog.packages[0]?.key || null);
      setSelectedSkillTargets(catalog.targets.filter((item) => item.detected).map((item) => item.key).slice(0, 2));
      setOutput('Choose a skill package and targets, then confirm installation.');
      return;
    }
    const targets = await window.zeroOneCli.listInstallTargets();
    setInstallTargets(targets);
    setSelectedInstallKey(targets.find((item) => item.category === installCategory)?.key || null);
    setOutput('Choose an install target, then confirm from the desktop panel.');
  }

  async function refreshClearProcesses(): Promise<void> {
    if (!window.zeroOneCli) return;
    const scan = await window.zeroOneCli.scanClearProcesses();
    setClearProcesses(scan.processes);
    setSelectedClearPids((current) => current.filter((pid) => scan.processes.some((item) => item.pid === pid)));
    setOutput(scan.output || (scan.ok ? 'Process scan completed.' : 'Process scan failed.'));
  }

  function copyOutput(): void {
    void navigator.clipboard.writeText(output);
    setCopyStatus('Copied to clipboard.');
  }

  return (
    <main className="codexShell">
      <SessionRail sessions={sessions} activeId={activeSessionId} onSelect={setActiveSessionId} onNew={createSession} />
      <ConversationView title={title} mode={mode} messages={messages} activity={activity} busy={aiBusy} onMode={setMode} onSend={(text) => void sendMessage(text)} />
      <InspectorPane
        tab={tab}
        activeAction={activeAction}
        output={output}
        copyStatus={copyStatus}
        commandBusy={commandBusy}
        mode={mode}
        releaseStatus={releaseStatus}
        releaseInfo={releaseInfo}
        installTargets={installTargets}
        installCategory={installCategory}
        selectedInstallKey={selectedInstallKey}
        installLatest={installLatest}
        skillPackages={skillPackages}
        skillTargets={skillTargets}
        selectedSkillKey={selectedSkillKey}
        selectedSkillTargets={selectedSkillTargets}
        clearProcesses={clearProcesses}
        selectedClearPids={selectedClearPids}
        onTab={setTab}
        onOpenAction={(id) => void openAction(id)}
        onCopy={copyOutput}
        onBack={() => setActiveAction(null)}
        onInstallCategory={(category) => {
          setInstallCategory(category);
          setSelectedInstallKey(installTargets.find((item) => item.category === category)?.key || null);
        }}
        onSelectInstall={setSelectedInstallKey}
        onInstallLatest={setInstallLatest}
        onRunInstall={() => {
          if (!window.zeroOneCli || !selectedInstallKey) return;
          void window.zeroOneCli.runInstallTarget({ key: selectedInstallKey, latest: installLatest, confirm: true }).then((result) => setOutput(result.output));
        }}
        onSelectSkill={setSelectedSkillKey}
        onToggleSkillTarget={(key) => setSelectedSkillTargets((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key])}
        onRunSkillInstall={() => {
          if (!window.zeroOneCli || !selectedSkillKey) return;
          void window.zeroOneCli.installSkillPackage({ skillKey: selectedSkillKey, targetKeys: selectedSkillTargets, confirm: true }).then((result) => setOutput(result.output));
        }}
        onRefreshClear={() => void refreshClearProcesses()}
        onToggleClearPid={(pid) => setSelectedClearPids((current) => current.includes(pid) ? current.filter((item) => item !== pid) : [...current, pid])}
        onKillClear={() => {
          if (!window.zeroOneCli) return;
          void window.zeroOneCli.killClearProcesses({ pids: selectedClearPids, confirm: true }).then((result) => {
            setOutput(result.output);
            void refreshClearProcesses();
          });
        }}
        onLaunchAi={() => {
          if (!window.zeroOneCli) return;
          void window.zeroOneCli.launchAiSession({ mode }).then((result) => setOutput(result.output));
        }}
        onCheckRelease={() => {
          if (!window.zeroOneCli) return;
          void window.zeroOneCli.getLatestRelease().then((release) => {
            setReleaseInfo(release);
            setReleaseStatus(release.ok ? `${release.tagName || release.name || 'Latest release'} - ${(release.assets || []).length} assets` : (release.error || 'Unable to read latest release.'));
          });
        }}
        onOpenRelease={() => {
          if (!window.zeroOneCli) return;
          void window.zeroOneCli.openLatestRelease().then((result) => setReleaseStatus(result.ok ? `Opened ${result.url}` : (result.error || 'Unable to open release page.')));
        }}
        onOpenAsset={(asset: ReleaseAsset) => {
          if (!window.zeroOneCli) return;
          void window.zeroOneCli.openReleaseAsset(asset.browserDownloadUrl).then((result) => setReleaseStatus(result.ok ? `Opened ${asset.name}` : (result.error || 'Unable to open release asset.')));
        }}
      />
    </main>
  );
}
