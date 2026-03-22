const ChatInput = ({ onSend, skills, files }) => {
  const { useState, useRef, useEffect } = React;
  const [message, setMessage] = useState('');
  const [autocomplete, setAutocomplete] = useState(null);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const baseMessageRef = useRef('');

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  const handleInput = (e) => {
    const val = e.target.value;
    setMessage(val);
    baseMessageRef.current = val;

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.substring(0, cursorPos);
    const words = textBeforeCursor.split(/\s/);
    const currentWord = words[words.length - 1];

    if (currentWord.startsWith('/') || currentWord.startsWith('@')) {
      setAutocomplete({
        prefix: currentWord[0],
        query: currentWord.substring(1)
      });
    } else {
      setAutocomplete(null);
    }
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setAttachedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const toggleMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;

    baseMessageRef.current = message;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    
    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const currentBase = baseMessageRef.current;
      const separator = currentBase && (finalTranscript || interimTranscript) ? ' ' : '';
      setMessage(currentBase + separator + finalTranscript + interimTranscript);
      
      if (finalTranscript) {
         baseMessageRef.current = currentBase + separator + finalTranscript;
      }
    };

    recognition.start();
  };

  const insertAutocomplete = (textToInsert) => {
    const cursorPos = textareaRef.current.selectionStart;
    const textBeforeCursor = message.substring(0, cursorPos);
    const textAfterCursor = message.substring(cursorPos);
    const words = textBeforeCursor.split(/\s/);
    words.pop();
    
    const newTextBeforeCursor = (words.length > 0 ? words.join(' ') + ' ' : '') + textToInsert + ' ';
    const newMessage = newTextBeforeCursor + textAfterCursor;
    setMessage(newMessage);
    baseMessageRef.current = newMessage;
    setAutocomplete(null);
    textareaRef.current.focus();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim() && attachedFiles.length === 0) return;
    
    if (isListening) {
      recognitionRef.current?.stop();
    }

    onSend(message.trim());
    setMessage('');
    baseMessageRef.current = '';
    setAttachedFiles([]);
    setAutocomplete(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (autocomplete) {
        e.preventDefault();
        const list = autocomplete.prefix === '/' ? skills : files;
        const filtered = list.filter(item => item.text.toLowerCase().includes(autocomplete.query.toLowerCase()));
        if (filtered.length > 0) {
          insertAutocomplete(filtered[0].prefix + filtered[0].text);
        }
      } else {
        handleSubmit(e);
      }
    }
  };

  return (
    <footer className="p-4 sm:pb-8 bg-white/50 backdrop-blur-md z-10 w-full relative">
      <div className="max-w-4xl mx-auto relative">
        {autocomplete && (
          <window.Autocomplete
            {...autocomplete}
            skills={skills}
            files={files}
            onSelect={insertAutocomplete}
          />
        )}
        
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 animate-fadeIn">
            {attachedFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full text-[10px] font-bold text-blue-600">
                <i className="fa-solid fa-file text-[9px]"></i>
                <span className="max-w-[100px] truncate">{f.name}</span>
                <button onClick={() => removeFile(i)} className="hover:text-red-500 transition-colors">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            ))}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex flex-col relative bg-white rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/50 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100/30 transition-all duration-300"
        >
          <input 
            type="file" 
            multiple 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
          />
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            rows="1"
            className="w-full bg-transparent resize-none outline-none py-4 px-5 text-gray-700 placeholder-gray-400 max-h-48 text-[15px] sm:text-[16px]"
            placeholder="How can I help you today?"
          ></textarea>
          
          <div className="flex items-center justify-between px-3 pb-3">
             <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="text-gray-400 hover:text-blue-600 p-2 rounded-lg transition-colors"
                  title="Upload files"
                >
                  <i className="fa-solid fa-plus text-xs"></i>
                </button>
                <div className="h-4 w-px bg-gray-100 mx-1"></div>
                
                <button
                  type="button"
                  onClick={toggleMic}
                  className={`p-2 rounded-lg transition-all ${isListening ? 'text-red-500 bg-red-50 animate-pulse' : 'text-gray-400 hover:text-blue-600'}`}
                  title="Voice input"
                >
                  <i className={`fa-solid ${isListening ? 'fa-microphone' : 'fa-microphone-lines'} text-xs`}></i>
                </button>

                <div className="h-4 w-px bg-gray-100 mx-1"></div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest px-1">Skills</span>
             </div>
             
             <button
              type="submit"
              disabled={!message.trim() && attachedFiles.length === 0}
              className="bg-blue-600 text-white h-9 px-4 rounded-xl hover:bg-blue-700 transition-all duration-300 flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-30 disabled:shadow-none disabled:cursor-not-allowed group"
            >
              <span className="text-xs font-bold uppercase tracking-wider group-hover:mr-1 transition-all">Send</span>
              <i className="fa-solid fa-paper-plane text-[10px]"></i>
            </button>
          </div>
        </form>
        <p className="text-[10px] text-gray-400 text-center mt-3 font-medium">Powered by Romi AI • Open Source Dashboard</p>
      </div>
    </footer>
  );
};
window.ChatInput = ChatInput;
