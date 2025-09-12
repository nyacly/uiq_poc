const { spawnSync } = require('child_process');

if (!process.env.CI) {
  const result = spawnSync('npm', ['run', 'lighthouse'], { stdio: 'inherit', shell: true });
  if (result.status !== 0) {
    process.exit(result.status);
  }
} else {
  console.log('Skipping lighthouse in CI environment');
}
