(function () {
  if (window.__RETRIEVER_WIDGET_LOADED__) return;
  window.__RETRIEVER_WIDGET_LOADED__ = true;

  // Find the script tag invoking widget.js to read data attributes
  const currentScript =
    document.currentScript ||
    Array.from(document.querySelectorAll("script")).find((s) =>
      s.src && s.src.includes("widget.js")
    );

  const tenantId = currentScript ? currentScript.getAttribute("data-tenant") || "00000000-0000-0000-0000-000000000000" : "00000000-0000-0000-0000-000000000000";
  const apiKey = currentScript ? currentScript.getAttribute("data-key") || "" : "";
  const apiUrl = (currentScript ? currentScript.getAttribute("data-api") || "https://rag.prateeq.in" : "https://rag.prateeq.in").replace(/\/$/, "");
  const primaryColor = currentScript ? currentScript.getAttribute("data-color") || "#2563eb" : "#2563eb";
  const title = currentScript ? currentScript.getAttribute("data-title") || "AI Support Assistant" : "AI Support Assistant";
  const position = currentScript ? currentScript.getAttribute("data-position") || "bottom-right" : "bottom-right";

  let sessionId = null;
  let isSending = false;

  // Host container
  const host = document.createElement("div");
  host.id = "retriever-widget-host";
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });

  const isLeft = position === "bottom-left";
  const posCss = isLeft ? "left: 20px;" : "right: 20px;";

  const style = document.createElement("style");
  style.textContent = `
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    
    .widget-container {
      position: fixed;
      bottom: 20px;
      ${posCss}
      z-index: 999999;
      display: flex;
      flex-direction: column;
      align-items: ${isLeft ? "flex-start" : "flex-end"};
    }

    .launcher-btn {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: ${primaryColor};
      color: #ffffff;
      border: none;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .launcher-btn:hover {
      transform: scale(1.06);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
    }
    .launcher-btn svg {
      width: 26px;
      height: 26px;
      fill: currentColor;
    }

    .chat-box {
      width: 380px;
      height: 520px;
      max-width: calc(100vw - 32px);
      max-height: calc(100vh - 100px);
      background: #0f172a;
      color: #f8fafc;
      border: 1px solid #334155;
      border-radius: 16px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
      display: none;
      flex-direction: column;
      overflow: hidden;
      margin-bottom: 12px;
      transition: opacity 0.2s ease, transform 0.2s ease;
    }
    .chat-box.open {
      display: flex;
    }

    .chat-header {
      background: #1e293b;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #334155;
    }
    .chat-header-title {
      font-size: 15px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .chat-header-badge {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #22c55e;
      box-shadow: 0 0 8px #22c55e;
    }
    .close-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 20px;
      line-height: 1;
    }
    .close-btn:hover { color: #f8fafc; }

    .chat-body {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #0f172a;
    }

    .message {
      max-width: 85%;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 13.5px;
      line-height: 1.45;
      word-break: break-word;
    }
    .message.user {
      align-self: flex-end;
      background: ${primaryColor};
      color: #ffffff;
      border-bottom-right-radius: 2px;
    }
    .message.assistant {
      align-self: flex-start;
      background: #1e293b;
      color: #e2e8f0;
      border: 1px solid #334155;
      border-bottom-left-radius: 2px;
    }
    .message.system-error {
      align-self: center;
      background: #451a1a;
      color: #f87171;
      border: 1px solid #7f1d1d;
      font-size: 12px;
    }

    .chat-footer {
      padding: 12px;
      background: #1e293b;
      border-top: 1px solid #334155;
      display: flex;
      gap: 8px;
    }
    .chat-input {
      flex: 1;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 10px 12px;
      color: #f8fafc;
      font-size: 13.5px;
      outline: none;
    }
    .chat-input:focus { border-color: ${primaryColor}; }
    
    .send-btn {
      background: ${primaryColor};
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 0 14px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
    }
    .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .branding {
      text-align: center;
      font-size: 10px;
      color: #64748b;
      padding: 4px 0 8px;
      background: #1e293b;
    }
    .branding a { color: #94a3b8; text-decoration: none; font-weight: 500; }
    .branding a:hover { text-decoration: underline; }
  `;

  const container = document.createElement("div");
  container.className = "widget-container";

  container.innerHTML = `
    <div class="chat-box" id="chat-box">
      <div class="chat-header">
        <div class="chat-header-title">
          <span class="chat-header-badge"></span>
          <span>${title}</span>
        </div>
        <button class="close-btn" id="close-btn">&times;</button>
      </div>
      <div class="chat-body" id="chat-body">
        <div class="message assistant">
          Hello! How can I assist you with information from our knowledge base today?
        </div>
      </div>
      <div class="chat-footer">
        <input type="text" class="chat-input" id="chat-input" placeholder="Type a message..." />
        <button class="send-btn" id="send-btn">Send</button>
      </div>
      <div class="branding">
        Powered by <a href="https://prateeq.in/rag" target="_blank" rel="noopener">Retriever AI</a>
      </div>
    </div>
    <button class="launcher-btn" id="launcher-btn" title="Open AI Chat">
      <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
    </button>
  `;

  shadow.appendChild(style);
  shadow.appendChild(container);

  const launcherBtn = shadow.getElementById("launcher-btn");
  const chatBox = shadow.getElementById("chat-box");
  const closeBtn = shadow.getElementById("close-btn");
  const chatBody = shadow.getElementById("chat-body");
  const chatInput = shadow.getElementById("chat-input");
  const sendBtn = shadow.getElementById("send-btn");

  const toggleChat = () => {
    chatBox.classList.toggle("open");
    if (chatBox.classList.contains("open")) {
      chatInput.focus();
      if (!sessionId) initSession();
    }
  };

  launcherBtn.addEventListener("click", toggleChat);
  closeBtn.addEventListener("click", toggleChat);

  async function initSession() {
    try {
      const headers = {
        "Content-Type": "application/json",
        "X-User-ID": "00000000-0000-0000-0000-000000000001",
      };
      if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

      const res = await fetch(`${apiUrl}/v1/tenants/${tenantId}/chat/sessions`, {
        method: "POST",
        headers,
        body: JSON.stringify({ user_id: "00000000-0000-0000-0000-000000000001" }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      sessionId = data.sessionId || data.session_id;
    } catch (err) {
      console.error("[Retriever Widget] Session Init Error:", err);
    }
  }

  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text || isSending) return;

    chatInput.value = "";
    isSending = true;
    sendBtn.disabled = true;

    // Append user message
    const userMsg = document.createElement("div");
    userMsg.className = "message user";
    userMsg.textContent = text;
    chatBody.appendChild(userMsg);

    // Append assistant placeholder
    const botMsg = document.createElement("div");
    botMsg.className = "message assistant";
    botMsg.textContent = "Thinking...";
    chatBody.appendChild(botMsg);
    chatBody.scrollTop = chatBody.scrollHeight;

    try {
      if (!sessionId) await initSession();

      const headers = {
        "Content-Type": "application/json",
        "X-User-ID": "00000000-0000-0000-0000-000000000001",
      };
      if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

      const res = await fetch(
        `${apiUrl}/v1/tenants/${tenantId}/chat/sessions/${sessionId}/messages`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ query: text, stream: true }),
        }
      );

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      botMsg.textContent = "";
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const rawData = line.slice(6).trim();
            if (rawData === "[DONE]") break;
            try {
              const parsed = JSON.parse(rawData);
              if (parsed.delta) {
                botMsg.textContent += parsed.delta;
                chatBody.scrollTop = chatBody.scrollHeight;
              }
            } catch (_) {}
          }
        }
      }

      if (!botMsg.textContent) {
        botMsg.textContent = "Response complete.";
      }
    } catch (err) {
      console.error("[Retriever Widget] Send Error:", err);
      botMsg.className = "message system-error";
      botMsg.textContent = `Error: ${err.message || "Failed to reach AI service."}`;
    } finally {
      isSending = false;
      sendBtn.disabled = false;
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  }

  sendBtn.addEventListener("click", sendMessage);
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });
})();
