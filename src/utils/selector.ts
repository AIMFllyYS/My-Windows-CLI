import * as readline from 'readline';
import chalk from 'chalk';

export interface SelectorOption {
  label: string;
  value: string;
  description?: string;
}

export interface SelectorConfig {
  title: string;
  options: SelectorOption[];
  onSelect: (value: string) => void | Promise<void>;
  onCancel?: () => void;
}

export async function interactiveSelect(config: SelectorConfig): Promise<void> {
  const { title, options, onSelect, onCancel } = config;

  if (options.length === 0) {
    console.log(chalk.yellow('No options available'));
    return;
  }

  let selectedIndex = 0;

  // Clear line and move cursor home
  const clearLine = () => {
    process.stdout.write('\r\x1B[K');
  };

  const moveCursorUp = (lines: number) => {
    process.stdout.write(`\x1B[${lines}A`);
  };

  const moveCursorDown = (lines: number) => {
    process.stdout.write(`\x1B[${lines}B`);
  };

  // Render the selector
  const render = () => {
    clearLine();
    console.log(chalk.bold.cyan(title));
    console.log(chalk.gray('(Use ↑/↓ or j/k to navigate, Enter to select, Esc/q to cancel)\n'));

    options.forEach((option, index) => {
      const isSelected = index === selectedIndex;
      const prefix = isSelected ? chalk.green('▶ ') : '  ';
      const label = isSelected ? chalk.bold.white(option.label) : chalk.white(option.label);
      const desc = option.description ? chalk.gray(` - ${option.description}`) : '';

      console.log(`${prefix}${label}${desc}`);
    });

    // Move cursor back to selection position
    moveCursorUp(options.length + 2);
  };

  // Set raw mode for keyboard input
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // @ts-ignore - using internal Node.js method
  const isRaw = process.stdin.isRaw;

  return new Promise<void>((resolve) => {
    // Enable raw mode
    process.stdin.setRawMode?.(true);
    process.stdin.resume?.();
    process.stdin.setEncoding?.('utf8');

    render();

    const handleKeypress = (char: string, key: { name: string; ctrl: boolean }) => {
      // Handle Ctrl+C
      if (key.ctrl && char === 'c') {
        cleanup();
        process.exit(0);
      }

      // Handle Escape or q to cancel
      if (key.name === 'escape' || (key.name === 'q' && !key.ctrl)) {
        cleanup();
        if (onCancel) onCancel();
        resolve();
        return;
      }

      // Handle Enter to select
      if (key.name === 'return' || key.name === 'enter') {
        cleanup();
        const selected = options[selectedIndex];
        if (selected) {
          clearLine();
          onSelect(selected.value);
        }
        resolve();
        return;
      }

      // Handle navigation
      let moved = false;
      if (key.name === 'up' || key.name === 'k') {
        selectedIndex = selectedIndex > 0 ? selectedIndex - 1 : options.length - 1;
        moved = true;
      } else if (key.name === 'down' || key.name === 'j') {
        selectedIndex = selectedIndex < options.length - 1 ? selectedIndex + 1 : 0;
        moved = true;
      } else if (key.name === 'home' || (key.name === 'a' && key.ctrl)) {
        selectedIndex = 0;
        moved = true;
      } else if (key.name === 'end' || (key.name === 'e' && key.ctrl)) {
        selectedIndex = options.length - 1;
        moved = true;
      }

      if (moved) {
        // Clear and re-render
        moveCursorDown(options.length - selectedIndex);
        render();
      }
    };

    const cleanup = () => {
      process.stdin.removeListener('keypress', handleKeypress);
      if (!isRaw) {
        process.stdin.setRawMode?.(false);
      }
      process.stdin.pause?.();
      rl.close();
      console.log(''); // Newline after selector
    };

    process.stdin.on('keypress', handleKeypress);
  });
}
