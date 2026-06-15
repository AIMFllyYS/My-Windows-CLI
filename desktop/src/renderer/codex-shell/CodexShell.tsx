import React from 'react';
import { ConversationView } from './ConversationView';
import { InspectorPane } from './InspectorPane';
import { SessionRail } from './SessionRail';
import { useConversationState } from './useConversationState';
import { useInspectorState } from './useInspectorState';

export function CodexShell(): React.ReactElement {
  const conversation = useConversationState();
  const inspector = useInspectorState(conversation.mode);

  return (
    <main className="codexShell">
      <SessionRail
        sessions={conversation.sessions}
        activeId={conversation.activeSessionId}
        onSelect={conversation.setActiveSessionId}
        onNew={conversation.createSession}
      />
      <ConversationView
        title={conversation.title}
        mode={conversation.mode}
        messages={conversation.messages}
        activity={conversation.activity}
        busy={conversation.aiBusy}
        onMode={conversation.setMode}
        onSend={(text) => void conversation.sendMessage(text)}
      />
      <InspectorPane {...inspector} />
    </main>
  );
}
