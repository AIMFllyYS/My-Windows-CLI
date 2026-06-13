import * as readline from 'readline';
import chalk from 'chalk';
import { getSlashMenuItems, SlashMenuItem } from './commands';
import { AiMode } from './session';

export interface SlashSuggestion {
  id: string;
  command: string;
  description: string;
}

export interface SlashTypeaheadState {
  active: boolean;
  input: string;
  mode: AiMode;
  suggestions: SlashSuggestion[];
  selectedIndex: number;
  commandWidth: number;
}

export type SlashApplyAction =
  | { action: 'none'; input: string }
  | { action: 'complete'; input: string }
  | { action: 'execute'; input: string };

export interface SlashPromptOptions {
  prompt: string;
  mode: AiMode;
  input?: NodeJS.ReadStream;
  output?: NodeJS.WriteStream;
  onOverlayChange?: (active: boolean) => void;
  signal?: AbortSignal;
}

function visibleCommand(item: SlashMenuItem): string {
  return item.command.replace(/\s+<[^>]+>/g, '');
}

function toSuggestion(item: SlashMenuItem): SlashSuggestion {
  return {
    id: item.command,
    command: visibleCommand(item),
    description: item.description,
  };
}

export function createSlashTypeaheadState(input: string, mode: AiMode): SlashTypeaheadState {
  if (!input.startsWith('/')) {
    return { active: false, input, mode, suggestions: [], selectedIndex: -1, commandWidth: 0 };
  }

  const items = getSlashMenuItems(mode);
  const commandWidth = Math.max(...items.map((item) => item.command.length), 0);
  const query = input.trim().toLowerCase();
  const suggestions = items
    .map(toSuggestion)
    .filter((item) => item.command.toLowerCase().startsWith(query));

  return {
    active: suggestions.length > 0,
    input,
    mode,
    suggestions,
    selectedIndex: suggestions.length > 0 ? 0 : -1,
    commandWidth,
  };
}

export function moveSlashSelection(state: SlashTypeaheadState, delta: number): SlashTypeaheadState {
  if (!state.active || state.suggestions.length === 0) return state;
  const next = (state.selectedIndex + delta + state.suggestions.length) % state.suggestions.length;
  return { ...state, selectedIndex: next };
}

export function dismissSlashTypeahead(state: SlashTypeaheadState): SlashTypeaheadState {
  return { ...state, active: false, suggestions: [], selectedIndex: -1 };
}

export function applySlashSelection(state: SlashTypeaheadState, key: 'tab' | 'enter'): SlashApplyAction {
  if (!state.active || state.selectedIndex < 0) return { action: 'none', input: state.input };
  const command = state.suggestions[state.selectedIndex]?.command || state.input;
  if (key === 'tab') return { action: 'complete', input: `${command} ` };
  return { action: 'execute', input: command };
}

export function renderSlashTypeahead(state: SlashTypeaheadState): string {
  if (!state.active) return '';
  const maxVisible = 5;
  const start = Math.max(0, Math.min(
    state.selectedIndex - Math.floor(maxVisible / 2),
    state.suggestions.length - maxVisible,
  ));
  const visible = state.suggestions.slice(start, start + maxVisible);
  return visible.map((item, index) => {
    const actualIndex = start + index;
    const selected = actualIndex === state.selectedIndex;
    const prefix = selected ? chalk.green('›') : chalk.gray(' ');
    const command = item.command.padEnd(state.commandWidth);
    const label = selected ? chalk.bold.white(command) : chalk.white(command);
    return `${prefix} ${label} ${chalk.gray(item.description)}`;
  }).join('\n');
}

export function promptWithSlashTypeahead(options: SlashPromptOptions): Promise<string> {
  const input = options.input || process.stdin;
  const output = options.output || process.stdout;
  let value = '';
  let state = createSlashTypeaheadState('', options.mode);
  let renderedSuggestionLines = 0;
  let settled = false;

  const clearSuggestions = () => {
    if (renderedSuggestionLines === 0) return;
    for (let i = 0; i < renderedSuggestionLines; i += 1) {
      output.write('\x1B[1A\x1B[2K');
    }
    renderedSuggestionLines = 0;
  };

  const render = () => {
    clearSuggestions();
    output.write(`\r\x1B[2K${options.prompt}${value}`);
    const rendered = renderSlashTypeahead(state);
    if (rendered) {
      const lines = rendered.split('\n');
      output.write(`\n${rendered}`);
      renderedSuggestionLines = lines.length;
      output.write(`\x1B[${renderedSuggestionLines}A`);
      output.write(`\r\x1B[${options.prompt.length + value.length}C`);
    }
  };

  return new Promise((resolve) => {
    const wasRaw = input.isRaw;
    readline.emitKeypressEvents(input);
    input.setRawMode?.(true);
    input.resume();

    const cleanup = () => {
      if (settled) return;
      settled = true;
      clearSuggestions();
      input.removeListener('keypress', onKeypress);
      options.signal?.removeEventListener('abort', onAbort);
      if (!wasRaw) input.setRawMode?.(false);
      options.onOverlayChange?.(false);
      output.write('\n');
    };

    const finish = (next: string) => {
      cleanup();
      resolve(next);
    };

    const onAbort = () => {
      finish('');
    };

    const refreshState = () => {
      const previousActive = state.active;
      state = createSlashTypeaheadState(value, options.mode);
      if (previousActive !== state.active) options.onOverlayChange?.(state.active);
    };

    const onKeypress = (str: string | undefined, key: readline.Key) => {
      if (key?.ctrl && key.name === 'c' && state.active) {
        state = dismissSlashTypeahead(state);
        options.onOverlayChange?.(false);
        render();
        return;
      }
      if (key?.name === 'escape' && state.active) {
        state = dismissSlashTypeahead(state);
        options.onOverlayChange?.(false);
        render();
        return;
      }
      if ((key?.name === 'up' || key?.name === 'k') && state.active) {
        state = moveSlashSelection(state, -1);
        render();
        return;
      }
      if ((key?.name === 'down' || key?.name === 'j') && state.active) {
        state = moveSlashSelection(state, 1);
        render();
        return;
      }
      if (key?.name === 'tab' && key.shift) {
        if (state.active) {
          state = dismissSlashTypeahead(state);
          options.onOverlayChange?.(false);
          render();
        }
        return;
      }
      if (key?.name === 'tab' && state.active) {
        const applied = applySlashSelection(state, 'tab');
        if (applied.action === 'complete') value = applied.input;
        refreshState();
        render();
        return;
      }
      if (key?.name === 'return') {
        if (state.active) {
          const applied = applySlashSelection(state, 'enter');
          finish(applied.input);
          return;
        }
        finish(value);
        return;
      }
      if (key?.name === 'backspace') {
        value = value.slice(0, -1);
        refreshState();
        render();
        return;
      }
      if (str && !key?.ctrl && !key?.meta) {
        value += str;
        refreshState();
        render();
      }
    };

    output.write(options.prompt);
    if (options.signal?.aborted) {
      finish('');
      return;
    }
    options.signal?.addEventListener('abort', onAbort, { once: true });
    input.on('keypress', onKeypress);
  });
}
