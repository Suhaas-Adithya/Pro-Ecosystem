# Pro Ecosystem

The Pro Ecosystem is an open-source, comprehensive suite of interconnected productivity applications built on top of a unified Electron desktop launcher and Vite/React frontends. 

The ecosystem features a stunning "Zen" glass-morphic UI, real-time sync, and offline-first capabilities.

## 🚀 Apps Included
- **Pro Launcher**: The central grid hub to launch all apps.
- **Pro Browser**: A private, distraction-free browser with split-view and focus tools.
- **Pro Keep**: Advanced note-taking and reminders.
- **Pro Mail**: Unified communications.
- **Pro Chat**: Real-time team messaging.
- **Pro Meet**: Video conferencing and screen sharing.
- **Pro Drive**: File management.
- *...and many more!*

## 📦 Installation & Setup
This project uses **npm workspaces** to manage dependencies across all 15+ sub-applications simultaneously.

### 1. Install Dependencies
Make sure you have Node.js v18+ installed. From the root directory, run:
```bash
npm install
```

### 2. Run the Development Servers
To boot up the background API servers and all Vite dev servers, run:
```bash
npm run dev
```

### 3. Launch the Desktop App
In a separate terminal, start the Electron Desktop Launcher:
```bash
npm start
```

## 🛠️ Building for Production
To compile the desktop application into a standalone installer (`.exe` or `.dmg`):
```bash
# Build for Windows
npm run dist:win

# Build for Mac
npm run dist:mac
```

## 📜 License
This project is dual-licensed under the **GPLv3 License** with an explicit **Non-Commercial Restriction**. You are free to view, fork, and modify the source code for personal use, but you may not sell the software or host it as a commercial service.
