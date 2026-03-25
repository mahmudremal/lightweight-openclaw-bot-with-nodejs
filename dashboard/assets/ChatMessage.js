const ChatMessage = ({ type, content, html, toolIndicator, timestamp }) => {
  return (
    <div
      className={`flex flex-col w-full ${type === "user" ? "items-end" : "items-start"} group relative`}
    >
      {timestamp && (
        <span className="text-[10px] text-gray-400 font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 mb-1.5 px-2 select-none h-4">
          {timestamp}
        </span>
      )}
      <div
        className={`max-w-[85%] sm:max-w-[75%] px-5 py-4 shadow-sm border border-transparent transition-transform duration-200 group-hover:-translate-y-0.5 ${
          type === "user"
            ? "bg-blue-600 text-white rounded-[2rem] rounded-tr-md shadow-blue-500/20"
            : "bg-white border-gray-100 text-gray-800 rounded-[2rem] rounded-tl-md shadow-gray-200/50"
        }`}
      >
        {type === "bot" && toolIndicator && (
          <window.ToolIndicator
            status={toolIndicator.status}
            toolCalls={toolIndicator.toolCalls}
          />
        )}
        <div
          className={`prose text-[15px] sm:text-[16px] leading-relaxed break-words ${type === "user" ? "prose-invert" : ""}`}
          dangerouslySetInnerHTML={{ __html: html || content }}
        />
      </div>
    </div>
  );
};
window.ChatMessage = ChatMessage;
