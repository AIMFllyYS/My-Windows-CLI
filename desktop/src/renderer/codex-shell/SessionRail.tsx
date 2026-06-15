import React from 'react';
import type { ConversationSession } from './types';

export function SessionRail(props: {
  sessions: ConversationSession[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
}): React.ReactElement {
  return (
    <aside className="sessionRail">
      <div className="railBrand">
        <span className="railGlyph">01</span>
        <div>
          <strong>0-1 CLI</strong>
          <small>AI workspace</small>
        </div>
      </div>
      <button className="newChatButton" type="button" onClick={props.onNew}>New chat</button>
      <nav className="sessionStack" aria-label="Conversations">
        {props.sessions.map((session) => (
          <button
            key={session.id}
            type="button"
            className={session.id === props.activeId ? 'sessionRow selected' : 'sessionRow'}
            onClick={() => props.onSelect(session.id)}
          >
            <span>{session.title}</span>
            <small>{session.subtitle}</small>
            <em>{session.status}</em>
          </button>
        ))}
      </nav>
      <footer className="railMeta">
        <span>Skills</span>
        <span>Provider neutral</span>
      </footer>
    </aside>
  );
}
