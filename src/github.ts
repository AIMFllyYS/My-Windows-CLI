import chalk from 'chalk';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load env before reading token
const envPath = 'C:/project/1037Solo/StudySolo-Dev/backend/.env';
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const GITHUB_TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN || process.env.GITHUB_TOKEN || '';
const GITHUB_USER = 'AIMFllys';
const REPOS = ['1037solo-shared', 'StudySolo-Dev', 'Platform.1037Solo.com', '1037Solo-Docs', '1037Solo-LandingPage', '1037Solo-OfficeGithub'];

function githubGet(githubPath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: githubPath,
      method: 'GET',
      headers: {
        'User-Agent': 'coding-cli',
        'Accept': 'application/vnd.github+json',
        ...(GITHUB_TOKEN && { 'Authorization': `Bearer ${GITHUB_TOKEN}` })
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(null);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

export async function getGithubInfo(short: boolean = false): Promise<void> {
  // GitHub Auth Commands Section
  console.log(chalk.bold('\n🔐 GitHub Auth 登录/登出:\n'));
  console.log(chalk.cyan('  查看状态:'));
  console.log(chalk.gray('    gh auth status\n'));
  console.log(chalk.cyan('  交互式登录:'));
  console.log(chalk.gray('    gh auth login\n'));
  console.log(chalk.cyan('  退出登录:'));
  console.log(chalk.gray('    gh auth logout\n'));
  console.log(chalk.cyan('  Token 自动登录:'));
  console.log(chalk.green('    gh auth login --with-token <TOKEN>'));
  console.log(chalk.gray('    (自动从 env 读取 token)\n'));

  if (!GITHUB_TOKEN) {
    console.log(chalk.yellow('⚠ GitHub token not found. Set GITHUB_PERSONAL_ACCESS_TOKEN or GITHUB_TOKEN'));
    console.log(chalk.gray('   (Reading from: ~/project/1037Solo/StudySolo-Dev/backend/.env)\n'));
    console.log(chalk.bold('📋 GitHub Issues (last 7 days):\n'));
    console.log(chalk.gray('  No token - cannot fetch issues\n'));
    return;
  }

  try {
    // Get user info
    const user = await githubGet('/user');
    if (user?.login) {
      console.log(chalk.green(`✅ 已登录: ${chalk.bold(user.login)}`));
      if (user.name) console.log(chalk.gray(`   Name: ${user.name}`));
      if (user.email) console.log(chalk.gray(`   Email: ${user.email}`));
    }

    // Get recent issues from all repos
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateStr = sevenDaysAgo.toISOString().split('T')[0];

    console.log(chalk.bold('\n📋 Recent Issues (last 7 days):'));

    let totalIssues = 0;
    const issuePromises = REPOS.map(async (repo) => {
      const issues: any[] = await githubGet(`/repos/${GITHUB_USER}/${repo}/issues?since=${dateStr}&state=open&per_page=10`);
      return { repo, issues: Array.isArray(issues) ? issues.filter(i => !i.pull_request) : [] };
    });

    const repoIssues = await Promise.all(issuePromises);

    for (const { repo, issues } of repoIssues) {
      if (issues.length > 0) {
        totalIssues += issues.length;
        console.log(chalk.cyan(`\n  ${repo}:`));
        for (const issue of issues.slice(0, 3)) {
          const age = Math.floor((Date.now() - new Date(issue.created_at).getTime()) / (1000 * 60 * 60 * 24));
          const ageStr = age === 0 ? 'today' : `${age}d ago`;
          console.log(chalk.white(`    #${issue.number} ${issue.title}`) + chalk.gray(` (${ageStr})`));
        }
        if (issues.length > 3) {
          console.log(chalk.gray(`    ... and ${issues.length - 3} more`));
        }
      }
    }

    if (totalIssues === 0) {
      console.log(chalk.gray('\n  No new issues in the last 7 days'));
    } else {
      console.log(chalk.green(`\n✅ Total: ${totalIssues} new issue(s) across ${REPOS.length} repos`));
    }

  } catch (error: any) {
    console.log(chalk.red(`\n❌ GitHub API error: ${error.message}`));
  }
}
