const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  // Get the last 10 commits
  const stdout = execSync('git log -n 10 --pretty=format:"%h|%an|%ar|%s"').toString();
  const commits = stdout.trim().split('\n').map(line => {
    const [hash, author, date, subject] = line.split('|');
    return { hash, author, date, subject };
  });

  const outputPath = path.join(__dirname, '../src/data/git-log.json');
  
  // Ensure the directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(commits, null, 2));
  console.log('✅ Git log generated successfully at build time.');
} catch (error) {
  console.warn('⚠️ Failed to generate git log at build time, using fallback.', error.message);
  // Write an empty array or fallback to prevent build errors
  const outputPath = path.join(__dirname, '../src/data/git-log.json');
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, '[]');
}
