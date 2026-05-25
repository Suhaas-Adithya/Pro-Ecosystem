import React, { useState, useRef, useEffect } from 'react';

export default function OpenSourceHub() {
  const [messages, setMessages] = useState([
    {
      sender: 'Gemma 4 Core',
      text: '✦ Welcome, developer! I am the Gemma 4 Agentic Core. Ask me anything about the browser engine specs, local event loops, or how to write and compile your own custom Extensions under our PNCPL-1.0 license!',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = {
      sender: 'You',
      text: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate Gemma 4 agentic developer core response
    setTimeout(() => {
      let aiResponseText = "";
      const textLower = userMsg.text.toLowerCase();

      if (textLower.includes('license') || textLower.includes('pncpl')) {
        aiResponseText = `### Pro Suite Non-Commercial Public License (PNCPL-1.0)
Our license is designed for **Fair Code and Shared Sovereignty**:
1. **Source Accessibility**: All users can inspect, fork, host locally, and edit 100% of our code base.
2. **Extensions Freedom**: Anyone can write and publish extensions for Keep, Mail, or Browser to the Pro Store.
3. **No Commercial Exploitation**: Derivative works, compiled packs, or core clones **MUST NOT** be sold, distributed commercially, or used to generate financial profit. It protects open-source developers from corporate copy-pasting.`;
      } else if (textLower.includes('parser') || textLower.includes('engine') || textLower.includes('html')) {
        aiResponseText = `### Gemma 4 Custom Rendering Engine Pipeline
Our engine is completely Chromium-free and runs entirely in 100% client JS and local canvas:
1. **Lexer (\`parseHTMLToDOM\` in GemmaEngine.js)**: Reads string buffers character-by-character, stepping tags through stack-based state machines to build a JSON Document Object Model tree.
2. **Style Solver**: Merges inline and CSS rules, resolves parental cascades, and calculates SPECIFICITY weights.
3. **Layout Resolver (\`compileDOMToLayout\`)**: Steps the DOM and positions blocks vertically and inline spans horizontally into absolute pixel grids.
4. **Canvas Painter (\`paintLayoutToCanvas\`)**: Iterates positions and paints them natively using standard HTML5 Canvas 2D contexts!`;
      } else if (textLower.includes('extension') || textLower.includes('plugin') || textLower.includes('api')) {
        aiResponseText = `### Gemma Extension Lifecycle API
To build a plugin, write a standard script hooking into these visual pipeline events:
- **\`onBeforeRequest(details)\`**: Intercepts background URLs to block ads or trackers.
- **\`onDOMParsed(dom)\`**: Intercepts the raw JSON DOM tree to inject element nodes programmatically.
- **\`onPaint(ctx)\`**: Accesses the raw canvas drawing context to overlay custom layouts, grids, or CSS neon borders.

Save your plugin as a JSON bundle and upload it in the Developer Console of the **Pro Store (pro://store)** to register it instantly in browser runtimes!`;
      } else {
        aiResponseText = `✦ **Gemma 4 Developer Core Active**

I can guide you on three primary topics. Try asking me:
1. *"How does the licensing (PNCPL-1.0) work?"*
2. *"Explain the HTML state-machine parser and canvas painter loop."*
3. *"Show me how to build an extension using the onPaint and onDOMParsed hooks."*

Our open-source engine is designed to prove that developers don't have to surrender their code bases to Chromium standard structures. Let's build together!`;
      }

      setMessages(prev => [...prev, {
        sender: 'Gemma 4 Core',
        text: aiResponseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRich: true
      }]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="opensource-hub animate-slide-up">
      {/* Title Header */}
      <div className="hub-header">
        <h2>pro://engine ✦ Contributor Center</h2>
        <p>Explore our micro-rendering specs and contribute to the Chromium-free open source initiative.</p>
      </div>

      <div className="hub-grid">
        {/* Left Side: License & Spec Details */}
        <div className="hub-left-column">
          {/* License Spec */}
          <div className="glass-card info-card">
            <div className="card-badge">PNCPL-1.0 APPROVED</div>
            <h3>Pro Non-Commercial License</h3>
            <p className="description">
              The <strong>Pro Non-Commercial Public License 1.0</strong> allows public code auditing, forking, and plugin creation while strictly prohibiting commercial profit.
            </p>
            <div className="license-points">
              <div className="point"><span className="icon">✓</span> <span>Read, edit, and locally host 100% of our code base.</span></div>
              <div className="point"><span className="icon">✓</span> <span>Create and publish add-ons in the Pro Extension Store.</span></div>
              <div className="point"><span className="icon border-red">✗</span> <span className="text-red">Selling compiled binaries or running commercial cloud forks for profit is strictly forbidden.</span></div>
            </div>
          </div>

          {/* Engine Specs */}
          <div className="glass-card info-card">
            <h3>Gemma Rendering Pipeline</h3>
            <div className="pipeline-steps">
              <div className="step">
                <span className="step-num">1</span>
                <div>
                  <strong>HTML Lexing Parser</strong>
                  <p>Resolves raw markup character streams into hierarchical JSON DOM AST nodes recursively.</p>
                </div>
              </div>
              <div className="step">
                <span className="step-num">2</span>
                <div>
                  <strong>CSS Cascade Solver</strong>
                  <p>Builds the CSSOM, calculates rules inheritance, and determines selector specificity bounds.</p>
                </div>
              </div>
              <div className="step">
                <span className="step-num">3</span>
                <div>
                  <strong>Visual Canvas Painter</strong>
                  <p>Walks the absolute layout grid to paint element background shapes, images, inputs, and fonts natively on canvas.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Chatbot Console */}
        <div className="glass-card chat-card">
          <div className="chat-header-bar">
            <span className="status-indicator animate-pulse" />
            <div>
              <h4>Gemma 4 Developer Core</h4>
              <p>Next-Gen Agentic Intelligence</p>
            </div>
          </div>

          <div className="chat-messages-container">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-bubble-row ${msg.sender === 'You' ? 'user' : 'ai'}`}>
                <div className="chat-avatar">{msg.sender === 'You' ? '👤' : '🧠'}</div>
                <div className="chat-bubble-content">
                  <div className="bubble-meta">
                    <strong>{msg.sender}</strong>
                    <span className="time">{msg.time}</span>
                  </div>
                  {msg.isRich ? (
                    <div className="markdown-body" dangerouslySetInnerHTML={{ __html: msg.text
                      .replace(/### (.*)/g, '<h5>$1</h5>')
                      .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
                      .replace(/- \*\*(.*)\*\*/g, '• <strong>$1</strong>')
                      .replace(/`([^`]+)`/g, '<code>$1</code>')
                      .replace(/\n/g, '<br/>')
                    }} />
                  ) : (
                    <p className="bubble-text">{msg.text}</p>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="chat-bubble-row ai typing">
                <div className="chat-avatar">🧠</div>
                <div className="chat-bubble-content">
                  <p className="bubble-text text-muted">Gemma 4 is formulating codebase response...</p>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="chat-input-row">
            <input
              type="text"
              placeholder="Ask about parsers, licenses, or extension hooks..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="input-field chat-input"
            />
            <button type="submit" className="btn btn-primary chat-send-btn">
              Send ✦
            </button>
          </form>
        </div>
      </div>

      <style>{`
        .opensource-hub {
          max-width: 1000px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .hub-header h2 {
          font-size: 1.8rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, #fff 40%, var(--accent-color));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hub-header p {
          color: var(--text-secondary);
          font-size: 0.9rem;
          margin-top: 0.2rem;
        }

        .hub-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 2rem;
          align-items: start;
        }

        @media (max-width: 900px) {
          .hub-grid {
            grid-template-columns: 1fr;
          }
        }

        .hub-left-column {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .info-card {
          position: relative;
        }

        .card-badge {
          position: absolute;
          top: 1.25rem;
          right: 1.25rem;
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--success-color);
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
        }

        .info-card h3 {
          font-size: 1.15rem;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }

        .info-card .description {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 1rem;
        }

        .license-points {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .point {
          display: flex;
          align-items: flex-start;
          gap: 0.6rem;
          font-size: 0.82rem;
          line-height: 1.4;
          color: var(--text-secondary);
        }

        .point .icon {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(16, 185, 129, 0.15);
          color: var(--success-color);
          font-weight: 700;
          font-size: 0.65rem;
          flex-shrink: 0;
        }

        .point .icon.border-red {
          background: rgba(239, 68, 68, 0.15);
          color: var(--danger-color);
        }

        .text-red {
          color: #fca5a5;
        }

        .pipeline-steps {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 0.5rem;
        }

        .step {
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
        }

        .step-num {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--bg-tertiary);
          border: 1px solid var(--glass-border);
          color: var(--accent-color);
          font-weight: 700;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .step strong {
          display: block;
          font-size: 0.85rem;
          color: var(--text-primary);
        }

        .step p {
          font-size: 0.75rem;
          color: var(--text-secondary);
          line-height: 1.4;
          margin-top: 0.1rem;
        }

        /* Chat card structures */
        .chat-card {
          display: flex;
          flex-direction: column;
          height: 520px;
          padding: 0;
          overflow: hidden;
        }

        .chat-header-bar {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid var(--glass-border);
        }

        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 8px #22c55e;
        }

        .chat-header-bar h4 {
          font-size: 0.95rem;
          font-weight: 700;
        }

        .chat-header-bar p {
          font-size: 0.7rem;
          color: var(--text-secondary);
        }

        .chat-messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .chat-bubble-row {
          display: flex;
          gap: 0.75rem;
          max-width: 85%;
        }

        .chat-bubble-row.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .chat-bubble-row.ai {
          align-self: flex-start;
        }

        .chat-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--bg-tertiary);
          border: 1px solid var(--glass-border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
          flex-shrink: 0;
        }

        .chat-bubble-row.user .chat-avatar {
          background: var(--accent-glow);
          border-color: rgba(139, 92, 246, 0.3);
        }

        .chat-bubble-content {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .bubble-meta {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.75rem;
        }

        .chat-bubble-row.user .bubble-meta {
          flex-direction: row-reverse;
        }

        .bubble-meta strong {
          color: var(--text-primary);
        }

        .bubble-meta .time {
          color: var(--text-muted);
        }

        .bubble-text, .markdown-body {
          padding: 0.65rem 0.85rem;
          border-radius: 12px;
          font-size: 0.85rem;
          line-height: 1.5;
          word-break: break-word;
        }

        .chat-bubble-row.user .bubble-text {
          background: var(--accent-color);
          color: #ffffff;
          border-top-right-radius: 2px;
          box-shadow: 0 4px 10px var(--accent-glow);
        }

        .chat-bubble-row.ai .bubble-text, .chat-bubble-row.ai .markdown-body {
          background: var(--bg-tertiary);
          border: 1px solid var(--glass-border);
          color: var(--text-primary);
          border-top-left-radius: 2px;
        }

        .markdown-body h5 {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--accent-color);
          margin-top: 0.5rem;
          margin-bottom: 0.25rem;
        }

        .markdown-body h5:first-child {
          margin-top: 0;
        }

        .markdown-body code {
          background: rgba(255, 255, 255, 0.08);
          padding: 0.1rem 0.3rem;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.75rem;
        }

        .chat-input-row {
          display: flex;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          background: rgba(255, 255, 255, 0.01);
          border-top: 1px solid var(--glass-border);
        }

        .chat-input {
          flex: 1;
          font-size: 0.85rem;
        }

        .chat-send-btn {
          white-space: nowrap;
          padding: 0.5rem 1.25rem;
          font-size: 0.85rem;
        }
      `}</style>
    </div>
  );
}
