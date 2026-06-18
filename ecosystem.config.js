// PM2 process configuration for MediSelf.
//
//   pm2 start ecosystem.config.js
//   pm2 logs mediself
//   pm2 restart mediself
//   pm2 save && pm2 startup     # run on server boot
//
// The single backend process serves BOTH the REST API (/api/*) and the
// built React SPA. PORT is read from backend/.env by start.sh.

module.exports = {
  apps: [
    {
      name: "mediself",
      script: "./start.sh",
      interpreter: "bash",
      cwd: __dirname,
      autorestart: true,
      max_restarts: 10,
      watch: false,
      max_memory_restart: "300M",
      out_file: "./logs/mediself-out.log",
      error_file: "./logs/mediself-error.log",
      time: true,
    },
  ],
};
