module.exports = {
  apps: [{
    name: 'community-hub',
    script: 'npm',
    args: 'run dev',
    cwd: '/home/user/webapp/community-hub',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    instances: 1,
    exec_mode: 'fork'
  }]
};