const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const autocompletePopup = document.getElementById('autocomplete-popup');
const autocompleteList = document.getElementById('autocomplete-list');

let skills = [];
let files = [];

async function fetchMetadata() {
  try {
    const s = await fetch('/api/web/skills').then(r => r.json());
    if (s.skills) skills = s.skills.map(x => ({ text: x.name, desc: x.description, prefix: '/' }));
    const f = await fetch('/api/web/files').then(r => r.json());
    if (f.files) files = f.files.map(x => ({ text: x, desc: 'File in workspace', prefix: '@' }));
  } catch(e) {
    console.warn("Failed to load skills/files");
  }
}
fetchMetadata();

messageInput.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = this.scrollHeight + 'px';
  handleAutocomplete();
});

function handleAutocomplete() {
  const text = messageInput.value;
  const cursorPos = messageInput.selectionStart;
  const textBeforeCursor = text.substring(0, cursorPos);
  const words = textBeforeCursor.split(/\s/);
  const currentWord = words[words.length - 1];

  if (currentWord.startsWith('/') || currentWord.startsWith('@')) {
    const prefix = currentWord[0];
    const query = currentWord.substring(1).toLowerCase();
    showAutocomplete(prefix, query);
  } else {
    hideAutocomplete();
  }
}

function showAutocomplete(prefix, query) {
  let list = prefix === '/' ? skills : files;
  const filtered = list.filter(item => item.text.toLowerCase().includes(query));

  if (filtered.length === 0) {
    hideAutocomplete();
    return;
  }

  autocompleteList.innerHTML = '';
  filtered.forEach(item => {
    const li = document.createElement('li');
    li.className = 'px-4 py-2 hover:bg-gray-100 cursor-pointer flex flex-col group border-b border-gray-50 last:border-0';
    li.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="font-bold text-gray-800">${item.prefix}${item.text}</span>
      </div>
      <span class="text-xs text-gray-500">${item.desc}</span>
    `;
    li.onclick = () => insertAutocomplete(item.prefix + item.text);
    autocompleteList.appendChild(li);
  });
  autocompletePopup.classList.remove('hidden');
}

function hideAutocomplete() {
  autocompletePopup.classList.add('hidden');
}

function insertAutocomplete(textToInsert) {
  const text = messageInput.value;
  const cursorPos = messageInput.selectionStart;
  const textBeforeCursor = text.substring(0, cursorPos);
  const textAfterCursor = text.substring(cursorPos);
  const words = textBeforeCursor.split(/\s/);
  words.pop();
  
  const newTextBeforeCursor = (words.length > 0 ? words.join(' ') + ' ' : '') + textToInsert + ' ';
  messageInput.value = newTextBeforeCursor + textAfterCursor;
  messageInput.focus();
  messageInput.selectionStart = messageInput.selectionEnd = newTextBeforeCursor.length;
  hideAutocomplete();
}

function addMessage(type, contentHTML) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `flex w-full ${type === 'user' ? 'justify-end' : 'justify-start'} mb-6 group`;

  const inner = document.createElement('div');
  inner.className = `max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3 shadow-sm ${type === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm flex flex-col gap-2'}`;
  
  if (type === 'bot') {
    inner.innerHTML = `<div class="prose text-sm sm:text-base leading-relaxed break-words">${contentHTML}</div>`;
  } else {
    inner.innerText = contentHTML; 
  }

  msgDiv.appendChild(inner);
  chatContainer.appendChild(msgDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  return inner;
}

function createToolIndicator(container, prevToolContainer) {
  if (prevToolContainer && prevToolContainer.querySelector('.fa-spinner')) {
      prevToolContainer.querySelector('.fa-spinner').classList.remove('fa-spin', 'text-blue-500');
      prevToolContainer.querySelector('.fa-spinner').classList.add('text-green-500', 'fa-check');
  }

  const toolDiv = document.createElement('div');
  toolDiv.className = 'w-full max-w-sm bg-gray-50 border border-gray-100 rounded-lg p-3 my-2 text-xs flex flex-col gap-1 transition-all text-gray-600 shadow-sm';
  toolDiv.innerHTML = `
    <div class="flex items-center gap-2 font-medium">
      <i class="fa-solid fa-spinner fa-spin text-blue-500"></i>
      <span class="tool-status">Agent is thinking...</span>
    </div>
    <div class="tool-list mt-1 space-y-1 pl-5 hidden"></div>
  `;
  container.appendChild(toolDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  return toolDiv;
}

messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    if (!autocompletePopup.classList.contains('hidden')) {
      e.preventDefault();
      const firstItem = autocompleteList.querySelector('li');
      if (firstItem) firstItem.click();
    } else {
      e.preventDefault();
      document.getElementById('chat-form').dispatchEvent(new Event('submit'));
    }
  }
});

document.getElementById('chat-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;

  addMessage('user', text);
  messageInput.value = '';
  messageInput.style.height = 'auto';
  sendBtn.disabled = true;

  const botMsgInner = addMessage('bot', `<div class="flex gap-1 items-center h-5"><div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div><div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div><div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div></div>`);
  botMsgInner.classList.remove('prose'); 

  try {
    const res = await fetch('/api/web/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, session: 'web' })
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    
    botMsgInner.innerHTML = ''; 
    botMsgInner.classList.add('prose');
    let toolContainer = null;
    let mdContainer = null;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunks = decoder.decode(value, { stream: true }).split('\n');
      for (const chunk of chunks) {
        if (!chunk.trim()) continue;
        try {
          const data = JSON.parse(chunk);
          if (data.type === 'tool_start') {
            if (!toolContainer) toolContainer = createToolIndicator(botMsgInner, null);
            const list = toolContainer.querySelector('.tool-list');
            list.classList.remove('hidden');
            data.toolCalls.forEach(t => {
              const item = document.createElement('div');
              item.className = 'text-gray-500 font-mono truncate bg-gray-200/50 px-1.5 py-0.5 rounded mt-0.5';
              item.innerText = `> ${t.tool}(...)`;
              list.appendChild(item);
            });
            toolContainer.querySelector('.tool-status').innerText = 'Using tools...';
          } else if (data.type === 'tool_end') {
             // Let the indicator stay but marked as done later or immediately.
          } else if (data.type === 'reply') {
            if (toolContainer) {
               toolContainer.querySelector('.fa-spinner').classList.replace('fa-spin', 'fa-check');
               toolContainer.querySelector('.fa-spinner').classList.replace('text-blue-500', 'text-green-500');
               toolContainer.querySelector('.tool-status').innerText = 'Action completed';
            }
            if(!mdContainer) {
                mdContainer = document.createElement('div');
                botMsgInner.appendChild(mdContainer);
            }
            mdContainer.innerHTML = typeof marked !== 'undefined' ? marked.parse(data.text) : data.html || data.text;
          } else if (data.type === 'error') {
            botMsgInner.innerHTML = `<p class="text-red-500">Error: ${data.message}</p>`;
          }
        } catch(e) {}
      }
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  } catch (err) {
    botMsgInner.innerHTML = `<p class="text-red-500">Connection error.</p>`;
  } finally {
    sendBtn.disabled = false;
    messageInput.focus();
  }
});

document.addEventListener('click', e => {
  if (!autocompletePopup.contains(e.target) && e.target !== messageInput) {
    hideAutocomplete();
  }
});
