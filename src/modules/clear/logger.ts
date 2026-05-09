import * as fs from 'fs';
import * as path from 'path';

const LOG_DIR = 'C:/project/coding-cli/scripts/logs';

function ensureDir(): void {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function filename(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `clear-a-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.log`;
}

export interface AiRecommendation {
  pid: number;
  name: string;
  reason: string;
  safeToKill: boolean;
}

export interface KillResult {
  pid: number;
  name: string;
  success: boolean;
  error?: string;
}

export class ClearLogger {
  private lines: string[] = [];
  private aiRaw?: string;

  constructor() {
    ensureDir();
    this.lines.push(`=== Clear-A Run: ${timestamp()} ===\n`);
  }

  scan(allCount: number, filteredCount: number): void {
    this.lines.push(`[SCAN] 共发现 ${allCount} 个进程，本地排除后剩余 ${filteredCount} 个进入 AI 判断\n`);
  }

  aiResponse(raw: string, recommendations: AiRecommendation[]): void {
    this.aiRaw = raw;
    this.lines.push(`[AI] 原始回复:\n${raw}\n`);
    this.lines.push(`[AI] 推荐终止 (${recommendations.length} 个):`);
    for (const r of recommendations) {
      this.lines.push(`  - ${r.name} (PID ${r.pid}): ${r.reason}`);
    }
    this.lines.push('');
  }

  userConfirm(selected: AiRecommendation[]): void {
    this.lines.push(`[USER] 确认终止 (${selected.length} 个):`);
    for (const s of selected) {
      this.lines.push(`  - ${s.name} (PID ${s.pid})`);
    }
    this.lines.push('');
  }

  killResults(results: KillResult[]): void {
    this.lines.push(`[KILL] 终止结果:`);
    for (const r of results) {
      if (r.success) {
        this.lines.push(`  ✓ ${r.name} (PID ${r.pid})`);
      } else {
        this.lines.push(`  ✗ ${r.name} (PID ${r.pid}) - ${r.error || '失败'}`);
      }
    }
    this.lines.push('');
  }

  save(): void {
    const content = this.lines.join('\n') + '\n';
    const fp = path.join(LOG_DIR, filename());
    fs.writeFileSync(fp, content, 'utf-8');
  }

  getLogPath(): string {
    return path.join(LOG_DIR, filename());
  }

  getAiRaw(): string | undefined {
    return this.aiRaw;
  }
}
