const ChatMessage = ({ type, content, html, toolIndicator }) => {
  return (
    <div className={`flex w-full ${type === 'user' ? 'justify-end' : 'justify-start'} group`}>
      <div className={`max-w-[85%] sm:max-w-[75%] px-5 py-4 shadow-sm border border-transparent ${
        type === 'user' 
          ? 'bg-blue-600 text-white rounded-[2rem] rounded-tr-md shadow-blue-500/20' 
          : 'bg-white border-gray-100 text-gray-800 rounded-[2rem] rounded-tl-md shadow-gray-200/50'
      }`}>
        {type === 'bot' && toolIndicator && (
          <window.ToolIndicator 
            status={toolIndicator.status} 
            toolCalls={toolIndicator.toolCalls} 
          />
        )}
        <div 
          className={`prose text-[15px] sm:text-[16px] leading-relaxed break-words ${type === 'user' ? 'prose-invert' : ''}`}
          dangerouslySetInnerHTML={{ __html: html || content }}
        />
      </div>
    </div>
  );
};
window.ChatMessage = ChatMessage;
