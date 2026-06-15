import React from 'react';
import { ActivityStrip } from './ActivityStrip';
import { Composer } from './Composer';
import { MessageList } from './MessageList';
import type { ActivityItem, ConversationMessage, Mode } from './types';

export function ConversationView(props: {
  title: string;
  mode: Mode;
  messages: ConversationMessage[];
  activity: ActivityItem[];
  busy: boolean;
  onMode: (mode: Mode) => void;
  onSend: (text: string) => void;
}): React.ReactElement {
  return (
    <section className="conversationPane">
      <header className="conversationHeader">
        <div>
          <p>Workspace</p>
          <h1>{props.title}</h1>
        </div>
        <span className="modePill">/{props.mode}</span>
      </header>
      <ActivityStrip items={props.activity} busy={props.busy} />
      <MessageList messages={props.messages} />
      <Composer mode={props.mode} busy={props.busy} onMode={props.onMode} onSend={props.onSend} />
    </section>
  );
}
