"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseGhAuthStatus = parseGhAuthStatus;
exports.getGitHubAccounts = getGitHubAccounts;
exports.getActiveAccount = getActiveAccount;
exports.switchAccount = switchAccount;
exports.interactiveSwitch = interactiveSwitch;
exports.displayAccounts = displayAccounts;
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
const selector_1 = require("../../utils/selector");
/**
 * Parse gh auth status output to extract account information
 */
function parseGhAuthStatus() {
    try {
        const output = (0, child_process_1.execSync)('gh auth status', { encoding: 'utf-8', timeout: 10000 });
        return parseAuthOutput(output);
    }
    catch (error) {
        // Try with extended output
        try {
            const output = (0, child_process_1.execSync)('gh auth status 2>&1', { encoding: 'utf-8', timeout: 10000 });
            return parseAuthOutput(output);
        }
        catch {
            return [];
        }
    }
}
function parseAuthOutput(output) {
    const accounts = [];
    const lines = output.split('\n');
    let currentHostname = 'github.com';
    let currentUsername = '';
    let currentToken = '';
    let currentScopes = [];
    let isActive = false;
    for (const line of lines) {
        // New host
        const hostMatch = line.match(/^(\S+)\s*$/);
        if (hostMatch && !line.includes('✓') && !line.includes('-')) {
            // Save previous account if exists
            if (currentUsername) {
                accounts.push({
                    username: currentUsername,
                    token: currentToken,
                    scopes: currentScopes,
                    isActive,
                    hostname: currentHostname
                });
                currentScopes = [];
            }
            currentHostname = hostMatch[1].trim();
            continue;
        }
        // Logged in account
        const loginMatch = line.match(/✓\s+Logged in to (?:github\.com|[\w.-]+)\s+account\s+(\S+)/);
        if (loginMatch) {
            // Save previous if switching hosts
            if (currentUsername) {
                accounts.push({
                    username: currentUsername,
                    token: currentToken,
                    scopes: currentScopes,
                    isActive,
                    hostname: currentHostname
                });
                currentScopes = [];
            }
            currentUsername = loginMatch[1];
            isActive = line.includes('Active account: true');
            continue;
        }
        // Token info
        const tokenMatch = line.match(/Token:\s+(\S+)/);
        if (tokenMatch && currentUsername) {
            currentToken = tokenMatch[1];
            continue;
        }
        // Scopes
        const scopesMatch = line.match(/Token scopes:\s*(.+)/);
        if (scopesMatch && currentUsername) {
            const scopesStr = scopesMatch[1].replace(/'/g, '').trim();
            if (scopesStr) {
                currentScopes = scopesStr.split(',').map(s => s.trim());
            }
            continue;
        }
        // Active indicator
        if (line.includes('Active account:')) {
            isActive = line.includes('true');
        }
    }
    // Don't forget the last account
    if (currentUsername) {
        accounts.push({
            username: currentUsername,
            token: currentToken,
            scopes: currentScopes,
            isActive,
            hostname: currentHostname
        });
    }
    return accounts;
}
/**
 * Get all GitHub accounts from gh CLI
 */
function getGitHubAccounts() {
    return parseGhAuthStatus();
}
/**
 * Get the currently active GitHub account
 */
function getActiveAccount() {
    const accounts = getGitHubAccounts();
    return accounts.find(acc => acc.isActive) || null;
}
/**
 * Switch to a different GitHub account
 */
async function switchAccount(username) {
    try {
        (0, child_process_1.execSync)(`gh auth switch --user ${username}`, { encoding: 'utf-8', timeout: 10000 });
        return true;
    }
    catch (error) {
        console.log(chalk_1.default.red(`Failed to switch to account: ${username}`));
        return false;
    }
}
/**
 * Interactive account switcher
 */
async function interactiveSwitch() {
    const accounts = getGitHubAccounts();
    if (accounts.length === 0) {
        console.log(chalk_1.default.yellow('No GitHub accounts found. Please run: gh auth login'));
        return;
    }
    if (accounts.length === 1) {
        console.log(chalk_1.default.cyan(`Only one account is available: ${accounts[0].username}`));
        return;
    }
    await (0, selector_1.interactiveSelect)({
        title: '🔄 切换 GitHub 账号 / Switch GitHub Account',
        options: accounts.map(acc => ({
            label: acc.isActive ? `✓ ${acc.username} (current)` : `  ${acc.username}`,
            value: acc.username,
            description: acc.scopes.slice(0, 3).join(', ') + (acc.scopes.length > 3 ? '...' : '')
        })),
        onSelect: async (username) => {
            const success = await switchAccount(username);
            if (success) {
                console.log(chalk_1.default.green(`\n✅ Successfully switched to: ${username}`));
            }
        },
        onCancel: () => {
            console.log(chalk_1.default.gray('\nCancelled.'));
        }
    });
}
/**
 * Display all GitHub accounts
 */
function displayAccounts() {
    const accounts = getGitHubAccounts();
    console.log(chalk_1.default.bold.cyan('\n🔐 GitHub Accounts:\n'));
    if (accounts.length === 0) {
        console.log(chalk_1.default.yellow('  No GitHub accounts found.'));
        console.log(chalk_1.default.gray('  Run "gh auth login" to add an account.\n'));
        return;
    }
    for (const acc of accounts) {
        const activeMark = acc.isActive ? chalk_1.default.green('✓') : chalk_1.default.gray('○');
        const activeTag = acc.isActive ? chalk_1.default.green(' [ACTIVE]') : '';
        console.log(`  ${activeMark} ${chalk_1.default.white(acc.username)}${activeTag}`);
        console.log(chalk_1.default.gray(`    Host: ${acc.hostname}`));
        console.log(chalk_1.default.gray(`    Scopes: ${acc.scopes.join(', ') || 'none'}`));
        console.log('');
    }
    console.log(chalk_1.default.gray('  Use "coding --gh switch" to switch accounts.'));
    console.log(chalk_1.default.gray('  Use "gh auth login" to add a new account.'));
    console.log(chalk_1.default.gray('  Use "gh auth logout" to remove an account.\n'));
}
