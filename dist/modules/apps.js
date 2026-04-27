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
exports.getApps = getApps;
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const COMMON_APPS = [
    {
        name: 'VS Code',
        paths: [
            'C:/Users/Lenovo/AppData/Local/Programs/Microsoft VS Code/Code.exe',
            'C:/Program Files/Microsoft VS Code/Code.exe'
        ],
        launchCmd: 'code .',
        description: 'Code editor'
    },
    {
        name: 'Cursor',
        paths: [
            'C:/Users/Lenovo/AppData/Local/Cursor/app-*/Cursor.exe',
            'C:/Program Files/Cursor/Cursor.exe'
        ],
        launchCmd: 'cursor .',
        description: 'AI-first code editor'
    },
    {
        name: 'Windows Terminal',
        paths: [
            'C:/Users/Lenovo/AppData/Local/Microsoft/WindowsApps/wt.exe',
            'C:/Windows/System32/windowsterminal.exe'
        ],
        launchCmd: 'wt',
        description: 'Windows terminal'
    },
    {
        name: 'Chrome',
        paths: [
            'C:/Program Files/Google/Chrome/Application/chrome.exe',
            'C:/Users/Lenovo/AppData/Local/Google/Chrome/Application/chrome.exe'
        ],
        launchCmd: 'start chrome',
        description: 'Web browser'
    },
    {
        name: 'Edge',
        paths: [
            'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
            'C:/Program Files/Microsoft/Edge/Application/msedge.exe'
        ],
        launchCmd: 'start msedge',
        description: 'Microsoft Edge browser'
    },
    {
        name: 'GitHub Desktop',
        paths: [
            'C:/Users/Lenovo/AppData/Local/GitHubDesktop/GitHubDesktop.exe',
            'C:/Program Files/GitHub Desktop/GitHubDesktop.exe'
        ],
        launchCmd: 'github',
        description: 'Git GUI client'
    },
    {
        name: 'Node.js',
        paths: [
            'C:/Program Files/nodejs/node.exe',
            'C:/Program Files (x86)/nodejs/node.exe'
        ],
        launchCmd: 'node',
        description: 'JavaScript runtime'
    },
    {
        name: 'Python',
        paths: [
            'C:/Users/Lenovo/AppData/Local/Programs/Python/Python*/python.exe',
            'C:/Python*/python.exe'
        ],
        launchCmd: 'python',
        description: 'Python runtime'
    },
    {
        name: 'Claude Code',
        paths: [
            'C:/Users/Lenovo/AppData/Roaming/npm/claude.cmd',
            'C:/Program Files/claude/bin/claude.cmd'
        ],
        launchCmd: 'claude',
        description: 'Anthropic CLI'
    },
    {
        name: 'Kiro',
        paths: [],
        launchCmd: 'kiro-cli',
        description: 'Kiro CLI (AI coding)'
    },
    {
        name: 'File Explorer',
        paths: [
            'C:/Windows/explorer.exe'
        ],
        launchCmd: 'explorer .',
        description: 'File explorer'
    },
    {
        name: 'Notepad',
        paths: [
            'C:/Windows/notepad.exe'
        ],
        launchCmd: 'notepad',
        description: 'Text editor'
    },
    {
        name: 'PowerShell',
        paths: [
            'C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe',
            'C:/Windows/System32/WindowsPowerShell/v1.0/pwsh.exe'
        ],
        launchCmd: 'pwsh',
        description: 'PowerShell terminal'
    }
];
function findAppPath(app) {
    if (app.paths.length === 0)
        return null;
    for (const p of app.paths) {
        if (p.includes('*')) {
            const baseDir = path.dirname(p);
            try {
                if (fs.existsSync(baseDir)) {
                    const files = fs.readdirSync(baseDir);
                    const match = files.find(f => path.basename(p).replace('*', '') === f.substring(0, path.basename(p).indexOf('*') > -1 ? path.basename(p).indexOf('*') : f.length));
                    if (match)
                        return path.join(baseDir, match);
                }
            }
            catch { }
        }
        else if (fs.existsSync(p)) {
            return p;
        }
    }
    return null;
}
function getApps() {
    let output = '';
    for (const app of COMMON_APPS) {
        const foundPath = findAppPath(app);
        const status = foundPath ? chalk_1.default.green('✓') : chalk_1.default.gray('○');
        const pathStr = foundPath ? chalk_1.default.gray(` (${foundPath.replace(/\\/g, '/')})`) : '';
        output += `\n  ${status} ${chalk_1.default.white(app.name)}`;
        output += chalk_1.default.cyan(` ${app.launchCmd}`);
        output += chalk_1.default.gray(` - ${app.description}`);
        if (pathStr)
            output += pathStr;
    }
    output += chalk_1.default.bold('\n\n💡 Quick Launch Examples:\n');
    output += chalk_1.default.gray('  code .') + chalk_1.default.white('        - Open VS Code here\n');
    output += chalk_1.default.gray('  cursor .') + chalk_1.default.white('       - Open Cursor here\n');
    output += chalk_1.default.gray('  explorer .') + chalk_1.default.white('      - Open File Explorer here\n');
    output += chalk_1.default.gray('  wt') + chalk_1.default.white('             - Open Windows Terminal here\n');
    output += chalk_1.default.gray('  start chrome') + chalk_1.default.white('   - Open Chrome\n');
    return output;
}
