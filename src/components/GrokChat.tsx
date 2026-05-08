import { useState } from 'react';
import { Bot, X, Send } from 'lucide-react';

interface GrokChatProps {
  onNavigate?: (page: number) => void;
}

export default function GrokChat({ onNavigate }: GrokChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean }>>([]);
  const [input, setInput] = useState('');

  const generateResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return "Hello! I'm Grok, your friendly assistant. How can I help you today?";
    } else if (lowerMessage.includes('help')) {
      return "I can help you with navigation, AI tools, uploading media, and answering questions about MandaStrong Studio. What would you like to know?";
    } else if (lowerMessage.includes('upload')) {
      return "To upload media, visit Page 10 or Page 11 and click the Upload button. Your files will be saved to your Media Box.";
    } else if (lowerMessage.includes('ai tool')) {
      return "We have over 720 AI tools available on Pages 4-9. Each tool can help you create or edit different types of content for your movie project.";
    } else if (lowerMessage.includes('edit')) {
      return "The Timeline Editor is on Page 10, and you can access advanced editing tools on Pages 12-16 including audio, text, animation, and visual effects.";
    } else if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('plan')) {
      return "We have three subscription plans: Basic ($40/month), Pro ($39/month), and Studio ($50/month). Each plan offers different movie length capabilities and full access to all AI tools.";
    } else if (lowerMessage.includes('export') || lowerMessage.includes('download')) {
      return "You can export your finished project from the Visual FX page (Page 16) with various quality and format options.";
    } else {
      return "Thank you for your question! I'm here to help make your creative journey easier. Feel free to ask me anything about MandaStrong Studio.";
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages([...messages, { text: userMessage, isUser: true }]);
    setInput('');

    setTimeout(() => {
      const response = generateResponse(userMessage);
      setMessages(prev => [...prev, { text: response, isUser: false }]);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 sm:bottom-6 left-4 sm:left-6 z-50 bg-purple-600 hover:bg-purple-500 text-white p-3 sm:p-4 rounded-full shadow-2xl transition-all hover:scale-110"
        aria-label="Grok Assistant"
      >
        {isOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Bot className="w-5 h-5 sm:w-6 sm:h-6" />}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed bottom-16 sm:bottom-24 left-4 sm:left-6 z-50 bg-black/90 backdrop-blur-xl rounded-2xl border border-purple-500/50 shadow-2xl p-4 w-[calc(100vw-2rem)] sm:w-96 max-h-[500px] flex flex-col">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-purple-500/30">
              <Bot className="w-6 h-6 text-purple-400" />
              <h3 className="text-white font-bold text-lg">Grok Assistant</h3>
            </div>

            <div className="flex-1 overflow-y-auto mb-3 space-y-3 min-h-[200px]">
              {messages.length === 0 ? (
                <div className="bg-purple-900/30 rounded-lg p-3 border border-purple-500/30">
                  <p className="text-white/90 text-sm">
                    Hi! I'm Grok, your friendly assistant. Ask me anything about MandaStrong Studio!
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg p-3 ${
                      msg.isUser
                        ? 'bg-blue-900/30 border border-blue-500/30 ml-8'
                        : 'bg-purple-900/30 border border-purple-500/30 mr-8'
                    }`}
                  >
                    <p className="text-white/90 text-sm">{msg.text}</p>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                className="flex-1 px-3 py-2 bg-black border border-purple-500/50 rounded-lg text-white text-sm placeholder-white/60 focus:outline-none focus:border-purple-400"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
