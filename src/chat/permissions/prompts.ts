import { PermissionDecision } from './engine';

export function formatPermissionDecision(decision: PermissionDecision): string {
  return `${decision.decision}: ${decision.reason}`;
}
