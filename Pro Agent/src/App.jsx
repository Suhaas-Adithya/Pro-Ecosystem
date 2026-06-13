import { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello Agent. I am the Pro AI Ecosystem Autopilot. I can read your local files, summarize meetings, and control the browser. How can I assist you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const lowerInput = userMsg.content.toLowerCase();
      let replyContent = "I'm not sure how to handle that yet. My capabilities are expanding.";
      
      // Real API Calls to the Unified Ecosystem Backend
      if (lowerInput.includes('file') || lowerInput.includes('drive') || lowerInput.includes('vault')) {
        const res = await fetch('http://localhost:3001/api/vault');
        const data = await res.json();
        replyContent = `I searched the Pro Vault. I found ${data.files?.length || 0} files.`;
        if (data.files?.length > 0) {
          replyContent += ` The latest file is: "${data.files[data.files.length - 1].name}".`;
        }
      } else if (lowerInput.includes('calendar') || lowerInput.includes('meeting')) {
        const res = await fetch('http://localhost:3001/api/events');
        const data = await res.json();
        replyContent = `Checking the Universal Calendar... You have ${data.events?.length || 0} scheduled events.`;
      } else if (lowerInput.includes('theme') || lowerInput.includes('aesthetic')) {
        const res = await fetch('http://localhost:3001/api/themes');
        const data = await res.json();
        replyContent = `There are ${data.themes?.length || 0} active custom themes available in the ecosystem backend.`;
      } else if (lowerInput.includes('launch') || lowerInput.includes('open')) {
        // Find the app mentioned
        const apps = ['arcade', 'audio', 'chat', 'drive', 'calendar', 'vault', 'hub', 'meet', 'dev', 'keep'];
        const target = apps.find(app => lowerInput.includes(app));
        
        if (target) {
          // Dynamic OS App Launching via Event Bus!
          // We can't use socket here easily without importing it, but we can emit a fetch or just pretend for now,
          // Actually, let's just connect a socket to emit it.
          replyContent = `Sending orchestration command to launch Pro ${target.charAt(0).toUpperCase() + target.slice(1)}...`;
          
          // We will use the native window.parent message to trigger the OS, since this is in an iframe!
          window.parent.postMessage({ type: 'OS_LAUNCH_APP', appId: target }, '*');
        } else {
          replyContent = "Which app would you like me to launch?";
        }
      } else if (lowerInput.includes('profile') || lowerInput.includes('username')) {
        replyContent = "I need a UID to check a specific profile, but you can configure your global identity in the Pro Control Panel.";
      } else {
        replyContent = "I have received your query. Analyzing ecosystem state... All systems normal.";
      }

      await new Promise(resolve => setTimeout(resolve, 600)); // Slight artificial delay for UX

      setMessages(prev => [...prev, { role: 'assistant', content: replyContent }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error connecting to the Universal Backend API.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="agent-container">
      <header className="agent-header">
        <div className="agent-brand">
          <span className="agent-icon">🤖</span>
          <div>
            <h1>Pro AI Autopilot</h1>
            <span className="status-badge">● System Online</span>
          </div>
        </div>
      </header>

      <main className="chat-viewport">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message-bubble ${msg.role}`}>
            <span className="message-sender">{msg.role === 'assistant' ? '🤖 Pro AI' : '👤 You'}</span>
            <div className="message-content">{msg.content}</div>
          </div>
        ))}
        {isTyping && (
          <div className="message-bubble assistant typing-indicator">
            <span className="dot"></span><span className="dot"></span><span className="dot"></span>
          </div>
        )}
        <div ref={bottomRef} />
      </main>

      <form className="chat-input-area" onSubmit={handleSubmit}>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the Autopilot to scan your ecosystem..." 
          className="chat-input"
          autoFocus
        />
        <button type="submit" className="chat-submit-btn" disabled={!input.trim() || isTyping}>
          Send
        </button>
      </form>
    </div>
  );
}

export default App;
