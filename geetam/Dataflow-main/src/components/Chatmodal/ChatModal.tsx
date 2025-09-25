import React, { useState, useRef, useEffect } from 'react';
import BouncingLoader from '../ui/Bouncingloader';
import { useThemeStore } from '../../store/themeStore'; 
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  canChat: boolean;
  onSendMessage: (message: string) => void;
  onStop: () => void;
  messages: Message[];
  loading?: boolean;
}

const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  canChat,
  onSendMessage,
  onStop,
  messages,
  loading = false,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const { isDark } = useThemeStore();

  const lastMsg = messages[messages.length - 1];
  const lastIsAgent = lastMsg?.sender === 'agent';
  const lastClean = lastMsg?.text.replace(/\s/g, '') ?? '';

  const isAgentStreaming = loading && lastIsAgent && lastClean.length > 0;
  const showLoader = loading && (!lastIsAgent || lastClean.length === 0);

  const hasEmptyAgentPlaceholder = loading && lastIsAgent && lastClean.length === 0;
  const displayedMessages = hasEmptyAgentPlaceholder
    ? messages.slice(0, messages.length - 1)
    : messages.slice(0, isAgentStreaming ? -1 : undefined);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
    setIsAutoScroll(true);
  };

  const handleStop = () => {
    onStop();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if(loading){
        handleStop()
      }else{
        handleSend()
      }
    }
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    setIsAutoScroll(scrollHeight - scrollTop - clientHeight < 100);
  };

  useEffect(() => {
    if (isAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isAutoScroll]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-[95%] md:w-11/12 max-w-4xl max-h-[90vh] flex flex-col p-4 sm:p-6 relative">
        <button
          onClick={onClose}
          aria-label="Close chat"
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
        >
          ✕
        </button>

        <h2
          id="chat-modal-title"
          className={`text-lg sm:text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}
        >
          Chat with Agent
        </h2>

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto mb-4 space-y-3 px-2 scroll-smooth"
        >
          {displayedMessages.map((msg) => (
            <div
              key={msg.id}
              className={`max-w-[80%] md:max-w-[75%] p-3 rounded-lg break-words text-sm sm:text-base ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white self-end ml-auto'
                  : `bg-gray-200 dark:bg-gray-700 self-start ${isDark ? 'text-white' : 'text-gray-900'}`
              }`}
            >
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            </div>
          ))}

          {/* Streaming bar: only once we have actual text */}
          {isAgentStreaming && (
            <div
              className={`max-w-[80%] md:max-w-[75%] p-3 rounded-lg break-words text-sm sm:text-base bg-gray-200 dark:bg-gray-700 self-start ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              <ReactMarkdown>{lastMsg.text}</ReactMarkdown>
              <span className="animate-pulse inline-block w-2">|</span>
            </div>
          )}

          {/* Bouncing loader until we get the first token */}
          {showLoader && <BouncingLoader />}

          <div ref={messagesEndRef} />
        </div>

        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <textarea
            className="w-full flex-1 border border-gray-300 dark:border-gray-600 rounded-md p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={canChat ? 'Type your message...' : 'Connect Agent to LLM node to chat'}
            disabled={!canChat || loading}
          />

          <button
            onClick={loading ? handleStop : handleSend}
            disabled={!canChat || (!input.trim() && !loading)}
            className={`w-full sm:w-auto px-4 py-[22px] rounded-xl text-white font-medium transition ${
              loading
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
            aria-label={loading ? 'Stop response' : 'Send message'}
          >
            {loading ? 'Stop' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
