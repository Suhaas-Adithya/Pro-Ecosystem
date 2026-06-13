require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const os = require('os');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const fileUpload = require('express-fileupload');

// Unified JSON stores
const vaultFile = path.join(__dirname, 'vault.json');
const eventsFile = path.join(__dirname, 'events.json');
const notesFile = path.join(__dirname, 'notes.json');
const chatFile = path.join(__dirname, 'chat.json');
const syncFile = path.join(__dirname, 'sync.json');
const mailFile = path.join(__dirname, 'mail.json');
const meetingsFile = path.join(__dirname, 'meetings.json');
const roomsFile = path.join(__dirname, 'rooms.json');
const browserFile = path.join(__dirname, 'browser.json');
const communitiesFile = path.join(__dirname, 'communities.json');
if (!fs.existsSync(vaultFile)) fs.writeFileSync(vaultFile, JSON.stringify([]), 'utf8');
if (!fs.existsSync(eventsFile)) fs.writeFileSync(eventsFile, JSON.stringify([]), 'utf8');
if (!fs.existsSync(notesFile)) fs.writeFileSync(notesFile, JSON.stringify([]), 'utf8');
if (!fs.existsSync(chatFile)) fs.writeFileSync(chatFile, JSON.stringify({}), 'utf8');
if (!fs.existsSync(syncFile)) fs.writeFileSync(syncFile, JSON.stringify({}), 'utf8');
if (!fs.existsSync(mailFile)) fs.writeFileSync(mailFile, JSON.stringify([]), 'utf8');
if (!fs.existsSync(meetingsFile)) fs.writeFileSync(meetingsFile, JSON.stringify([]), 'utf8');
if (!fs.existsSync(roomsFile)) fs.writeFileSync(roomsFile, JSON.stringify([]), 'utf8');
if (!fs.existsSync(browserFile)) fs.writeFileSync(browserFile, JSON.stringify({ bookmarks: [], history: [] }), 'utf8');
if (!fs.existsSync(communitiesFile)) {
  const defaultCommunities = {
    servers: [
      { id: 'home', icon: '🏠', name: 'Home / DMs' }
    ],
    channels: {
      'home': { text: [], voice: [] }
    }
  };
  fs.writeFileSync(communitiesFile, JSON.stringify(defaultCommunities, null, 2), 'utf8');
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(fileUpload());

// ─── UNIFIED ECOSYSTEM APIs ───
app.get('/api/vault', (req, res) => {
  res.json({ files: JSON.parse(fs.readFileSync(vaultFile, 'utf8')) });
});
app.post('/api/vault', (req, res) => {
  const files = JSON.parse(fs.readFileSync(vaultFile, 'utf8'));
  files.push(req.body);
  fs.writeFileSync(vaultFile, JSON.stringify(files, null, 2), 'utf8');
  res.json({ success: true });
});

app.get('/api/events', (req, res) => {
  res.json({ events: JSON.parse(fs.readFileSync(eventsFile, 'utf8')) });
});
app.post('/api/events', (req, res) => {
  const evts = JSON.parse(fs.readFileSync(eventsFile, 'utf8'));
  evts.push(req.body);
  fs.writeFileSync(eventsFile, JSON.stringify(evts, null, 2), 'utf8');
  res.json({ success: true });
});

app.get('/api/notes', (req, res) => {
  res.json({ notes: JSON.parse(fs.readFileSync(notesFile, 'utf8')) });
});
app.post('/api/notes', (req, res) => {
  const notes = JSON.parse(fs.readFileSync(notesFile, 'utf8'));
  notes.push(req.body);
  fs.writeFileSync(notesFile, JSON.stringify(notes, null, 2), 'utf8');
  res.json({ success: true });
});

app.get('/api/chat', (req, res) => {
  res.json({ chat: JSON.parse(fs.readFileSync(chatFile, 'utf8')) });
});
app.post('/api/chat', (req, res) => {
  const { channelKey, message } = req.body;
  const chatStore = JSON.parse(fs.readFileSync(chatFile, 'utf8'));
  if (!chatStore[channelKey]) chatStore[channelKey] = [];
  chatStore[channelKey].push(message);
  fs.writeFileSync(chatFile, JSON.stringify(chatStore, null, 2), 'utf8');
  res.json({ success: true });
});

app.put('/api/chat', (req, res) => {
  const { channelKey, messageId, newText } = req.body;
  const chatStore = JSON.parse(fs.readFileSync(chatFile, 'utf8'));
  if (chatStore[channelKey]) {
    const msg = chatStore[channelKey].find(m => m.id === messageId);
    if (msg) {
      msg.text = newText;
      msg.edited = true;
      fs.writeFileSync(chatFile, JSON.stringify(chatStore, null, 2), 'utf8');
      
      // Also broadcast the edit via socket so clients update instantly
      ioInstance?.to(channelKey).emit('chat-message-edited', { channelKey, messageId, newText });
    }
  }
  res.json({ success: true });
});

app.delete('/api/chat', (req, res) => {
  const { channelKey, messageId } = req.body;
  const chatStore = JSON.parse(fs.readFileSync(chatFile, 'utf8'));
  if (chatStore[channelKey]) {
    chatStore[channelKey] = chatStore[channelKey].filter(m => m.id !== messageId);
    fs.writeFileSync(chatFile, JSON.stringify(chatStore, null, 2), 'utf8');
    
    // Broadcast deletion
    ioInstance?.to(channelKey).emit('chat-message-deleted', { channelKey, messageId });
  }
  res.json({ success: true });
});

app.get('/api/sync', (req, res) => {
  const key = req.query.key;
  const store = JSON.parse(fs.readFileSync(syncFile, 'utf8'));
  res.json({ value: store[key] || null });
});
app.post('/api/sync', (req, res) => {
  const { key, value } = req.body;
  const store = JSON.parse(fs.readFileSync(syncFile, 'utf8'));
  store[key] = value;
  fs.writeFileSync(syncFile, JSON.stringify(store, null, 2), 'utf8');
  res.json({ success: true });
});

app.get('/api/mail', (req, res) => {
  res.json({ emails: JSON.parse(fs.readFileSync(mailFile, 'utf8')) });
});
app.post('/api/mail', (req, res) => {
  const emails = JSON.parse(fs.readFileSync(mailFile, 'utf8'));
  
  // Try to update existing email by id, else push
  const index = emails.findIndex(m => m.id === req.body.id);
  if (index >= 0 && req.body.id) {
    emails[index] = { ...emails[index], ...req.body };
  } else {
    if (!req.body.id) req.body.id = Math.random().toString(36).substring(2, 15);
    emails.push(req.body);
  }
  
  fs.writeFileSync(mailFile, JSON.stringify(emails, null, 2), 'utf8');
  res.json({ success: true, id: req.body.id });
});

app.get('/api/meetings', (req, res) => {
  res.json({ meetings: JSON.parse(fs.readFileSync(meetingsFile, 'utf8')) });
});
app.post('/api/meetings', (req, res) => {
  const meetings = JSON.parse(fs.readFileSync(meetingsFile, 'utf8'));
  
  // Try to update existing meeting, otherwise push
  const index = meetings.findIndex(m => m.id === req.body.id);
  if (index >= 0) {
    meetings[index] = { ...meetings[index], ...req.body };
  } else {
    meetings.push(req.body);
  }
  
  fs.writeFileSync(meetingsFile, JSON.stringify(meetings, null, 2), 'utf8');
  res.json({ success: true });
});

app.get('/api/rooms', (req, res) => {
  res.json({ rooms: JSON.parse(fs.readFileSync(roomsFile, 'utf8')) });
});
app.post('/api/rooms', (req, res) => {
  const rooms = JSON.parse(fs.readFileSync(roomsFile, 'utf8'));
  rooms.push(req.body);
  fs.writeFileSync(roomsFile, JSON.stringify(rooms, null, 2), 'utf8');
  res.json({ success: true });
});

app.get('/api/system', (req, res) => {
  res.json({
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
    cpus: os.cpus().length,
    totalMem: Math.round(os.totalmem() / 1024 / 1024 / 1024) + ' GB',
    freeMem: Math.round(os.freemem() / 1024 / 1024 / 1024) + ' GB',
    uptime: Math.round(os.uptime() / 60) + ' minutes',
    userInfo: os.userInfo().username
  });
});

app.get('/api/browser', (req, res) => {
  res.json(JSON.parse(fs.readFileSync(browserFile, 'utf8')));
});
app.post('/api/browser', (req, res) => {
  fs.writeFileSync(browserFile, JSON.stringify(req.body, null, 2), 'utf8');
  res.json({ success: true });
});

app.get('/api/communities', (req, res) => {
  res.json(JSON.parse(fs.readFileSync(communitiesFile, 'utf8')));
});
app.post('/api/communities', (req, res) => {
  fs.writeFileSync(communitiesFile, JSON.stringify(req.body, null, 2), 'utf8');
  res.json({ success: true });
});

// ─── ARCADE GAMES PROXY ───
app.get('/api/games/freetogame', async (req, res) => {
  try {
    const response = await fetch('https://www.freetogame.com/api/games?platform=browser');
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

const server = http.createServer(app);
let ioInstance = null;

const PORT = process.env.PORT || 3001;

// ─── RECORDING STORAGE ───
const recordingsDir = path.join(__dirname, 'recordings');
if (!fs.existsSync(recordingsDir)) {
  fs.mkdirSync(recordingsDir);
}
app.use(express.json({ limit: '500mb' }));
app.use('/recordings', express.static(recordingsDir));

app.post('/api/upload-recording', (req, res) => {
  try {
    const { roomId, videoBase64 } = req.body;
    if (!roomId || !videoBase64) return res.status(400).json({ error: 'Missing data' });
    
    const base64Data = videoBase64.split(';base64,').pop();
    const filename = `${roomId}-${Date.now()}.webm`;
    const filepath = path.join(recordingsDir, filename);
    
    fs.writeFileSync(filepath, base64Data, { encoding: 'base64' });
    res.json({ url: `http://localhost:${PORT}/recordings/${filename}` });
  } catch (err) {
    console.error('Upload error', err);
    res.status(500).json({ error: 'Failed to upload' });
  }
});

// ─── THEME STORE & CUSTOM ASSETS ───
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

const themesFile = path.join(__dirname, 'themes.json');
if (!fs.existsSync(themesFile)) {
  fs.writeFileSync(themesFile, JSON.stringify([]), 'utf8');
}

app.post('/api/themes/upload', (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({ error: 'No files were uploaded.' });
  }

  const uploadedFile = req.files.asset;
  const filename = `${Date.now()}-${uploadedFile.name.replace(/\\s+/g, '-')}`;
  const uploadPath = path.join(uploadsDir, filename);

  uploadedFile.mv(uploadPath, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ url: `http://localhost:${PORT}/uploads/${filename}` });
  });
});

app.post('/api/themes/save', (req, res) => {
  try {
    const newTheme = req.body;
    const themes = JSON.parse(fs.readFileSync(themesFile, 'utf8'));
    newTheme.id = Date.now().toString();
    themes.push(newTheme);
    fs.writeFileSync(themesFile, JSON.stringify(themes, null, 2), 'utf8');
    res.json({ success: true, theme: newTheme });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/themes', (req, res) => {
  try {
    const themes = JSON.parse(fs.readFileSync(themesFile, 'utf8'));
    res.json({ themes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ECOSYSTEM SHARED PROFILE ───
const profilesFile = path.join(__dirname, 'profiles.json');
if (!fs.existsSync(profilesFile)) {
  fs.writeFileSync(profilesFile, JSON.stringify({}), 'utf8');
}

app.post('/api/profile/save', (req, res) => {
  const { uid, profileData } = req.body;
  if (!uid || !profileData) return res.status(400).json({ error: 'Missing uid or profileData' });
  try {
    const profiles = JSON.parse(fs.readFileSync(profilesFile, 'utf8'));
    profiles[uid] = { ...profiles[uid], ...profileData };
    fs.writeFileSync(profilesFile, JSON.stringify(profiles, null, 2), 'utf8');
    res.json({ success: true, profile: profiles[uid] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/profile', (req, res) => {
  const uid = req.query.uid;
  if (!uid) return res.status(400).json({ error: 'Missing uid parameter' });
  try {
    const profiles = JSON.parse(fs.readFileSync(profilesFile, 'utf8'));
    if (profiles[uid]) {
      res.json({ profile: profiles[uid] });
    } else {
      res.status(404).json({ error: 'Profile not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── TETHERED WORKSPACE FILE SYSTEM APIs ───
app.get('/api/fs/list', (req, res) => {
  const rootDir = path.resolve(__dirname, '../../'); // Resolve to e:\Projects\Project Pro
  
  function scan(dir) {
    const results = [];
    try {
      const list = fs.readdirSync(dir);
      list.forEach((file) => {
        // Filter node_modules, build caches, git, and custom gemini trackers for speed and security
        if (['node_modules', '.git', 'dist', '.gemini', 'package-lock.json', '.env.local'].includes(file)) return;
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          results.push({
            name: file,
            path: fullPath,
            isDir: true,
            children: scan(fullPath)
          });
        } else {
          results.push({
            name: file,
            path: fullPath,
            isDir: false,
            size: stat.size
          });
        }
      });
    } catch (e) {
      console.warn("Scan warning:", e.message);
    }
    return results;
  }

  res.json({ root: rootDir, files: scan(rootDir) });
});

app.get('/api/fs/read', (req, res) => {
  const filePath = req.query.path;
  if (!filePath) return res.status(400).json({ error: 'Missing file path parameter' });
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    res.json({ content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/fs/upload', (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({ error: 'No files were uploaded.' });
  }
  const targetDir = req.body.path || path.resolve(__dirname, '../../');
  const uploadedFile = req.files.file;
  const uploadPath = path.join(targetDir, uploadedFile.name);

  uploadedFile.mv(uploadPath, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, path: uploadPath });
  });
});

app.post('/api/fs/write', (req, res) => {
  const { path: filePath, content } = req.body;
  if (!filePath || content === undefined) return res.status(400).json({ error: 'Missing file path or content' });
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    res.json({ success: true });
    
    // Broadcast file change over websocket to synchronize all Keep/Dev workspaces in real time!
    io.emit('fs-change', { path: filePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const { exec } = require('child_process');
app.post('/api/fs/exec', (req, res) => {
  const { command, cwd } = req.body;
  if (!command) return res.status(400).json({ error: 'Missing command execution script' });
  
  const baseCwd = cwd || path.resolve(__dirname, '../../');
  
  exec(command, { cwd: baseCwd }, (err, stdout, stderr) => {
    res.json({
      success: !err,
      stdout,
      stderr,
      error: err ? err.message : null
    });
  });
});

// ─── CUSTOM GEMMA RENDERING ENGINE (BUILT FROM SCARATCH SERVER-SIDE HTML/CSS PARSER & LAYOUT SOLVER) ───
function parseHTMLToDOM(html) {
  const tagRegex = /<(\/?)([a-zA-Z0-9:-]+)([^>]*)>|([^<]+)/g;
  let match;
  const stack = [{ children: [] }];
  
  while ((match = tagRegex.exec(html)) !== null) {
    const [full, isClosing, tagName, attrsStr, textContent] = match;
    
    if (textContent && textContent.trim()) {
      const parent = stack[stack.length - 1];
      parent.children.push({
        type: 'text',
        content: textContent.trim()
      });
    } else if (tagName) {
      const lowercaseTag = tagName.toLowerCase();
      if (isClosing) {
        if (stack.length > 1 && stack[stack.length - 1].tagName === lowercaseTag) {
          const popped = stack.pop();
          const parent = stack[stack.length - 1];
          parent.children.push(popped);
        }
      } else {
        const attributes = {};
        if (attrsStr) {
          const attrRegex = /([a-zA-Z0-9:-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^>\s]+)))?/g;
          let attrMatch;
          while ((attrMatch = attrRegex.exec(attrsStr)) !== null) {
            attributes[attrMatch[1]] = attrMatch[2] || attrMatch[3] || attrMatch[4] || "";
          }
        }
        
        const isSelfClosing = full.endsWith('/>') || ['img', 'br', 'hr', 'input', 'meta', 'link'].includes(lowercaseTag);
        const node = {
          type: 'element',
          tagName: lowercaseTag,
          attributes,
          children: []
        };
        
        if (isSelfClosing) {
          const parent = stack[stack.length - 1];
          parent.children.push(node);
        } else {
          stack.push(node);
        }
      }
    }
  }
  
  while (stack.length > 1) {
    const popped = stack.pop();
    stack[stack.length - 1].children.push(popped);
  }
  
  return stack[0].children;
}

function compileDOMToLayout(dom, viewportWidth = 800, isGoogle = false) {
  const layoutElements = [];
  let currentX = 20;
  let currentY = 20;
  const paddingX = 20;
  const maxWidth = viewportWidth - paddingX * 2;
  
  function walk(node, parentStyles = {}) {
    if (!node) return;
    
    // Completely ignore invisible metadata, script, and style tags so they don't leak visible text nodes
    if (node.type === 'element') {
      const tag = node.tagName;
      if (['script', 'style', 'head', 'meta', 'link', 'title'].includes(tag)) {
        return;
      }
    }
    
    // Google Visual Override Layout Solver
    if (isGoogle) {
      if (node.type === 'element') {
        const tag = node.tagName;
        const attrs = node.attributes || {};
        
        // 1. Google Centered Logo
        if (tag === 'img' && (attrs.src && attrs.src.includes('googlelogo'))) {
          layoutElements.push({
            type: 'image',
            src: 'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png', // Explicitly use the gorgeous transparent colored logo
            alt: attrs.alt || 'Google Logo',
            x: 264, // Center a 272px wide image on an 800px viewport
            y: 100,
            width: 272,
            height: 92
          });
          return; // Skip walking children
        }
        
        // 2. Google Centered Search Input & Search Buttons
        if (tag === 'input' && (attrs.name === 'q' || attrs.type === 'text' || attrs.title === 'Search')) {
          layoutElements.push({
            type: 'input',
            value: attrs.value || "",
            placeholder: attrs.placeholder || "Search Google or type a URL",
            x: 180, // Center a 440px wide input on an 800px viewport
            y: 220,
            width: 440,
            height: 40,
            name: attrs.name || "q"
          });
          
          // Inject standard centered Google buttons right below the input!
          layoutElements.push({
            type: 'button',
            text: 'Google Search',
            x: 275,
            y: 275,
            width: 115,
            height: 34
          });
          layoutElements.push({
            type: 'button',
            text: "I'm Feeling Lucky",
            x: 405,
            y: 275,
            width: 130,
            height: 34
          });
          return;
        }
      }
      
      // 3. Top-Right Navigation Links & Button
      if (node.type === 'text' || (node.type === 'element' && node.tagName === 'a')) {
        const textContent = node.type === 'text' ? node.content : (node.children?.[0]?.content || '');
        const isLink = node.tagName === 'a' || parentStyles.isLink;
        const linkUrl = node.tagName === 'a' ? (node.attributes?.href || '#') : parentStyles.linkUrl;
        
        if (textContent && textContent.includes('Gmail')) {
          layoutElements.push({
            type: 'text',
            text: 'Gmail',
            x: 630,
            y: 30,
            width: 35,
            height: 14,
            fontSize: 13,
            color: '#3b82f6', // Light blue link color
            isLink: true,
            linkUrl
          });
          return;
        }
        if (textContent && textContent.includes('Images')) {
          layoutElements.push({
            type: 'text',
            text: 'Images',
            x: 680,
            y: 30,
            width: 45,
            height: 14,
            fontSize: 13,
            color: '#3b82f6',
            isLink: true,
            linkUrl
          });
          return;
        }
        if (textContent && (textContent.includes('Sign in') || textContent.includes('Sign In'))) {
          layoutElements.push({
            type: 'button',
            text: 'Sign in',
            x: 740,
            y: 16,
            width: 70,
            height: 28,
            isLink: true,
            linkUrl
          });
          return;
        }
        
        // 4. Horizontal Spaced-out Footer Links
        if (isLink && textContent && !['Gmail', 'Images', 'Sign in'].some(t => textContent.includes(t))) {
          if (currentY < 480) {
            currentY = 480;
            currentX = 40;
          }
          layoutElements.push({
            type: 'text',
            text: textContent,
            x: currentX,
            y: currentY,
            width: textContent.length * 7,
            height: 12,
            fontSize: 12,
            color: '#64748b', // Muted slate color
            isLink: true,
            linkUrl
          });
          currentX += textContent.length * 7 + 25; // Space out links horizontally
          return;
        }
      }
    }
    
    if (node.type === 'text') {
      const text = node.content;
      const fontSize = parentStyles.fontSize || 14;
      const color = parentStyles.color || '#e2e8f0'; // Default text color
      const isBold = parentStyles.isBold || false;
      const isItalic = parentStyles.isItalic || false;
      const isLink = parentStyles.isLink || false;
      const linkUrl = parentStyles.linkUrl || null;
      
      const charWidth = fontSize * 0.55;
      const words = text.split(/\s+/);
      
      words.forEach((word) => {
        const wordWidth = word.length * charWidth;
        if (currentX + wordWidth > maxWidth + paddingX) {
          currentX = paddingX;
          currentY += fontSize * 1.5;
        }
        
        layoutElements.push({
          type: 'text',
          text: word,
          x: currentX,
          y: currentY,
          width: wordWidth,
          height: fontSize,
          fontSize,
          color,
          isBold,
          isItalic,
          isLink,
          linkUrl
        });
        
        currentX += wordWidth + charWidth;
      });
      return;
    }
    
    if (node.type === 'element') {
      const tagName = node.tagName;
      const attributes = node.attributes || {};
      const inlineStyle = attributes.style || "";
      const computedStyles = { ...parentStyles };
      
      if (inlineStyle) {
        const styleRules = inlineStyle.split(';');
        styleRules.forEach((rule) => {
          const parts = rule.split(':');
          if (parts.length === 2) {
            const key = parts[0].trim().toLowerCase();
            const val = parts[1].trim().toLowerCase();
            if (key === 'color') computedStyles.color = val;
            if (key === 'font-size') {
              const num = parseInt(val);
              if (!isNaN(num)) computedStyles.fontSize = num;
            }
            if (key === 'font-weight' && (val === 'bold' || parseInt(val) >= 600)) computedStyles.isBold = true;
            if (key === 'font-style' && val === 'italic') computedStyles.isItalic = true;
          }
        });
      }
      
      let heightSpacing = 0;
      if (tagName === 'h1') {
        currentX = paddingX;
        currentY += 24;
        computedStyles.fontSize = 28;
        computedStyles.isBold = true;
        heightSpacing = 38;
      } else if (tagName === 'h2') {
        currentX = paddingX;
        currentY += 20;
        computedStyles.fontSize = 22;
        computedStyles.isBold = true;
        heightSpacing = 30;
      } else if (tagName === 'h3') {
        currentX = paddingX;
        currentY += 16;
        computedStyles.fontSize = 18;
        computedStyles.isBold = true;
        heightSpacing = 24;
      } else if (tagName === 'p') {
        currentX = paddingX;
        currentY += 12;
        computedStyles.fontSize = 14;
        heightSpacing = 20;
      } else if (tagName === 'div') {
        currentX = paddingX;
        currentY += 8;
        heightSpacing = 12;
      } else if (tagName === 'br') {
        currentX = paddingX;
        currentY += 20;
      } else if (tagName === 'hr') {
        currentX = paddingX;
        currentY += 15;
        layoutElements.push({
          type: 'line',
          x1: paddingX,
          y1: currentY,
          x2: viewportWidth - paddingX,
          y2: currentY,
          color: 'rgba(255, 255, 255, 0.08)'
        });
        currentY += 15;
      } else if (tagName === 'a') {
        computedStyles.isLink = true;
        computedStyles.linkUrl = attributes.href || '#';
        computedStyles.color = computedStyles.color || '#3b82f6'; // Blue link color
      } else if (tagName === 'img') {
        currentX = paddingX;
        currentY += 10;
        const imgW = parseInt(attributes.width) || 200;
        const imgH = parseInt(attributes.height) || 120;
        layoutElements.push({
          type: 'image',
          src: attributes.src || 'placeholder.png',
          alt: attributes.alt || 'Visual layout element',
          x: currentX,
          y: currentY,
          width: imgW,
          height: imgH
        });
        currentY += imgH + 10;
      } else if (tagName === 'input') {
        currentX = paddingX;
        currentY += 8;
        layoutElements.push({
          type: 'input',
          value: attributes.value || "",
          placeholder: attributes.placeholder || "Type here...",
          x: currentX,
          y: currentY,
          width: 250,
          height: 36,
          name: attributes.name || ""
        });
        currentY += 46;
      } else if (tagName === 'button') {
        computedStyles.isBold = true;
        layoutElements.push({
          type: 'button',
          text: attributes.type || 'Button',
          x: currentX,
          y: currentY,
          width: 80,
          height: 32
        });
      }
      
      if (node.children && node.children.length > 0) {
        node.children.forEach((child) => walk(child, computedStyles));
      }
      
      if (['h1', 'h2', 'h3', 'p', 'div'].includes(tagName)) {
        currentX = paddingX;
        currentY += heightSpacing;
      }
    }
  }
  
  if (Array.isArray(dom)) {
    dom.forEach((node) => walk(node));
  } else {
    walk(dom);
  }
  
  return {
    elements: layoutElements,
    canvasHeight: Math.max(currentY + 60, 600)
  };
}

app.get('/api/browser/render', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).json({ error: 'Missing url query parameter' });
  
  try {
    const response = await fetch(targetUrl);
    if (!response.ok) throw new Error(`Network response error: ${response.status}`);
    let html = await response.text();
    
    // Preprocess raw HTML to completely strip invisible blocks and comments.
    // This avoids tag-stack scrambling from '<' symbols inside inline javascript and stylesheets.
    html = html.replace(/<!--[\s\S]*?-->/g, ''); // Strip comments
    html = html.replace(/<!doctype\b[^>]*>/gi, ''); // Strip doctype
    html = html.replace(/<head\b[\s\S]*?<\/head>/gi, ''); // Strip head metadata block entirely
    html = html.replace(/<script\b[\s\S]*?<\/script>/gi, ''); // Strip script blocks
    html = html.replace(/<style\b[\s\S]*?<\/style>/gi, ''); // Strip style blocks
    html = html.replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ''); // Strip noscript blocks
    html = html.replace(/<iframe\b[\s\S]*?<\/iframe>/gi, ''); // Strip iframe blocks
    
    const isGoogle = targetUrl.includes('google.com');
    const dom = parseHTMLToDOM(html);
    const layout = compileDOMToLayout(dom, 800, isGoogle);
    
    res.json({
      url: targetUrl,
      dom: dom,
      layout: layout.elements,
      height: layout.canvasHeight
    });
  } catch (err) {
    console.error('[Browser Proxy] Render compilation failed:', err.message);
    
    // Fallback: Custom beautifully parsed error page constructed entirely from scratch
    const errorHTML = `
      <div style="padding: 20px;">
        <h1 style="color: #ef4444;">Ecosystem Browser Error 🛑</h1>
        <hr/>
        <p>Gemma Engine was unable to resolve the URL: <strong>${targetUrl}</strong></p>
        <p>Error Reason: <em>${err.message}</em></p>
        <br/>
        <h2>Suggestions:</h2>
        <ul>
          <li>Make sure the local server port is running.</li>
          <li>Check your internet connection status.</li>
          <li>Verify the address format (e.g. <code>http://localhost:5173</code>).</li>
        </ul>
      </div>
    `;
    const dom = parseHTMLToDOM(errorHTML);
    const layout = compileDOMToLayout(dom, 800);
    
    res.json({
      url: targetUrl,
      dom: dom,
      layout: layout.elements,
      height: layout.canvasHeight,
      error: err.message
    });
  }
});

// ─── AI MEETING SUMMARY ───
app.post('/api/generate-summary', async (req, res) => {
  try {
    const { roomId, durationSec, participantCount, chatLog = [] } = req.body;

    // Build a readable chat transcript from messages
    const transcript = chatLog.length > 0
      ? chatLog.map(m => `${m.sender}: ${m.text}`).join('\n')
      : '(No chat messages were recorded in this meeting.)';

    const durationMin = Math.round((durationSec || 0) / 60);

    // Graceful fallback placeholder when no API key is configured
    if (!GEMINI_API_KEY) {
      console.log('[AI] No GEMINI_API_KEY set — returning placeholder summary.');
      return res.json({
        summary: `**Meeting Summary**\n\nThis ${durationMin}-minute meeting had ${participantCount || 1} participant(s).\n\n**Key Points**\n• Meeting conducted via Pro secure P2P channel\n• ${chatLog.length} chat message(s) exchanged\n\n*Add your GEMINI_API_KEY to the backend .env file to enable real AI-powered summaries.*`
      });
    }

    const prompt = `You are an expert meeting secretary for a secure video conferencing platform called Pro.

Here is the data from a recently concluded meeting:
- Room ID: ${roomId}
- Duration: ${durationMin} minutes
- Number of participants: ${participantCount || 1}

Chat Transcript:
${transcript}

Please generate a concise, professional meeting summary in markdown format. Include:
1. A brief overview (2–3 sentences)
2. Key discussion points or topics covered
3. Any action items or decisions mentioned in the chat
4. A sentiment analysis (collaborative, productive, brief check-in, etc.)

Keep the summary under 200 words. If there was no meaningful chat, focus on the meeting metadata and note it was likely a voice/video-only discussion.`;

    const geminiRes = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 512, temperature: 0.4 }
      })
    });

    if (!geminiRes.ok) {
      throw new Error(`Gemini API error: ${geminiRes.status}`);
    }

    const geminiData = await geminiRes.json();
    const summary = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || 'Summary could not be generated.';

    res.json({ summary });
  } catch (err) {
    console.error('[AI] Summary generation failed:', err.message);
    res.json({ summary: 'AI summary unavailable for this meeting.' });
  }
});

const io = new Server(server, {
  cors: {
    origin: "*", // Allows any origin since we are developing locally
    methods: ["GET", "POST"]
  }
});
ioInstance = io;

// Basic room signaling
const rooms = {};
const lockedRooms = {};
const roomBlockers = {};
const roomHosts = {};

io.on('connection', (socket) => {
  console.log('🔗 Client connected:', socket.id);

  // ─── GRAND UNIFICATION: THE ECOSYSTEM EVENT BUS ───
  socket.on('ecosystem-broadcast', (data) => {
    // Expected data format: { sourceApp: 'Pro Chat', type: 'NEW_MESSAGE', payload: '...' }
    console.log(`[Event Bus] Broadcast from ${data.sourceApp}:`, data.type);
    // Push the event to all listeners (Pro Hub, etc.)
    io.emit('ecosystem-event', data);
  });

  // ─── GRAND UNIFICATION: AGENT ORCHESTRATION ───
  socket.on('agent-launch-app', (appId) => {
    console.log(`[Agent] Launching OS App: ${appId}`);
    io.emit('os-launch-app', appId);
  });

  // ─── GEMMA 4 TETHERED ECOSYSTEM AGENTIC SOCKET RELAYS ───
  socket.on('gemma-agent-task', (data) => {
    // Relay agent task status ( autopilot state, progress) to all workspace clients
    io.emit('gemma-agent-task-update', data);
  });

  socket.on('gemma-tool-call', (data) => {
    // Stream active agent tool executions (grep_search, read_file) in real time
    io.emit('gemma-tool-call-log', data);
  });

  socket.on('broadcast-chat-message', (data) => {
    // Broadcast text messages to all users in the specified chat room (Pro Chat integration)
    socket.to(data.roomId).emit('chat-message', data.message);
  });

  socket.on('gemma-file-change', (data) => {
    // Deliver dynamic visual code differences to the Pro Dev editor
    io.emit('gemma-file-diff', data);
  });

  socket.on('browser-input', (data) => {
    // Log coordinate interaction and sync the browser view frames
    console.log(`[Gemma Browser Core] Socket input relative offset (${data.x}, ${data.y}) on URL: ${data.url}`);
    io.emit('browser-frame-update', { url: data.url, x: data.x, y: data.y, type: data.type });
  });

  // ─── ARCADE MULTIPLAYER ───
  socket.on('arcade-join', () => {
    socket.join('arcade-lobby');
    const clients = io.sockets.adapter.rooms.get('arcade-lobby');
    if (clients && clients.size === 2) {
      const matchId = `match-${Date.now()}`;
      const arr = Array.from(clients);
      const p1 = arr[0];
      const p2 = arr[1];
      
      io.to(p1).emit('arcade-start', { matchId, role: 'host' });
      io.to(p2).emit('arcade-start', { matchId, role: 'guest' });
      
      io.sockets.sockets.get(p1).leave('arcade-lobby');
      io.sockets.sockets.get(p2).leave('arcade-lobby');
      
      io.sockets.sockets.get(p1).join(matchId);
      io.sockets.sockets.get(p2).join(matchId);
    }
  });

  socket.on('arcade-state', (data) => {
    // Host sends ball and paddle state, guest sends paddle state
    socket.to(data.matchId).emit('arcade-sync', data);
  });

  socket.on('join-room', (payload) => {
    // Backwards compatibility with old string format vs new object format
    const roomId = typeof payload === 'string' ? payload : payload.roomId;
    const blockRecording = typeof payload === 'object' ? payload.blockRecording : false;

    if (lockedRooms[roomId]) {
      console.log(`🔒 Rejecting ${socket.id} - Room ${roomId} is locked.`);
      socket.emit('room-locked');
      return; // Stop here, don't join
    }

    socket.join(roomId);
    if (!rooms[roomId]) {
      rooms[roomId] = [];
      roomHosts[roomId] = socket.id; // First user to join is the host
    }
    rooms[roomId].push(socket.id);

    if (blockRecording) {
      if (!roomBlockers[roomId]) roomBlockers[roomId] = new Set();
      roomBlockers[roomId].add(socket.id);
    }

    console.log(`📡 Player ${socket.id} joined room ${roomId}`);

    // Notify others in the room
    socket.to(roomId).emit('user-connected', socket.id);

    // Give the new user the list of existing users
    socket.emit('room-users', rooms[roomId].filter(id => id !== socket.id));

    // Broadcast current recording-blocked status to the whole room
    const isBlocked = roomBlockers[roomId] ? roomBlockers[roomId].size > 0 : false;
    io.to(roomId).emit('recording-blocked-status', isBlocked);

    // Broadcast host info
    io.to(roomId).emit('host-info', roomHosts[roomId]);
  });

  // Relay WebRTC signaling payload (offer, answer, ice-candidates)
  socket.on('signal', (payload) => {
    // payload: { userToSignal: targetId, callerID: socket.id, signal: data }
    io.to(payload.userToSignal).emit('signal', {
      signal: payload.signal,
      callerID: payload.callerID
    });
  });

  socket.on('lock-room', (roomId) => {
    // Make sure the requester is actually in the room!
    if (rooms[roomId] && rooms[roomId].includes(socket.id)) {
      lockedRooms[roomId] = true;
      io.to(roomId).emit('room-lock-status', true);
    }
  });

  socket.on('unlock-room', (roomId) => {
    if (rooms[roomId] && rooms[roomId].includes(socket.id)) {
      lockedRooms[roomId] = false;
      io.to(roomId).emit('room-lock-status', false);
    }
  });

  socket.on('host-kick-user', ({ roomId, targetId }) => {
    if (roomHosts[roomId] === socket.id) {
      console.log(`👢 Host ${socket.id} kicked user ${targetId} from room ${roomId}`);
      io.to(targetId).emit('kicked');
    }
  });

  socket.on('host-force-mute', ({ roomId, targetId }) => {
    if (roomHosts[roomId] === socket.id) {
      console.log(`🔇 Host ${socket.id} force-muted user ${targetId} in room ${roomId}`);
      io.to(targetId).emit('force-muted');
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
      
      // Remove from blockers explicitly and recalculate the lock status
      if (roomBlockers[roomId] && roomBlockers[roomId].has(socket.id)) {
        roomBlockers[roomId].delete(socket.id);
        const isBlocked = roomBlockers[roomId].size > 0;
        io.to(roomId).emit('recording-blocked-status', isBlocked);
      }

      socket.to(roomId).emit('user-disconnected', socket.id);
      if (rooms[roomId].length === 0) {
        delete rooms[roomId]; // Cleanup empty rooms
        delete lockedRooms[roomId]; // Cleanup lock state
        delete roomBlockers[roomId]; // Cleanup blocker memory entirely
        delete roomHosts[roomId]; // Cleanup host memory
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Pro Signaling Server running on port ${PORT}`);
});
