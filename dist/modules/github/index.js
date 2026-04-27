"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveAccount = exports.getGitHubAccounts = exports.interactiveSwitch = exports.displayAccounts = void 0;
exports.getGitHubInfo = getGitHubInfo;
exports.getGhAuthCommands = getGhAuthCommands;
const chalk_1 = __importDefault(require("chalk"));
const auth_1 = require("./auth");
Object.defineProperty(exports, "getGitHubAccounts", { enumerable: true, get: function () { return auth_1.getGitHubAccounts; } });
Object.defineProperty(exports, "displayAccounts", { enumerable: true, get: function () { return auth_1.displayAccounts; } });
Object.defineProperty(exports, "interactiveSwitch", { enumerable: true, get: function () { return auth_1.interactiveSwitch; } });
Object.defineProperty(exports, "getActiveAccount", { enumerable: true, get: function () { return auth_1.getActiveAccount; } });
const issues_1 = require("./issues");
async function getGitHubInfo(options = {}) {
    const { showAccounts = true, showIssues = true, issuesDays = 7 } = options;
    // Display accounts section
    if (showAccounts) {
        (0, auth_1.displayAccounts)();
    }
    // Display issues section
    if (showIssues) {
        await (0, issues_1.displayRecentIssues)(issuesDays);
    }
}
function getGhAuthCommands() {
    return `
${chalk_1.default.bold('🔐 GitHub Auth Commands:')}

${chalk_1.default.cyan('  gh auth status')}
    View current login status

${chalk_1.default.cyan('  gh auth login')}
    Interactive login

${chalk_1.default.cyan('  gh auth logout')}
    Logout

${chalk_1.default.cyan('  gh auth switch')}
    Switch between accounts (interactive)

${chalk_1.default.green('  coding --gh')}
    Show all GitHub accounts and recent issues

${chalk_1.default.green('  coding --gh accounts')}
    Show all GitHub accounts only

${chalk_1.default.green('  coding --gh switch')}
    Interactive account switcher

${chalk_1.default.green('  coding --gh issues')}
    Show recent issues only
`;
}
