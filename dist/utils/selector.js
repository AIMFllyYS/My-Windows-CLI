"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.interactiveSelect = interactiveSelect;
const readline = __importStar(require("readline"));
const chalk_1 = __importDefault(require("chalk"));
async function interactiveSelect(config) {
    const { title, options, onSelect, onCancel } = config;
    if (options.length === 0) {
        console.log(chalk_1.default.yellow('No options available'));
        return;
    }
    let selectedIndex = 0;
    // Clear line and move cursor home
    const clearLine = () => {
        process.stdout.write('\r\x1B[K');
    };
    const moveCursorUp = (lines) => {
        process.stdout.write(`\x1B[${lines}A`);
    };
    const moveCursorDown = (lines) => {
        process.stdout.write(`\x1B[${lines}B`);
    };
    // Render the selector
    const render = () => {
        clearLine();
        console.log(chalk_1.default.bold.cyan(title));
        console.log(chalk_1.default.gray('(Use ↑/↓ or j/k to navigate, Enter to select, Esc/q to cancel)\n'));
        options.forEach((option, index) => {
            const isSelected = index === selectedIndex;
            const prefix = isSelected ? chalk_1.default.green('▶ ') : '  ';
            const label = isSelected ? chalk_1.default.bold.white(option.label) : chalk_1.default.white(option.label);
            const desc = option.description ? chalk_1.default.gray(` - ${option.description}`) : '';
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
    return new Promise((resolve) => {
        // Enable raw mode
        process.stdin.setRawMode?.(true);
        process.stdin.resume?.();
        process.stdin.setEncoding?.('utf8');
        render();
        const handleKeypress = (char, key) => {
            // Handle Ctrl+C
            if (key.ctrl && char === 'c') {
                cleanup();
                process.exit(0);
            }
            // Handle Escape or q to cancel
            if (key.name === 'escape' || (key.name === 'q' && !key.ctrl)) {
                cleanup();
                if (onCancel)
                    onCancel();
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
            }
            else if (key.name === 'down' || key.name === 'j') {
                selectedIndex = selectedIndex < options.length - 1 ? selectedIndex + 1 : 0;
                moved = true;
            }
            else if (key.name === 'home' || (key.name === 'a' && key.ctrl)) {
                selectedIndex = 0;
                moved = true;
            }
            else if (key.name === 'end' || (key.name === 'e' && key.ctrl)) {
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
