import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { desktopActions, DesktopAction } from './action-catalog';
import './styles.css';

type Mode = 'chat' | 'agent' | 'plan';
type Tab = 'plan' | 'tools' | 'diff' | 'preview' | 'settings';
type InstallCategory = 'cli' | 'ide' | 'environment';
type InstallTarget = {
  key: string;
  displayName: string;
  category: InstallCategory;
  description: string;
  sourceUrl: string;
  opensUrlOnly?: boolean;
};

declare global {
  interface Window {
    zeroOneCli?: {
      runCommand: (command: string) => Promise<{ ok: boolean; output: string }>;
      getLatestRelease: () => Promise<{ ok: boolean; tagName?: string; name?: string; htmlUrl?: string; publishedAt?: string; assets?: { name: string; browserDownloadUrl: string; size: number }[]; error?: string }>;
      openLatestRelease: () => Promise<{ ok: boolean; url: string; error?: string }>;
      listInstallTargets: () => Promise<InstallTarget[]>;
      runInstallTarget: (request: { key: string; latest?: boolean; confirm?: boolean }) => Promise<{ ok: boolean; output: string; requiresConfirmation?: boolean }>;
    };
  }
}

const sessions = [
  { id: 'local', name: 'My-CLI', status: 'active' },
  { id: 'plan', name: 'Plan Review', status: 'ready' },
  { id: 'release', name: 'Desktop Release', status: 'queued' },
];

const transcript = [
  { role: 'system', text: '0-1 CLI Desktop mirrors the AI runtime: chat, agent, plan, settings, models, skills, and local subagents.' },
  { role: 'assistant', text: 'Choose a mode, review tools, then run focused CLI actions from the right pane.' },
];

function App(): React.ReactElement {
  const [mode, setMode] = useState<Mode>('chat');
  const [tab, setTab] = useState<Tab>('tools');
  const [activeAction, setActiveAction] = useState<DesktopAction['id'] | null>(null);
  const [installTargets, setInstallTargets] = useState<InstallTarget[]>([]);
  const [installCategory, setInstallCategory] = useState<InstallCategory>('cli');
  const [selectedInstallKey, setSelectedInstallKey] = useState<string | null>(null);
  const [installLatest, setInstallLatest] = useState(false);
  const [output, setOutput] = useState('Ready.');
  const [releaseStatus, setReleaseStatus] = useState('Release status not checked.');
  const modeLabel = useMemo(() => `${mode} / ${mode === 'plan' ? 'plan' : 'ask'}`, [mode]);

  async function runCommand(command: string): Promise<void> {
    if (!window.zeroOneCli) {
      setOutput('Desktop bridge is unavailable in browser preview.');
      return;
    }
    const result = await window.zeroOneCli.runCommand(command);
    setOutput(result.output || (result.ok ? 'Done.' : 'Command failed.'));
  }

  async function openAction(action: DesktopAction): Promise<void> {
    setActiveAction(action.id);
    if (action.kind !== 'native-install') {
      await runCommand(action.command);
      return;
    }
    if (!window.zeroOneCli) {
      setOutput('Desktop bridge is unavailable in browser preview.');
      return;
    }
    const targets = await window.zeroOneCli.listInstallTargets();
    setInstallTargets(targets);
    setSelectedInstallKey(targets.find((item) => item.category === installCategory)?.key || null);
    setOutput('Choose an install target, then confirm from the desktop panel.');
  }

  async function runSelectedInstall(): Promise<void> {
    if (!window.zeroOneCli || !selectedInstallKey) {
      setOutput('Select an install target first.');
      return;
    }
    const result = await window.zeroOneCli.runInstallTarget({
      key: selectedInstallKey,
      latest: installLatest,
      confirm: true,
    });
    setOutput(result.output || (result.ok ? 'Install action started.' : 'Install action failed.'));
  }

  async function checkLatestRelease(): Promise<void> {
    if (!window.zeroOneCli) {
      setReleaseStatus('Desktop bridge is unavailable in browser preview.');
      return;
    }
    const release = await window.zeroOneCli.getLatestRelease();
    if (!release.ok) {
      setReleaseStatus(release.error || 'Unable to read latest release.');
      return;
    }
    const assetText = release.assets?.length ? `${release.assets.length} assets` : 'no assets';
    setReleaseStatus(`${release.tagName || release.name || 'Latest release'} - ${assetText}`);
  }

  async function openLatestRelease(): Promise<void> {
    if (!window.zeroOneCli) {
      setReleaseStatus('Desktop bridge is unavailable in browser preview.');
      return;
    }
    const result = await window.zeroOneCli.openLatestRelease();
    setReleaseStatus(result.ok ? `Opened ${result.url}` : (result.error || 'Unable to open release page.'));
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brandMark">01</span>
          <div>
            <strong>0-1 CLI</strong>
            <small>Desktop</small>
          </div>
        </div>
        <section className="sessionList">
          {sessions.map((session) => (
            <button className="session" key={session.id}>
              <span>{session.name}</span>
              <em>{session.status}</em>
            </button>
          ))}
        </section>
      </aside>

      <section className="conversation">
        <header className="topbar">
          <div>
            <p>Workspace</p>
            <h1>My-CLI AI Runtime</h1>
          </div>
          <div className="modeSwitch" aria-label="Mode">
            {(['chat', 'agent', 'plan'] as Mode[]).map((item) => (
              <button key={item} className={mode === item ? 'selected' : ''} onClick={() => setMode(item)}>
                {item}
              </button>
            ))}
          </div>
        </header>

        <div className="thread">
          {transcript.map((item, index) => (
            <article className={`bubble ${item.role}`} key={index}>
              <span>{item.role}</span>
              <p>{item.text}</p>
            </article>
          ))}
          <article className="bubble assistant highlight">
            <span>status</span>
            <p>Mode {modeLabel}. Skills context and subagent queue are available from the CLI-backed panels.</p>
          </article>
        </div>

        <footer className="composer">
          <input value={`/${mode}`} readOnly aria-label="Prompt" />
          <button onClick={() => runCommand('help')}>Run</button>
        </footer>
      </section>

      <aside className="inspector">
        <nav className="tabs">
          {(['plan', 'tools', 'diff', 'preview', 'settings'] as Tab[]).map((item) => (
            <button key={item} className={tab === item ? 'selected' : ''} onClick={() => setTab(item)}>
              {item}
            </button>
          ))}
        </nav>

        <section className="panel">
          {tab === 'tools' && activeAction !== 'install' && (
            <div className="commandGrid">
              {desktopActions.map((card) => (
                <button className="commandCard" key={card.id} onClick={() => void openAction(card)}>
                  <strong>{card.title}</strong>
                  <code>{card.command}</code>
                  <span>{card.description}</span>
                </button>
              ))}
            </div>
          )}
          {tab === 'tools' && activeAction === 'install' && (
            <InstallPanel
              category={installCategory}
              targets={installTargets}
              selectedKey={selectedInstallKey}
              latest={installLatest}
              onBack={() => setActiveAction(null)}
              onCategory={(category) => {
                setInstallCategory(category);
                setSelectedInstallKey(installTargets.find((item) => item.category === category)?.key || null);
              }}
              onSelect={setSelectedInstallKey}
              onLatest={setInstallLatest}
              onInstall={runSelectedInstall}
            />
          )}
          {tab === 'plan' && <p>Plan mode is read-only. Use the CLI conversation to draft and review task plans.</p>}
          {tab === 'diff' && <p>Diff review is prepared for file-change summaries from future agent runs.</p>}
          {tab === 'preview' && <p>Preview panes can host local app/browser output in a later integration.</p>}
          {tab === 'settings' && (
            <div className="stack">
              <p>Use /setting in AI mode to configure URL, API key, and model IDs.</p>
              <button onClick={checkLatestRelease}>Check latest release</button>
              <button onClick={openLatestRelease}>Open release page</button>
              <span className="releaseStatus">{releaseStatus}</span>
            </div>
          )}
        </section>

        <pre className="output">{output}</pre>
      </aside>
    </main>
  );
}

function InstallPanel(props: {
  category: InstallCategory;
  targets: InstallTarget[];
  selectedKey: string | null;
  latest: boolean;
  onBack: () => void;
  onCategory: (category: InstallCategory) => void;
  onSelect: (key: string) => void;
  onLatest: (latest: boolean) => void;
  onInstall: () => void;
}): React.ReactElement {
  const visibleTargets = props.targets.filter((item) => item.category === props.category);
  const selected = visibleTargets.find((item) => item.key === props.selectedKey) || visibleTargets[0];

  return (
    <div className="installPanel">
      <div className="panelHeader">
        <div>
          <p>native desktop action</p>
          <h2>Install tools</h2>
        </div>
        <button onClick={props.onBack}>Back</button>
      </div>
      <div className="categorySwitch" aria-label="Install category">
        {(['cli', 'ide', 'environment'] as InstallCategory[]).map((category) => (
          <button key={category} className={props.category === category ? 'selected' : ''} onClick={() => props.onCategory(category)}>
            {category}
          </button>
        ))}
      </div>
      <div className="installTargets">
        {visibleTargets.map((target) => (
          <button key={target.key} className={props.selectedKey === target.key ? 'installTarget selectedTarget' : 'installTarget'} onClick={() => props.onSelect(target.key)}>
            <strong>{target.displayName}</strong>
            <span>{target.description}</span>
          </button>
        ))}
      </div>
      <label className="checkRow">
        <input type="checkbox" checked={props.latest} onChange={(event) => props.onLatest(event.currentTarget.checked)} />
        <span>Use latest/update path when the target supports it</span>
      </label>
      <div className="confirmStrip">
        <span>{selected ? selected.sourceUrl : 'No targets in this category.'}</span>
        <button disabled={!selected} onClick={() => void props.onInstall()}>
          Confirm install
        </button>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root') as HTMLElement).render(<App />);
