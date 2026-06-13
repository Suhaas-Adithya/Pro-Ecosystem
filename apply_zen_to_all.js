const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

const zenCSS = `
/* ─── ZEN WAVE 3 LAYOUT & FEATURES ─── */
:root {
  --glass-bg: hsla(228, 20%, 10%, 0.6);
  --glass-border: hsla(228, 20%, 100%, 0.08);
  --glass-shadow: rgba(0, 0, 0, 0.4);
}

[data-theme="light"] {
  --glass-bg: hsla(0, 0%, 100%, 0.7);
  --glass-border: hsla(228, 20%, 0%, 0.06);
  --glass-shadow: rgba(0, 0, 0, 0.05);
}

body {
  background-color: transparent !important;
  background-image: 
    radial-gradient(circle at 10% 20%, hsla(250, 70%, 50%, 0.15) 0%, transparent 40%),
    radial-gradient(circle at 90% 80%, hsla(199, 70%, 50%, 0.15) 0%, transparent 40%);
  background-attachment: fixed;
}

.glass-card, .zen-sidebar, .app-container > .sidebar, .modal-content, .panel {
  background: var(--glass-bg) !important;
  backdrop-filter: blur(20px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
  border: 1px solid var(--glass-border) !important;
  box-shadow: 0 8px 32px 0 var(--glass-shadow) !important;
}

.input-field, input, textarea {
  background: rgba(0,0,0,0.2) !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid var(--glass-border) !important;
}

[data-theme="light"] .input-field, [data-theme="light"] input, [data-theme="light"] textarea {
  background: rgba(255,255,255,0.4) !important;
}
`;

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file === 'node_modules' || file === 'dist' || file === '.git') continue;
      processDir(fullPath);
    } else if (file === 'index.css') {
      console.log('Injecting Zen UI into:', fullPath);
      let content = fs.readFileSync(fullPath, 'utf8');
      if (!content.includes('ZEN WAVE 3 LAYOUT')) {
        content += '\n' + zenCSS;
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  }
}

console.log('Applying Zen UI to all apps...');
processDir(ROOT);
console.log('Done!');
