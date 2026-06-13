import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

type Mode = 'chat' | 'agent' | 'plan';
type Tab = 'plan' | 'tools' | 'diff' | 'preview' | 'settings';
type CommandCard = {
  id: string;
  title: string;
  command: string;
  description: string;
};

declare global {
  interface Window {
    zeroOneCli?: {
      runCommand: (command: string) => Promise<{ ok: boolean; output: string }>;
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

const commandCards: CommandCard[] = [
  { id: 'clear', title: 'Clean workstation', command: 'hi --clear', description: 'Run the cleanup entrypoint with the same guardrails as the CLI.' },
  { id: 'skills', title: 'Skills market', command: 'hi --skills', description: 'Open the skill installer and review available local skills.' },
  { id: 'install', title: 'Install tools', command: 'hi --install', description: 'Open the installer flow for AI CLIs, IDE helpers, and environment tools.' },
  { id: 'state', title: 'System state', command: 'hi --state', description: 'Show GitHub, project paths, commands, and app status.' },
  { id: 'api', title: 'API platforms', command: 'hi --api', description: 'Open model API platform guidance.' },
  { id: 'pay', title: 'Payment resources', command: 'hi --pay', description: 'Open payment and account resource guidance.' },
];

function App(): React.ReactElement {
  const [mode, setMode] = useState<Mode>('chat');
  const [tab, setTab] = useState<Tab>('tools');
  const [output, setOutput] = useState('Ready.');
  const modeLabel = useMemo(() => `${mode} / ${mode === 'plan' ? 'plan' : 'ask'}`, [mode]);

  async function runCommand(command: string): Promise<void> {
    if (!window.zeroOneCli) {
      setOutput('Desktop bridge is unavailable in browser preview.');
      return;
    }
    const result = await window.zeroOneCli.runCommand(command);
    setOutput(result.output || (result.ok ? 'Done.' : 'Command failed.'));
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
          {tab === 'tools' && (
            <div className="commandGrid">
              {commandCards.map((card) => (
                <button className="commandCard" key={card.id} onClick={() => runCommand(card.command)}>
                  <strong>{card.title}</strong>
                  <code>{card.command}</code>
                  <span>{card.description}</span>
                </button>
              ))}
            </div>
          )}
          {tab === 'plan' && <p>Plan mode is read-only. Use the CLI conversation to draft and review task plans.</p>}
          {tab === 'diff' && <p>Diff review is prepared for file-change summaries from future agent runs.</p>}
          {tab === 'preview' && <p>Preview panes can host local app/browser output in a later integration.</p>}
          {tab === 'settings' && (
            <div className="stack">
              <p>Use /setting in AI mode to configure URL, API key, and model IDs.</p>
              <a href="https://github.com/" target="_blank" rel="noreferrer">Open GitHub Releases</a>
            </div>
          )}
        </section>

        <pre className="output">{output}</pre>
      </aside>
    </main>
  );
}

createRoot(document.getElementById('root') as HTMLElement).render(<App />);
