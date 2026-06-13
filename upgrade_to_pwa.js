const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = __dirname;

// All frontend Vite apps in the ecosystem
const apps = [
  'Pro Browser',
  'Pro Dev',
  'Pro Meet',
  'Pro Chat',
  'Pro Drive',
  'Pro Calendar',
  'Pro Vault',
  'Pro Hub',
  'Pro Agent',
  'Pro Arcade',
  'Pro Audio',
  'Pro Keep',
  'Pro Mail',
  'Pro Terminal',
  'Pro Web'
];

console.log('🚀 Starting PWA Ecosystem Upgrade...\n');

apps.forEach(app => {
  const appPath = path.join(rootDir, app);
  
  if (!fs.existsSync(appPath)) {
    console.log(`⚠️ Skipping ${app} (Directory not found)`);
    return;
  }
  
  const packageJsonPath = path.join(appPath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.log(`⚠️ Skipping ${app} (No package.json)`);
    return;
  }

  console.log(`\n📦 Injecting PWA support into ${app}...`);

  // 1. Install vite-plugin-pwa
  console.log('   - Installing vite-plugin-pwa...');
  try {
    execSync('npm install vite-plugin-pwa --save-dev', { cwd: appPath, stdio: 'ignore' });
  } catch (e) {
    console.error(`   ❌ Failed to install in ${app}`);
    return;
  }

  // 2. Rewrite vite.config.js
  const viteConfigPath = path.join(appPath, 'vite.config.js');
  if (fs.existsSync(viteConfigPath)) {
    console.log('   - Rewriting vite.config.js...');
    
    // Read the current config to extract the port if possible
    const currentConfig = fs.readFileSync(viteConfigPath, 'utf8');
    let port = 5173; // default
    const portMatch = currentConfig.match(/port:\s*(\d+)/);
    if (portMatch) port = portMatch[1];
    
    const newConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        runtimeCaching: [
          {
            urlPattern: /^http:\\/\\/localhost:3001\\/api\\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pro-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      manifest: {
        name: '${app} (Pro Suite)',
        short_name: '${app.replace('Pro ', '')}',
        description: '${app} offline-capable progressive web application.',
        theme_color: '#06070a',
        background_color: '#06070a',
        display: 'standalone',
        icons: [
          {
            src: 'https://cdn-icons-png.flaticon.com/512/3113/3113110.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    port: ${port},
    strictPort: true
  }
})
`;
    fs.writeFileSync(viteConfigPath, newConfig, 'utf8');
  } else {
    console.log(`   ⚠️ No vite.config.js found for ${app}, skipping config rewrite.`);
  }

  console.log(`   ✅ ${app} is now a Downloadable PWA!`);
});

console.log('\n🎉 ECOSYSTEM PWA UPGRADE COMPLETE! 🎉');
console.log('Restart the ecosystem using start_all.js to load the service workers.');
