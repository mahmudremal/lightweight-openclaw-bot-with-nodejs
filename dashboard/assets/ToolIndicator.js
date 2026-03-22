const ToolIndicator = ({ status, toolCalls }) => {
  const [expanded, setExpanded] = React.useState({});

  const toggle = (i) => {
    setExpanded(prev => ({ ...prev, [i]: !prev[i] }));
  };

  return (
    <div className="w-full max-w-sm bg-blue-50/50 border border-blue-100/50 rounded-xl p-3 mb-3 text-xs flex flex-col gap-2 transition-all text-blue-800 shadow-sm shadow-blue-500/5">
      <div className="flex items-center gap-2 font-semibold">
        {status === 'Action completed' ? (
          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <i className="fa-solid fa-check text-[10px]"></i>
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <i className="fa-solid fa-spinner fa-spin text-[10px]"></i>
          </div>
        )}
        <span className="opacity-90 tracking-tight">{status}</span>
      </div>
      {toolCalls.length > 0 && (
        <div className="space-y-2 pl-2 ml-2.5 border-l border-blue-100/50">
          {toolCalls.map((t, i) => {
            const toolName = typeof t === 'string' ? t : t.tool;
            const toolArgs = typeof t === 'object' ? JSON.stringify(t.args || {}, null, 2) : '{}';
            const isExpanded = expanded[i];

            return (
              <div key={i} className="flex flex-col gap-1.5">
                <div 
                  className="flex items-center gap-2 cursor-pointer group"
                  onClick={() => toggle(i)}
                >
                  <i className={`fa-solid fa-chevron-right text-[8px] transition-transform duration-200 opacity-40 group-hover:opacity-100 ${isExpanded ? 'rotate-90' : ''}`}></i>
                  <div className="text-[10px] font-mono opacity-60 truncate group-hover:opacity-100 transition-opacity">
                    {toolName}()
                  </div>
                </div>
                {isExpanded && (
                  <div className="ml-4 p-2 bg-blue-100/30 rounded-lg overflow-x-auto">
                    <pre className="text-[9px] font-mono text-blue-900/70 whitespace-pre-wrap">
                      {toolArgs}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
window.ToolIndicator = ToolIndicator;
