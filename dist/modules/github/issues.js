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
exports.getRecentIssues = getRecentIssues;
exports.displayRecentIssues = displayRecentIssues;
const chalk_1 = __importDefault(require("chalk"));
const https = __importStar(require("https"));
const auth_1 = require("./auth");
const REPOS = ['1037solo-shared', 'StudySolo-Dev', 'Platform.1037Solo.com', '1037Solo-Docs', '1037Solo-LandingPage', '1037Solo-OfficeGithub'];
function githubGet(path, token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.github.com',
            path: path,
            method: 'GET',
            headers: {
                'User-Agent': 'My-Windows-CLI',
                'Accept': 'application/vnd.github+json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                }
                catch {
                    resolve(null);
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}
async function getRecentIssues(days = 7, token) {
    const activeAccount = token ? null : (0, auth_1.getActiveAccount)();
    const authToken = token || activeAccount?.token || '';
    const username = activeAccount?.username || 'AIMFllys';
    const issues = [];
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split('T')[0];
    for (const repo of REPOS) {
        try {
            const data = await githubGet(`/repos/${username}/${repo}/issues?since=${sinceStr}&state=open&per_page=20`, authToken);
            if (Array.isArray(data)) {
                for (const issue of data) {
                    if (issue.pull_request)
                        continue; // Skip PRs
                    issues.push({
                        number: issue.number,
                        title: issue.title,
                        repo: repo,
                        createdAt: issue.created_at,
                        url: issue.html_url
                    });
                }
            }
        }
        catch {
            // Skip repos that fail
        }
    }
    return issues.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
async function displayRecentIssues(days = 7) {
    const account = (0, auth_1.getActiveAccount)();
    if (!account?.token) {
        console.log(chalk_1.default.yellow('\n⚠ No GitHub token available.'));
        console.log(chalk_1.default.gray('   Please run "gh auth login" or check your token.\n'));
        return;
    }
    console.log(chalk_1.default.bold(`\n📋 Recent Issues (last ${days} days):`));
    console.log(chalk_1.default.gray(`  Account: ${account.username}\n`));
    try {
        const issues = await getRecentIssues(days, account.token);
        if (issues.length === 0) {
            console.log(chalk_1.default.gray('  No new issues in the last 7 days.\n'));
            return;
        }
        // Group by repo
        const byRepo = new Map();
        for (const issue of issues) {
            if (!byRepo.has(issue.repo)) {
                byRepo.set(issue.repo, []);
            }
            byRepo.get(issue.repo).push(issue);
        }
        for (const [repo, repoIssues] of byRepo) {
            console.log(chalk_1.default.cyan(`  ${repo}:`));
            for (const issue of repoIssues.slice(0, 5)) {
                const age = Math.floor((Date.now() - new Date(issue.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                const ageStr = age === 0 ? 'today' : `${age}d ago`;
                console.log(chalk_1.default.white(`    #${issue.number} ${issue.title}`) + chalk_1.default.gray(` (${ageStr})`));
            }
            if (repoIssues.length > 5) {
                console.log(chalk_1.default.gray(`    ... and ${repoIssues.length - 5} more`));
            }
            console.log('');
        }
        console.log(chalk_1.default.green(`✅ Total: ${issues.length} issue(s)\n`));
    }
    catch (error) {
        console.log(chalk_1.default.red(`\n❌ Failed to fetch issues: ${error.message}\n`));
    }
}
