import React, { useState } from 'react';
import type { Mode } from './types';

const MODE_LABELS: Record<Mode, string> = {
  chat: 'Chat',
  agent: 'Agent',
  plan: 'Plan',
};

export function Composer(props: {
  mode: Mode;
  busy: boolean;
  onMode: (mode: Mode) => void;
  onSend: (text: string) => void;
}): React.ReactElement {
  const [text, setText] = useState('');

  function submit(): void {
    const value = text.trim();
    if (!value || props.busy) return;
    setText('');
    props.onSend(value);
  }

  return (
    <footer className="composerBar">
      <div className="composerToolbar">
        <div className="modeTabs" aria-label="AI mode">
          {(['chat', 'agent', 'plan'] as Mode[]).map((mode) => (
            <button key={mode} type="button" className={props.mode === mode ? 'selected' : ''} onClick={() => props.onMode(mode)}>
              {MODE_LABELS[mode]}
            </button>
          ))}
        </div>
        <button className="toolButton" type="button">Skills</button>
      </div>
      <div className="composerInputWrap">
        <textarea
          className="composerTextarea"
          rows={3}
          value={text}
          placeholder="Ask 0-1 CLI to inspect, plan, edit, or explain..."
          onChange={(event) => setText(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
        />
        <button className="sendButton" type="button" disabled={props.busy || !text.trim()} onClick={submit}>
          {props.busy ? 'Thinking' : 'Send'}
        </button>
      </div>
    </footer>
  );
}
