# gituser-cli

# Must have node 18+
```
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

# Install dependencies
```
npm install typescript @types/node --save-dev
npm install @octokit/rest @gitbeaker/rest node-fetch
npm install dotenv
```
# Build
```
npx tsc
```

# Load ENV
Create a env file in the repo root
```
GITHUB_TOKEN="***"
GITLAB_TOKEN="***"
```


# Run script
```
node dist/cli.js <user_url>
Example: node dist/cli.js https://github.com/reverseroot
```
