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
exports.getProjectPaths = getProjectPaths;
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const PROJECT_ROOT = 'C:/project';
function scanProjects() {
    const projects = [];
    const excludeDirs = ['node_modules', '.git', '.next', 'dist', 'build', '.cache', '__pycache__', 'venv', '.venv', '.env'];
    try {
        const entries = fs.readdirSync(PROJECT_ROOT, { withFileTypes: true });
        for (const entry of entries) {
            if (!entry.isDirectory())
                continue;
            if (excludeDirs.some(d => entry.name.toLowerCase().includes(d.toLowerCase())))
                continue;
            const fullPath = path.join(PROJECT_ROOT, entry.name);
            // Try to get description from package.json or README
            let description = '';
            const pkgPath = path.join(fullPath, 'package.json');
            const readmePath = path.join(fullPath, 'README.md');
            if (fs.existsSync(pkgPath)) {
                try {
                    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
                    description = pkg.description || pkg.name || '';
                }
                catch { }
            }
            if (!description && fs.existsSync(readmePath)) {
                const content = fs.readFileSync(readmePath, 'utf-8');
                const firstLine = content.split('\n').find(l => l.trim() && !l.startsWith('#'));
                if (firstLine)
                    description = firstLine.trim().substring(0, 60);
            }
            projects.push({
                name: entry.name,
                path: fullPath.replace(/\\/g, '/'),
                description: description || ''
            });
        }
    }
    catch (error) {
        console.log(chalk_1.default.red(`Error scanning projects: ${error}`));
    }
    return projects.sort((a, b) => a.name.localeCompare(b.name));
}
function getProjectPaths() {
    const projects = scanProjects();
    if (projects.length === 0) {
        return chalk_1.default.gray('  No projects found');
    }
    let output = '';
    for (const proj of projects) {
        output += chalk_1.default.green(`\n  📂 ${proj.name}`);
        output += chalk_1.default.gray(`\n     ${proj.path}`);
        if (proj.description) {
            output += chalk_1.default.gray(`\n     ${proj.description}`);
        }
    }
    return output;
}
