import { Octokit } from '@octokit/rest';
import { Gitlab } from '@gitbeaker/rest';
import fetch from 'node-fetch';

import * as dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

const githubToken = process.env.GITHUB_TOKEN;
const gitlabToken = process.env.GITLAB_TOKEN;

if (!githubToken || !gitlabToken) {
  console.error('Missing API tokens in environment variables.');
  process.exit(1);
}

const githubClient = new Octokit({ auth: githubToken });
const gitlabClient = new Gitlab({ 
  host: 'https://gitlab.com',
  token: gitlabToken
});

// Usage: 
// node dist/cli.js https://github.com/reverseroot
//
const args = process.argv.slice(2);
const profileUrl = args[0];

if (!profileUrl) {
  console.error('Invalid URL.');
  process.exit(1);
}

async function getMostUsedLanguages() {
  if (profileUrl.includes('github.com')) {
    const username = profileUrl.split('/').pop() ?? '';
    if (!username) {
      throw new Error("Invalid GitHub profile URL");
    }
    const repos = await githubClient.repos.listForUser({ username });
    
    const languages = await Promise.all(
      repos.data.map(async (repo) => {
        const { data } = await githubClient.repos.listLanguages({
          owner: repo.owner.login,
          repo: repo.name,
        });
        return data;
      })
    );

    printMostUsedLanguages(aggregateLanguages(languages));
  } else if (profileUrl.includes('gitlab.com')) {
    const username = profileUrl.split('/').pop() ?? '';
    if (!username) {
      throw new Error("Invalid GitLab profile URL");
    }

    const users = await gitlabClient.Users.all({ username });
    if (users.length === 0) {
      throw new Error("User not found on GitLab");
    }
    const userId = users[0].id as unknown as string;
    console.log('Fetching for User:', users[0].name);

    // Fetch user's projects using their ID
    const projects  = await gitlabClient.Projects.all({
      userId: "mbacchi",
      showExpanded: true,
      membership: true
    });

    const languagesArray: any[] = [];
    for (const project of projects.data) {
        const languages = await gitlabClient.Projects.showLanguages(project.id as number);
        if (Object.keys(languages).length > 0) {
            languagesArray.push(languages);
        }
    }
    printMostUsedLanguages(aggregateLanguages(languagesArray));
  } else {
    console.error('Invalid profile URL');
    process.exit(1);
  }
}

function aggregateLanguages(languagesArray: any[]) {
  const languageMap: { [key: string]: number } = {};

  languagesArray.forEach((languages) => {
    Object.keys(languages).forEach((language) => {
      languageMap[language] = (languageMap[language] || 0) + languages[language];
    });
  });

  const totalBytes = Object.values(languageMap).reduce((acc, val) => acc + val, 0);

  return Object.entries(languageMap)
    .map(([language, bytes]) => ({ language, percentage: ((bytes / totalBytes) * 100).toFixed(2) }))
    .sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage))
    .slice(0, 5);
}

function printMostUsedLanguages(languages: { language: string, percentage: string }[]) {
  console.log(`Profile URL: ${profileUrl}`);
  console.log('Five most used languages:');
  languages.forEach((lang) => console.log(`* ${lang.language} (${lang.percentage}%)`));
}

getMostUsedLanguages().catch((error) => {
  console.error('Error fetching data:', error);
  process.exit(1);
});

