const { useState, useEffect, useRef } = React;

const App = () => {
  const [messages, setMessages] = useState([]);
  const [skills, setSkills] = useState([]);
  const [files, setFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [voices, setVoices] = useState([]);
  const [ttsEnabled, setTtsEnabled] = useState(() => {
    return localStorage.getItem("ttsEnabled") === "true";
  });
  const [selectedVoice, setSelectedVoice] = useState(
    localStorage.getItem("selectedVoice") || null,
  );
  const chatContainerRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("ttsEnabled", ttsEnabled);
  }, [ttsEnabled]);

  useEffect(() => {
    if (selectedVoice) {
      localStorage.setItem("selectedVoice", selectedVoice);
    } else {
      localStorage.removeItem("selectedVoice");
    }
  }, [selectedVoice]);

  const speak = (text) => {
    if (!ttsEnabled) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (selectedVoice) {
      const v = window.speechSynthesis
        .getVoices()
        .find((x) => x.name === selectedVoice);
      if (v) utterance.voice = v;
    }
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const s = await fetch("/api/web/skills").then((r) => r.json());
        if (s.skills)
          setSkills(
            s.skills.map((x) => ({
              text: x.name,
              desc: x.description,
              prefix: "/",
            })),
          );

        const f = await fetch("/api/web/files").then((r) => r.json());
        if (f.files)
          setFiles(
            f.files.map((x) => ({
              text: x,
              desc: "File in workspace",
              prefix: "@",
            })),
          );

        const m = await fetch("/api/web/messages").then((r) => r.json());
        if (m.ok && m.messages) {
          const mapped = m.messages
            .filter((msg) => msg.role !== "system")
            .map((msg, idx) => {
              const raw = msg.content || "";
              const tsMatch = raw.match(/^\[(\d{1,2}:\d{2}:\d{2} [AP]M)\]\s*(.*)/s);
              const timestamp = tsMatch ? tsMatch[1] : null;
              let content = tsMatch ? tsMatch[2] : raw;

              if (msg.role === "user") {
                content = content.replace(/^user:\s*/i, "");
                return {
                  id: `hist-${idx}`,
                  type: "user",
                  timestamp,
                  content,
                  html: typeof marked !== "undefined" ? marked.parse(content) : content,
                };
              }

              if (msg.role === "tool") {
                content = content.replace(/^Result\sfrom\s.*:\s*/i, "");
                return {
                  id: `hist-${idx}`,
                  type: "bot",
                  timestamp,
                  content: `🔧 **Tool Result:**\n\n${content}`,
                  html:
                    typeof marked !== "undefined"
                      ? marked.parse(`🔧 **Tool Result:**\n\n\`\`\`\n${content}\n\`\`\``)
                      : `Tool Result: ${content}`,
                };
              }

              if (msg.role === "assistant") {
                content = content.replace(/^(assistant|bot):\s*/i, "");
                const item = {
                  id: `hist-${idx}`,
                  type: "bot",
                  timestamp,
                  content,
                  html: content
                    ? typeof marked !== "undefined"
                      ? marked.parse(content)
                      : content
                    : "",
                };

                if (msg.tool_calls) {
                  item.toolIndicator = {
                    status: "Action completed",
                    toolCalls: msg.tool_calls.map((tc) => ({
                      tool: tc.function?.name || tc.tool,
                      args: tc.function?.arguments
                        ? typeof tc.function.arguments === "string"
                          ? JSON.parse(tc.function.arguments)
                          : tc.function.arguments
                        : tc.args,
                    })),
                  };
                }

                if (msg.reasoning && !msg.content) {
                  item.content = `> _${msg.reasoning}_`;
                  item.html =
                    typeof marked !== "undefined"
                      ? marked.parse(item.content)
                      : item.content;
                }

                return item;
              }
              return null;
            })
            .filter((msg) => msg !== null && (msg.content || msg.toolIndicator));
          setMessages(mapped);
        }
      } catch (e) {
        console.warn("Failed to load metadata/messages");
      }
    };
    fetchMetadata();

    // Voice management
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      setVoices(v.map((x) => x.name));
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, searchQuery]);

  const filteredMessages = messages.filter(
    (m) =>
      m.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.html?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleClearChat = async () => {
    if (!confirm("Are you sure you want to clear this chat session?")) return;
    try {
      await fetch("/api/web/messages", { method: "DELETE" });
      setMessages([]);
    } catch (e) {
      console.error("Failed to clear chat");
    }
  };

  const handleSend = async (text) => {
    const now = () =>
      new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });

    const userMsg = {
      type: "user",
      content: text,
      id: Date.now(),
      timestamp: now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    const botMsgId = Date.now() + 1;
    const botMsg = {
      type: "bot",
      content: "",
      html: '<div class="flex gap-1 items-center h-5"><div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div><div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div><div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div></div>',
      id: botMsgId,
      loading: true,
      timestamp: now(),
    };
    setMessages((prev) => [...prev, botMsg]);

    try {
      const res = await fetch("/api/web/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, session: "web" }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let currentBotMsg = {
        ...botMsg,
        content: "",
        html: "",
        loading: false,
        toolIndicator: null,
      };
      let fullText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunks = decoder.decode(value, { stream: true }).split("\n");
        for (const chunk of chunks) {
          if (!chunk.trim()) continue;
          try {
            const data = JSON.parse(chunk);
            if (data.type === "tool_start") {
              currentBotMsg.toolIndicator = {
                status: "Using tools...",
                toolCalls: data.toolCalls,
              };
              setMessages((prev) =>
                prev.map((m) => (m.id === botMsgId ? { ...currentBotMsg } : m)),
              );
            } else if (data.type === "reply") {
              if (currentBotMsg.toolIndicator) {
                currentBotMsg.toolIndicator.status = "Action completed";
              }
              fullText += data.text;
              currentBotMsg.content = fullText;
              currentBotMsg.html =
                typeof marked !== "undefined"
                  ? marked.parse(currentBotMsg.content)
                  : data.html || currentBotMsg.content;
              setMessages((prev) =>
                prev.map((m) => (m.id === botMsgId ? { ...currentBotMsg } : m)),
              );
            } else if (data.type === "error") {
              currentBotMsg.html = `<p class="text-red-500">Error: ${data.message}</p>`;
              setMessages((prev) =>
                prev.map((m) => (m.id === botMsgId ? { ...currentBotMsg } : m)),
              );
            }
          } catch (e) {}
        }
      }
      if (fullText) speak(fullText);
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId
            ? {
                ...m,
                html: '<p class="text-red-500">Connection error.</p>',
                loading: false,
              }
            : m,
        ),
      );
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <window.ChatHeader
        onSearch={setSearchQuery}
        ttsEnabled={ttsEnabled}
        setTtsEnabled={setTtsEnabled}
        voices={voices}
        selectedVoice={selectedVoice}
        setSelectedVoice={setSelectedVoice}
        onClearHistory={handleClearChat}
      />
      <main
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-8 space-y-8 scroll-smooth scrollbar-hide"
      >
        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-40 select-none animate-pulse">
            <div className="w-16 h-16 rounded-3xl bg-gray-100 flex items-center justify-center mb-4">
              <i className="fa-solid fa-ghost text-2xl text-gray-400"></i>
            </div>
            <p className="text-sm font-medium text-gray-400">
              {searchQuery
                ? "No matches found."
                : "No messages yet. Start a conversation."}
            </p>
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <window.ChatMessage key={msg.id} {...msg} />
          ))
        )}
      </main>
      <window.ChatInput onSend={handleSend} skills={skills} files={files} />
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
