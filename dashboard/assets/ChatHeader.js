const { useState, useEffect } = React;

const ChatHeader = ({ onSearch, ttsEnabled, setTtsEnabled }) => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePopup, setActivePopup] = useState(null); // 'history' or 'settings'
  const [historyLoading, setHistoryLoading] = useState(false);

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchQuery('');
      onSearch('');
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    onSearch(e.target.value);
  };

  const openHistory = () => {
    setActivePopup('history');
    setHistoryLoading(true);
    setTimeout(() => setHistoryLoading(false), 3000);
  };

  const closePopups = () => setActivePopup(null);

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 border-b border-gray-100 p-4 flex flex-col gap-3 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">
            R
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900 leading-tight">Romi AI</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Active Now</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button 
            onClick={toggleSearch}
            className={`transition-colors p-2 rounded-lg hover:bg-gray-50 ${showSearch ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}
          >
            <i className="fa-solid fa-magnifying-glass text-sm"></i>
          </button>
          
          <button 
            onClick={openHistory}
            className="text-gray-400 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-50"
          >
            <i className="fa-solid fa-clock-rotate-left text-sm"></i>
          </button>
          
          <button 
            onClick={() => setActivePopup('settings')}
            className="text-gray-400 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-50"
          >
            <i className="fa-solid fa-gear text-sm"></i>
          </button>
        </div>
      </div>

      {showSearch && (
        <div className="relative animate-fadeIn">
          <input
            autoFocus
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search in current chat..."
            className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2 px-4 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100/30 transition-all"
          />
          {searchQuery && (
             <button 
                onClick={() => { setSearchQuery(''); onSearch(''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
             >
                <i className="fa-solid fa-circle-xmark text-xs"></i>
             </button>
          )}
        </div>
      )}

      {/* Popups Overlay */}
      {activePopup && (
        <div 
          className="fixed inset-0 bg-black/5 z-40"
          onClick={closePopups}
        ></div>
      )}

      {/* History Popup */}
      {activePopup === 'history' && (
        <div className="absolute top-16 right-4 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50 animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">History</h3>
            <button onClick={closePopups} className="text-gray-400 hover:text-gray-600">
               <i className="fa-solid fa-xmark text-xs"></i>
            </button>
          </div>
          
          <div className="space-y-3">
            {historyLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="flex flex-col gap-2 animate-pulse">
                  <div className="h-3 bg-gray-100 rounded-full w-3/4"></div>
                  <div className="h-2 bg-gray-50 rounded-full w-1/2"></div>
                </div>
              ))
            ) : (
              ['Project Refactoring', 'API Integration', 'UI Feedback Session'].map((title, i) => (
                <div key={i} className="p-2 hover:bg-blue-50 rounded-xl cursor-pointer group transition-colors">
                  <p className="text-sm font-semibold text-gray-700 group-hover:text-blue-600">{title}</p>
                  <p className="text-[10px] text-gray-400">2 hours ago</p>
                </div>
              ))
            )}
          </div>
          {!historyLoading && (
            <button className="w-full mt-4 py-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest border-t border-gray-50 hover:bg-gray-50 rounded-b-xl transition-colors">
              View All History
            </button>
          )}
        </div>
      )}

      {/* Settings Popup */}
      {activePopup === 'settings' && (
        <div className="absolute top-16 right-4 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50 animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Settings</h3>
            <button onClick={closePopups} className="text-gray-400 hover:text-gray-600">
               <i className="fa-solid fa-xmark text-xs"></i>
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-1">
              <span className="text-sm text-gray-600">Speech API</span>
              <button 
                onClick={() => setTtsEnabled(!ttsEnabled)}
                className={`w-10 h-5 rounded-full relative transition-colors ${ttsEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${ttsEnabled ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>
            <div className="flex items-center justify-between p-1">
              <span className="text-sm text-gray-600">Auto-save</span>
              <div className="w-10 h-5 bg-blue-600 rounded-full relative">
                <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm"></div>
              </div>
            </div>
            <button className="w-full text-left p-2 hover:bg-red-50 text-red-500 rounded-xl transition-colors flex items-center gap-3">
              <i className="fa-solid fa-trash-can text-xs"></i>
              <span className="text-sm font-medium">Clear current chat</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
window.ChatHeader = ChatHeader;
