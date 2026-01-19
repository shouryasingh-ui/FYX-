
import React, { useState, useRef, useEffect } from 'react';
import { chatWithCustomer } from '../services/geminiService';

interface Message {
  text: string;
  sender: 'user' | 'bot';
}

const AIChatBubble: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { text: "Hi! I'm your FYX assistant. How can I help you today?", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { text: userMsg, sender: 'user' }]);
    setIsTyping(true);

    const response = await chatWithCustomer(userMsg, "The customer is currently browsing the storefront.");
    setMessages(prev => [...prev, { text: response, sender: 'bot' }]);
    setIsTyping(false);
  };

  return (
    <div className="fixed bottom-24 md:bottom-6 right-6 z-[90]">
      {isOpen ? (
        <div className="bg-white w-80 sm:w-96 h-[500px] rounded-2xl shadow-2xl border flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-gray-900 p-4 text-white flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-semibold">AI Concierge</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:text-gray-300 transition">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          
          <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                  m.sender === 'user' ? 'bg-[#1a1614] text-white rounded-tr-none' : 'bg-white text-gray-800 border rounded-tl-none shadow-sm'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border text-gray-400 px-4 py-2 rounded-2xl rounded-tl-none text-xs flex items-center space-x-1">
                  <div className="w-1 h-1 bg-gray-300 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-gray-300 rounded-full animate-bounce delay-75"></div>
                  <div className="w-1 h-1 bg-gray-300 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t bg-white">
            <div className="flex space-x-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything..."
                className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-[#1a1614] outline-none"
              />
              <button 
                onClick={handleSend}
                className="bg-[#1a1614] text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-black transition"
              >
                <i className="fa-solid fa-paper-plane text-sm"></i>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-[#1a1614] text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform duration-200"
        >
          <i className="fa-solid fa-comment-dots text-2xl"></i>
        </button>
      )}
    </div>
  );
};

export default AIChatBubble;
