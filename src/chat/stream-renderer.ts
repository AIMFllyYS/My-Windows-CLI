import chalk from 'chalk';
import { renderInline } from './markdown';
import { printDivider } from './terminal-ui';

// === Stream Renderer (XML tag-based incremental output) ===

type TagType = 'thinking' | 'code' | 'text';

interface TagStyle {
  prefix: string;
  render: (text: string) => string;
  linePrefix: string;
}

const TAG_STYLES: Record<TagType, TagStyle> = {
  thinking: {
    prefix: chalk.gray('\n  💭 思考中...\n'),
    render: (t) => chalk.gray(t),
    linePrefix: chalk.gray('  '),
  },
  code: {
    prefix: '',
    render: (t) => chalk.green(t),
    linePrefix: chalk.gray('  │ '),
  },
  text: {
    prefix: '',
    render: (t) => t,
    linePrefix: '  ',
  },
};

/**
 * Streaming renderer that outputs tokens in real-time.
 * Handles XML tags: <thinking>, <code lang="x">, and plain text.
 * Falls back to direct streaming when AI doesn't use XML tags.
 */
export class StreamRenderer {
  private buffer = '';
  private currentTag: TagType = 'text';
  private tagStarted = false;
  private headerPrinted = false;
  private lineBuffer = '';
  private inCodeBlock = false;
  private codeLang = '';
  private fullText = '';
  private firstToken = true;
  private inlinePending = '';
  private flushTimer: NodeJS.Timeout | null = null;
  private static readonly FLUSH_INTERVAL = 16; // ms
  private static readonly FLUSH_THRESHOLD = 64; // chars

  /** Feed a token from the stream */
  push(token: string): void {
    this.fullText += token;
    this.buffer += token;
    this.processBuffer();
  }

  /** Finalize and flush remaining content */
  finish(): string {
    this.flushInline();
    // Flush any remaining line buffer
    if (this.lineBuffer) {
      this.flushLine(this.lineBuffer);
      this.lineBuffer = '';
    }
    // Close code block if still open
    if (this.inCodeBlock) {
      console.log(chalk.gray('  └' + '─'.repeat(52)));
      this.inCodeBlock = false;
    }
    return this.fullText;
  }

  private processBuffer(): void {
    // Process character by character for line-based streaming
    while (this.buffer.length > 0) {
      const nlIdx = this.buffer.indexOf('\n');
      if (nlIdx === -1) {
        // No newline yet — accumulate and stream inline
        this.streamInline(this.buffer);
        this.lineBuffer += this.buffer;
        this.buffer = '';
      } else {
        // Complete line found
        const line = this.lineBuffer + this.buffer.slice(0, nlIdx);
        this.buffer = this.buffer.slice(nlIdx + 1);
        this.lineBuffer = '';
        this.handleCompleteLine(line);
      }
    }
  }

  /** Stream partial text inline (no newline yet) — buffered to reduce I/O */
  private streamInline(text: string): void {
    if (!text) return;
    if (this.firstToken) {
      this.firstToken = false;
      this.inlinePending += chalk.bold.green('\n  AI') + '\n' + chalk.gray('  ' + '─'.repeat(56)) + '\n';
    }
    if (this.inCodeBlock) {
      if (!this.lineBuffer) this.inlinePending += chalk.gray('  │ ');
      this.inlinePending += chalk.green(text);
    } else {
      if (!this.lineBuffer) this.inlinePending += '  ';
      this.inlinePending += text;
    }
    if (this.inlinePending.length >= StreamRenderer.FLUSH_THRESHOLD) {
      this.flushInline();
    } else {
      this.scheduleFlush();
    }
  }

  private scheduleFlush(): void {
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => this.flushInline(), StreamRenderer.FLUSH_INTERVAL);
  }

  private flushInline(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    if (this.inlinePending) {
      process.stdout.write(this.inlinePending);
      this.inlinePending = '';
    }
  }

  /** Handle a complete line */
  private handleCompleteLine(line: string): void {
    this.flushInline();
    if (this.firstToken) {
      this.firstToken = false;
      console.log(chalk.bold.green('\n  AI'));
      printDivider();
    }

    // Clear the inline-streamed content (we'll reprint the full line formatted)
    if (line) {
      // Move cursor to start of current line and clear it
      process.stdout.write('\r\x1B[K');
    }

    this.flushLine(line);
  }

  /** Render and print a complete line */
  private flushLine(line: string): void {
    // Code block toggle
    if (line.trimStart().startsWith('```')) {
      if (!this.inCodeBlock) {
        this.inCodeBlock = true;
        this.codeLang = line.trimStart().slice(3).trim();
        const label = this.codeLang ? chalk.gray(` ${this.codeLang} `) : '';
        console.log(chalk.gray('  ┌──') + label + chalk.gray('─'.repeat(Math.max(0, 50 - (this.codeLang.length + 4)))));
      } else {
        this.inCodeBlock = false;
        this.codeLang = '';
        console.log(chalk.gray('  └' + '─'.repeat(52)));
      }
      return;
    }

    if (this.inCodeBlock) {
      console.log(chalk.gray('  │ ') + chalk.green(line));
      return;
    }

    // Headers
    const h3 = line.match(/^### (.+)/);
    if (h3) { console.log(chalk.bold.yellow('   ' + h3[1])); return; }
    const h2 = line.match(/^## (.+)/);
    if (h2) { console.log(chalk.bold.magenta('  ' + h2[1])); return; }
    const h1 = line.match(/^# (.+)/);
    if (h1) { console.log(chalk.bold.cyan(' ' + h1[1])); return; }

    // HR
    if (/^---+$/.test(line.trim()) || /^\*\*\*+$/.test(line.trim())) {
      console.log(chalk.gray('  ' + '─'.repeat(56)));
      return;
    }

    // Blockquote
    if (line.trimStart().startsWith('> ')) {
      console.log(chalk.gray('  │ ') + chalk.italic(renderInline(line.trimStart().slice(2))));
      return;
    }

    // Bullet list
    const bullet = line.match(/^(\s*)([-*]) (.+)/);
    if (bullet) {
      console.log(bullet[1] + chalk.cyan('  • ') + renderInline(bullet[3]));
      return;
    }

    // Numbered list
    const numbered = line.match(/^(\s*)(\d+)\. (.+)/);
    if (numbered) {
      console.log(numbered[1] + chalk.cyan(`  ${numbered[2]}. `) + renderInline(numbered[3]));
      return;
    }

    // Empty line
    if (!line.trim()) { console.log(''); return; }

    // Regular text
    console.log('  ' + renderInline(line));
  }
}
