const { spawn } = require('child_process');
const path = require('path');

const apps = [
  { name: 'Pro Launcher', dir: 'Pro Launcher', cmd: 'npm run dev' },
  { name: 'Pro Browser', dir: 'Pro Browser', cmd: 'npm run dev' },
  { name: 'Pro Meet Backend', dir: 'Pro Meet/backend', cmd: 'npm run start' },
  { name: 'Pro Dev', dir: 'Pro Dev', cmd: 'npm run dev' },
  { name: 'Pro Meet', dir: 'Pro Meet', cmd: 'npm run dev' },
  { name: 'Pro Chat', dir: 'Pro Chat', cmd: 'npm run dev' },
  { name: 'Pro Drive', dir: 'Pro Drive', cmd: 'npm run dev' },
  { name: 'Pro Calendar', dir: 'Pro Calendar', cmd: 'npm run dev' },
  { name: 'Pro Vault', dir: 'Pro Vault', cmd: 'npm run dev' },
  { name: 'Pro Hub', dir: 'Pro Hub', cmd: 'npm run dev' },
  { name: 'Pro Agent', dir: 'Pro Agent', cmd: 'npm run dev' },
  { name: 'Pro Arcade', dir: 'Pro Arcade', cmd: 'npm run dev' },
  { name: 'Pro Audio', dir: 'Pro Audio', cmd: 'npm run dev' },
  { name: 'Pro Keep', dir: 'Pro Keep', cmd: 'npm run dev' },
  { name: 'Pro Mail', dir: 'Pro Mail', cmd: 'npm run dev' },
  { name: 'Pro Terminal', dir: 'Pro Terminal', cmd: 'npm run dev' },
  { name: 'Pro Web', dir: 'Pro Web', cmd: 'npm run dev' },
];

apps.forEach(app => {
  const child = spawn(app.cmd.split(' ')[0], app.cmd.split(' ').slice(1), {
    cwd: path.join(__dirname, app.dir),
    shell: true,
    stdio: 'ignore'
  });
  console.log(`Started ${app.name}`);
});

console.log('All ecosystem apps started!');
// Keep script alive
setInterval(() => {}, 1000 * 60 * 60);
