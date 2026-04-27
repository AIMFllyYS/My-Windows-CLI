import chalk from 'chalk';

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

  /** Feed a token from the stream */
  push(token: string): void {
    this.fullText += token;
    this.buffer += token;
    this.processBuffer();
  }

  /** Finalize and flush remaining content */
  finish(): string {
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

  /** Stream partial text inline (no newline yet) */
  private streamInline(text: string): void {
    if (!text) return;
    if (this.firstToken) {
      this.firstToken = false;
      console.log(chalk.bold.green('\n  AI'));
      printDivider();
    }
    if (this.inCodeBlock) {
      // Inside code block, stream green
      if (!this.lineBuffer) process.stdout.write(chalk.gray('  │ '));
      process.stdout.write(chalk.green(text));
    } else {
      // Normal text — stream with inline rendering
      if (!this.lineBuffer) process.stdout.write('  ');
      process.stdout.write(text);
    }
  }

  /** Handle a complete line */
  private handleCompleteLine(line: string): void {
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

// === Spinner Animation ===

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export class Spinner {
  private interval: NodeJS.Timeout | null = null;
  private frame = 0;
  private text: string;

  constructor(text: string = '思考中') {
    this.text = text;
  }

  start(): void {
    this.frame = 0;
    process.stdout.write('\n');
    this.interval = setInterval(() => {
      const f = SPINNER_FRAMES[this.frame % SPINNER_FRAMES.length];
      process.stdout.write(`\r${chalk.cyan(f)} ${chalk.gray(this.text + '...')}`);
      this.frame++;
    }, 80);
  }

  /** Update spinner text while running */
  setText(text: string): void {
    this.text = text;
  }

  /** Check if spinner is currently running */
  isRunning(): boolean {
    return this.interval !== null;
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      process.stdout.write('\r\x1B[K'); // clear line
    }
  }
}

// === Terminal Markdown Renderer ===

/**
 * Render markdown text to terminal with colors.
 * Handles: headers, bold, italic, inline code, code blocks, lists, links, blockquotes, tables, hr.
 */
export function renderMarkdown(text: string): string {
  const lines = text.split('\n');
  const out: string[] = [];
  let inCodeBlock = false;
  let codeLang = '';

  for (const line of lines) {
    // Code block toggle
    if (line.trimStart().startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLang = line.trimStart().slice(3).trim();
        const label = codeLang ? chalk.gray(` ${codeLang} `) : '';
        out.push(chalk.gray('  ┌──') + label + chalk.gray('─'.repeat(Math.max(0, 50 - (codeLang.length + 4)))));
      } else {
        inCodeBlock = false;
        codeLang = '';
        out.push(chalk.gray('  └' + '─'.repeat(52)));
      }
      continue;
    }

    if (inCodeBlock) {
      out.push(chalk.gray('  │ ') + chalk.green(line));
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim()) || /^\*\*\*+$/.test(line.trim())) {
      out.push(chalk.gray('  ' + '─'.repeat(56)));
      continue;
    }

    // Headers
    const h3 = line.match(/^### (.+)/);
    if (h3) { out.push(chalk.bold.yellow('   ' + h3[1])); continue; }
    const h2 = line.match(/^## (.+)/);
    if (h2) { out.push(chalk.bold.magenta('  ' + h2[1])); continue; }
    const h1 = line.match(/^# (.+)/);
    if (h1) { out.push(chalk.bold.cyan(' ' + h1[1])); continue; }

    // Blockquote
    if (line.trimStart().startsWith('> ')) {
      out.push(chalk.gray('  │ ') + chalk.italic(renderInline(line.trimStart().slice(2))));
      continue;
    }

    // Table row (simple: | col | col |)
    if (/^\|(.+)\|$/.test(line.trim())) {
      // Table separator row
      if (/^\|[\s\-:|]+\|$/.test(line.trim())) {
        out.push(chalk.gray('  ├' + '─'.repeat(56)));
        continue;
      }
      const cells = line.trim().slice(1, -1).split('|').map(c => c.trim());
      const row = cells.map(c => chalk.white(renderInline(c))).join(chalk.gray(' │ '));
      out.push(chalk.gray('  │ ') + row);
      continue;
    }

    // List items
    const bullet = line.match(/^(\s*)([-*]) (.+)/);
    if (bullet) {
      const indent = bullet[1];
      const content = renderInline(bullet[3]);
      out.push(indent + chalk.cyan('  • ') + content);
      continue;
    }

    // Numbered list
    const numbered = line.match(/^(\s*)(\d+)\. (.+)/);
    if (numbered) {
      const indent = numbered[1];
      const num = numbered[2];
      const content = renderInline(numbered[3]);
      out.push(indent + chalk.cyan(`  ${num}. `) + content);
      continue;
    }

    // Empty line
    if (!line.trim()) {
      out.push('');
      continue;
    }

    // Regular line with inline formatting
    out.push('  ' + renderInline(line));
  }

  return out.join('\n');
}

/** Render inline markdown: bold, italic, code, links, strikethrough */
function renderInline(text: string): string {
  return text
    // Bold
    .replace(/\*\*(.+?)\*\*/g, (_, t) => chalk.bold.white(t))
    // Italic
    .replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, (_, t) => chalk.italic(t))
    // Strikethrough
    .replace(/~~(.+?)~~/g, (_, t) => chalk.strikethrough.gray(t))
    // Inline code
    .replace(/`([^`]+)`/g, (_, t) => chalk.bgGray.white(` ${t} `))
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => chalk.blue.underline(label) + chalk.gray(` (${url})`))
    // Emoji shortcodes pass through (already unicode)
    ;
}

// === Box Drawing ===

export function drawBox(title: string, subtitle?: string): string {
  const w = 60;
  const lines: string[] = [];
  lines.push(chalk.cyan('╔' + '═'.repeat(w) + '╗'));
  const pad = Math.max(0, Math.floor((w - title.length) / 2));
  lines.push(chalk.cyan('║') + ' '.repeat(pad) + chalk.bold.white(title) + ' '.repeat(w - pad - title.length) + chalk.cyan('║'));
  if (subtitle) {
    const sp = Math.max(0, Math.floor((w - subtitle.length) / 2));
    lines.push(chalk.cyan('║') + ' '.repeat(sp) + chalk.gray(subtitle) + ' '.repeat(w - sp - subtitle.length) + chalk.cyan('║'));
  }
  lines.push(chalk.cyan('╚' + '═'.repeat(w) + '╝'));
  return lines.join('\n');
}

// === Status Messages ===

export function printSuccess(msg: string): void {
  console.log(chalk.green('  ✓ ') + msg);
}

export function printError(msg: string): void {
  console.log(chalk.red('  ✗ ') + msg);
}

export function printInfo(msg: string): void {
  console.log(chalk.blue('  ℹ ') + msg);
}

export function printWarning(msg: string): void {
  console.log(chalk.yellow('  ⚠ ') + msg);
}

export function printDivider(): void {
  console.log(chalk.gray('  ' + '─'.repeat(56)));
}
