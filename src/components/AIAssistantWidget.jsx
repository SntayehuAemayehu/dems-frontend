import React, { useState, useRef, useEffect } from 'react';
import api from '../api/api';

const AIAssistantWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // ✅ Auto-scroll to the bottom when a new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/analytics/ai/chat/', { question: input });
      setMessages(prev => [...prev, { role: 'ai', text: response.data.answer }]);
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Network error.";
      setMessages(prev => [...prev, { role: 'ai', text: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Clear Chat Function
  const clearChat = () => {
    setMessages([]);
  };

  return (
    <>
      <style>{`
        @keyframes float3D {
          0% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          25% { transform: translateY(-6px) translateX(-3px) rotate(2deg); }
          50% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          75% { transform: translateY(6px) translateX(3px) rotate(-2deg); }
          100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
        }
        
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 15px rgba(59, 130, 246, 0.4); }
          50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.8), 0 0 10px rgba(139, 92, 246, 0.5); }
          100% { box-shadow: 0 0 15px rgba(59, 130, 246, 0.4); }
        }

        .ai-float-btn {
          position: fixed;
          bottom: 30px;
          left: 30px;
          width: 70px;
          height: 70px;
          border-radius: 50%;
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 45px; 
          animation: float3D 4s ease-in-out infinite, pulseGlow 2s ease-in-out infinite;
          z-index: 1000;
          transition: filter 0.3s ease;
        }
        
        .ai-float-btn:hover {
          filter: drop-shadow(0 0 15px #3b82f6);
          animation-play-state: paused; 
        }
        
        .ai-chat-window {
          position: fixed;
          bottom: 80px;
          left: 30px;
          width: 350px;
          height: 500px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15);
          display: flex;
          flex-direction: column;
          z-index: 1000;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }
      `}</style>

      {isOpen && (
        <div className="ai-chat-window">
          {/* ✅ HEADER WITH CLEAR CHAT BUTTON */}
          <div style={{ padding: '12px 16px', background: '#2563eb', color: 'white', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🤖</span>
              <span>DEMS AI Assistant</span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={clearChat} 
                title="Clear Chat"
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
              >
                🗑️ Clear
              </button>
              <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
          </div>
          
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', background: '#f8fafc' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '20px', fontSize: '14px' }}>
                Hi! I am your AI assistant. Ask me anything about the DEMS system!
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} style={{ textAlign: msg.role === 'user' ? 'right' : 'left', marginBottom: '12px' }}>
                <span style={{ 
                  background: msg.role === 'user' ? '#dbeafe' : '#ffffff', 
                  color: msg.role === 'user' ? '#1e40af' : '#0f172a',
                  border: msg.role === 'ai' ? '1px solid #e2e8f0' : 'none',
                  padding: '10px 14px', 
                  borderRadius: '12px', 
                  display: 'inline-block',
                  maxWidth: '85%',
                  fontSize: '14px',
                  whiteSpace: 'pre-wrap', // ✅ Keeps tables and newlines formatted nicely
                  textAlign: 'left',
                  boxShadow: msg.role === 'ai' ? '0 2px 5px rgba(0,0,0,0.05)' : 'none'
                }}>{msg.text}</span>
              </div>
            ))}
            {loading && (
              <div style={{ textAlign: 'left', color: '#64748b', fontSize: '13px', fontStyle: 'italic' }}>
              Thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ padding: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px', background: 'white' }}>
            <input 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask me anything..."
              style={{ flex: 1, padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', fontSize: '14px' }}
            />
            <button 
              onClick={sendMessage} 
              disabled={loading}
              style={{ padding: '10px 20px', background: loading ? '#94a3b8' : '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
            >
              Send
            </button>
          </div>
        </div>
      )}
      
      <button className="ai-float-btn" onClick={() => setIsOpen(!isOpen)} style={{ position: 'fixed', bottom: '30px', left: '30px' }}> 
        🤖
      </button>
    </>
  );
};

export default AIAssistantWidget;