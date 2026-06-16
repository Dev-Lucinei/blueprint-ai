import { useState, useRef, useEffect } from 'react';

interface RefinementChatProps {
  onRefine: (query: string) => Promise<void>;
  isRefining: boolean;
  chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export function RefinementChat({ onRefine, isRefining, chatHistory = [] }: RefinementChatProps) {
  const [query, setQuery] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isRefining) {
      await onRefine(query.trim());
      setQuery('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-gray-700/50 pt-4">
      <h4 className="text-sm font-medium text-gray-300 mb-3">💬 Refinar Blueprint</h4>

      {/* Chat history */}
      {chatHistory.length > 0 && (
        <div className="max-h-48 overflow-y-auto mb-3 space-y-2">
          {chatHistory.map((msg, i) => (
            <div
              key={i}
              className={`p-2 rounded-lg text-sm ${
                msg.role === 'user'
                  ? 'bg-purple-600/20 text-purple-200 ml-4'
                  : 'bg-gray-700/30 text-gray-300 mr-4'
              }`}
            >
              {msg.content}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Descreva o ajuste desejado..."
          disabled={isRefining}
          className="flex-1 px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!query.trim() || isRefining}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isRefining ? '⏳' : '✉️'}
        </button>
      </form>
    </div>
  );
}
