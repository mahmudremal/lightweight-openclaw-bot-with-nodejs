const Autocomplete = ({ prefix, query, skills, files, onSelect }) => {
  const list = prefix === '/' ? skills : files;
  const filtered = list.filter(item => item.text.toLowerCase().includes(query.toLowerCase()));

  if (filtered.length === 0) return null;

  return (
    <div className="absolute bottom-full mb-3 left-4 right-4 sm:left-auto sm:right-auto sm:w-full max-w-lg bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100/50 overflow-hidden z-30 ring-1 ring-black/5">
      <div className="px-4 py-2 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{prefix === '/' ? 'Skills' : 'Files'}</span>
        <span className="text-[10px] text-gray-400">{filtered.length} matches</span>
      </div>
      <ul className="py-1 max-h-64 overflow-y-auto">
        {filtered.map((item, i) => (
          <li
            key={i}
            className="px-4 py-3 hover:bg-blue-50/50 cursor-pointer flex flex-col group transition-colors"
            onClick={() => onSelect(item.prefix + item.text)}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{item.prefix}{item.text}</span>
            </div>
            <span className="text-[11px] text-gray-400 font-medium group-hover:text-blue-400 transition-colors truncate">{item.desc}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
window.Autocomplete = Autocomplete;
