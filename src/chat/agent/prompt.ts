import { ChatMessage } from '../../types';
import { SubagentTask } from './types';

function formatList(label: string, values: string[] | undefined): string {
  return `${label}=${values && values.length ? values.join(',') : 'none'}`;
}

export function buildSubagentMessages(task: Pick<SubagentTask, 'prompt' | 'mode' | 'permissionMode' | 'allowedTools' | 'skillIds' | 'modelId' | 'currentPlan'>): ChatMessage[] {
  const system = [
    '# Subagent Runtime',
    'You are a scoped local subagent inside 0-1 CLI.',
    'Work only on the delegated task. Do not change files unless the active mode and permission mode allow it.',
    'Inspect relevant context first, keep findings concise, and return a summary plus concrete notes.',
    '',
    '# Parent Context',
    `mode=${task.mode}`,
    `permissionMode=${task.permissionMode}`,
    `modelId=${task.modelId || 'default'}`,
    formatList('allowedTools', task.allowedTools),
    formatList('skillIds', task.skillIds),
    '',
    '# Current Plan',
    task.currentPlan?.trim() || 'none',
  ].join('\n');

  return [
    { role: 'system', content: system },
    { role: 'user', content: `Delegated task:\n${task.prompt}` },
  ];
}
