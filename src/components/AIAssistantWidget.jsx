import React, { useState } from 'react';
import api from '../api/api'; // Your axios instance

const AIAssistantWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    try {
      // ✅ FIXED: Added '/analytics' to match your backend urls.py
      const response = await api.post('/analytics/ai/chat/', { question: input });
      setMessages(prev => [...prev, { role: 'ai', text: response.data.answer }]);
    } catch (error) {
      // ✅ SHOW THE REAL ERROR FROM DJANGO
      const errorMsg = error.response?.data?.error || error.response?.data?.detail || "Network error. Is the backend running?";
      setMessages(prev => [...prev, { role: 'ai', text: errorMsg }]);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
      {/* Chat Window */}
      {isOpen && (
        <div style={{ width: '300px', height: '400px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px', background: '#2563eb', color: 'white', borderRadius: '12px 12px 0 0', fontWeight: 'bold' }}>DEMS AI Assistant</div>
          <div style={{ flex: 1, padding: '12px', overflowY: 'auto', background: '#f8fafc' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '20px', fontSize: '13px' }}>
                Ask me anything about the DEMS system!
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} style={{ textAlign: msg.role === 'user' ? 'right' : 'left', marginBottom: '8px' }}>
                <span style={{ 
                  background: msg.role === 'user' ? '#dbeafe' : '#ffffff', 
                  color: msg.role === 'user' ? '#1e40af' : '#0f172a',
                  border: msg.role === 'ai' ? '1px solid #e2e8f0' : 'none',
                  padding: '8px 12px', 
                  borderRadius: '8px', 
                  display: 'inline-block',
                  maxWidth: '85%',
                  fontSize: '14px',
                  boxShadow: msg.role === 'ai' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                }}>{msg.text}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '8px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px', background: 'white', borderRadius: '0 0 12px 12px' }}>
            <input 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask me anything..."
              style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px', outline: 'none' }}
            />
            <button 
              onClick={sendMessage} 
              style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Send
            </button>
          </div>
        </div>
      )}
      
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#2563eb', color: 'white', border: 'none', cursor: 'pointer', fontSize: '24px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)' }}
      >
        🤖
      </button>
    </div>
  );
};

export default AIAssistantWidget;