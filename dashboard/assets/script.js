const { useState, useEffect, useRef } = React;

const App = () => {
  const [messages, setMessages] = useState([]);
  const [skills, setSkills] = useState([]);
  const [files, setFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const chatContainerRef = useRef(null);

  const speak = (text) => {
    if (!ttsEnabled) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const s = await fetch('/api/web/skills').then(r => r.json());
        if (s.skills) setSkills(s.skills.map(x => ({ text: x.name, desc: x.description, prefix: '/' })));
        const f = await fetch('/api/web/files').then(r => r.json());
        if (f.files) setFiles(f.files.map(x => ({ text: x, desc: 'File in workspace', prefix: '@' })));
      } catch (e) {
        console.warn("Failed to load skills/files");
      }
    };
    fetchMetadata();
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, searchQuery]);

  const filteredMessages = messages.filter(m => 
    m.content?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.html?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSend = async (text) => {
    const userMsg = { type: 'user', content: text, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);

    const botMsgId = Date.now() + 1;
    const botMsg = { 
      type: 'bot', 
      content: '', 
      html: '<div class="flex gap-1 items-center h-5"><div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div><div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div><div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div></div>',
      id: botMsgId,
      loading: true
    };
    setMessages(prev => [...prev, botMsg]);

    try {
      const res = await fetch('/api/web/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, session: 'web' })
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      
      let currentBotMsg = { ...botMsg, content: '', html: '', loading: false, toolIndicator: null };
      let fullText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunks = decoder.decode(value, { stream: true }).split('\n');
        for (const chunk of chunks) {
          if (!chunk.trim()) continue;
          try {
            const data = JSON.parse(chunk);
            if (data.type === 'tool_start') {
              currentBotMsg.toolIndicator = {
                status: 'Using tools...',
                toolCalls: data.toolCalls
              };
              setMessages(prev => prev.map(m => m.id === botMsgId ? { ...currentBotMsg } : m));
            } else if (data.type === 'reply') {
              if (currentBotMsg.toolIndicator) {
                currentBotMsg.toolIndicator.status = 'Action completed';
              }
              fullText += data.text;
              currentBotMsg.content = fullText;
              currentBotMsg.html = typeof marked !== 'undefined' ? marked.parse(currentBotMsg.content) : data.html || currentBotMsg.content;
              setMessages(prev => prev.map(m => m.id === botMsgId ? { ...currentBotMsg } : m));
            } else if (data.type === 'error') {
              currentBotMsg.html = `<p class="text-red-500">Error: ${data.message}</p>`;
              setMessages(prev => prev.map(m => m.id === botMsgId ? { ...currentBotMsg } : m));
            }
          } catch (e) {}
        }
      }
      if (fullText) speak(fullText);
    } catch (err) {
      setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, html: '<p class="text-red-500">Connection error.</p>', loading: false } : m));
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <window.ChatHeader 
        onSearch={setSearchQuery} 
        ttsEnabled={ttsEnabled} 
        setTtsEnabled={setTtsEnabled} 
      />
      <main ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-8 space-y-8 scroll-smooth scrollbar-hide">
        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-40 select-none animate-pulse">
             <div className="w-16 h-16 rounded-3xl bg-gray-100 flex items-center justify-center mb-4">
                <i className="fa-solid fa-ghost text-2xl text-gray-400"></i>
             </div>
             <p className="text-sm font-medium text-gray-400">{searchQuery ? 'No matches found.' : 'No messages yet. Start a conversation.'}</p>
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

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
