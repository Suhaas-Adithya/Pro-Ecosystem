require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || null;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const app = express();
app.use(cors());

const server = http.createServer(app);

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

function compileDOMToLayout(dom, viewportWidth = 800) {
  const layoutElements = [];
  let currentX = 20;
  let currentY = 20;
  const paddingX = 20;
  const maxWidth = viewportWidth - paddingX * 2;
  
  function walk(node, parentStyles = {}) {
    if (!node) return;
    
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
    const html = await response.text();
    
    const dom = parseHTMLToDOM(html);
    const layout = compileDOMToLayout(dom, 800);
    
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

// Basic room signaling
const rooms = {};
const lockedRooms = {};
const roomBlockers = {};
const roomHosts = {};

io.on('connection', (socket) => {
  console.log('🔗 Client connected:', socket.id);

  // ─── GEMMA 4 TETHERED ECOSYSTEM AGENTIC SOCKET RELAYS ───
  socket.on('gemma-agent-task', (data) => {
    // Relay agent task status ( autopilot state, progress) to all workspace clients
    io.emit('gemma-agent-task-update', data);
  });

  socket.on('gemma-tool-call', (data) => {
    // Stream active agent tool executions (grep_search, read_file) in real time
    io.emit('gemma-tool-call-log', data);
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
