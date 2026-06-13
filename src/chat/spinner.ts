import chalk from 'chalk';

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
    }, 160);
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
