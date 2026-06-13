import { PermissionDecision } from './engine';
import { renderPermissionBox } from '../ui/layout';

export function formatPermissionDecision(decision: PermissionDecision, tool = 'tool'): string {
  return renderPermissionBox({ tool, action: decision.decision, reason: decision.reason });
}
