import React from 'react';
import type { ActivityItem } from './types';

export function ActivityStrip(props: { items: ActivityItem[]; busy: boolean }): React.ReactElement {
  return (
    <section className="activityStrip" aria-label="AI activity">
      <div className={props.busy ? 'thinkingDot active' : 'thinkingDot'} />
      {props.items.map((item) => (
        <article className="activityChip" key={`${item.title}-${item.status}`}>
          <strong>{item.title}</strong>
          <span>{item.status}</span>
          <p>{item.detail}</p>
        </article>
      ))}
    </section>
  );
}
