import React, { useEffect, useRef, useState } from 'react';
import { Bot, MessageSquarePlus, Send, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import api from '../../api/api';

const HISTORY_LIMIT = 100;
const REQUEST_HISTORY_LIMIT = 10;

const CourseAIChat = ({ courseId, courseTitle }) => {
  const { user } = useSelector((state) => state.auth || {});
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const bottomRef = useRef(null);
  const storageKey = `odems-ai-chat:${user?.id}:${courseId}`;
  const endpoint = `/courses/${courseId}/ai-chat/`;

  const loadLocalHistory = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return Array.isArray(saved) ? saved.filter((message) => (
        (message.role === 'user' || message.role === 'assistant')
        && typeof message.content === 'string'
      )) : [];
    } catch (error) {
      console.error('Could not load ODEMS AI chat history:', error);
      toast.error('Could not load this course chat history.');
      return [];
    }
  };

  const saveHistory = (nextMessages) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextMessages.slice(-HISTORY_LIMIT)));
    } catch (error) {
      console.error('Could not save ODEMS AI chat history:', error);
      toast.error('Chat history could not be saved in this browser.');
    }
  };

  useEffect(() => {
    let cancelled = false;
    setHistoryLoading(true);
    setMessages([]);
    setConversations([]);
    setActiveConversationId(null);

    api.get(endpoint).then(async ({ data }) => {
      if (!Array.isArray(data)) {
        throw new Error('ODEMS AI returned an invalid conversation list.');
      }
      if (cancelled) return;
      setConversations(data);

      if (data.length === 0) {
        setMessages(loadLocalHistory());
        return;
      }

      const latestConversation = data[0];
      const { data: conversation } = await api.get(endpoint, {
        params: { conversation_id: latestConversation.id },
      });
      if (cancelled) return;
      setActiveConversationId(conversation.id);
      setMessages(conversation.messages || []);
    }).catch((error) => {
      if (cancelled) return;
      console.error('Could not load ODEMS AI conversations:', error);
      toast.error(error.response?.data?.error || 'Could not load your saved AI chats.');
      setMessages(loadLocalHistory());
    }).finally(() => {
      if (!cancelled) setHistoryLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [endpoint, storageKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  const startNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setInput('');
    saveHistory([]);
  };

  const openConversation = async (conversationId) => {
    if (loading || conversationId === activeConversationId) return;
    setHistoryLoading(true);
    try {
      const { data } = await api.get(endpoint, {
        params: { conversation_id: conversationId },
      });
      setActiveConversationId(data.id);
      setMessages(data.messages || []);
      saveHistory(data.messages || []);
    } catch (error) {
      console.error('Could not load ODEMS AI conversation:', error);
      toast.error(error.response?.data?.error || 'Could not open this saved chat.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const previousMessages = messages;
    const nextMessages = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const payload = {
        message: text,
        ...(activeConversationId && { conversation_id: activeConversationId }),
      };
      if (!activeConversationId && previousMessages.length > 0) {
        payload.messages = nextMessages.slice(-REQUEST_HISTORY_LIMIT).map((message) => ({
          role: message.role === 'assistant' ? 'model' : 'user',
          content: message.content,
        }));
        delete payload.message;
      }

      const { data } = await api.post(endpoint, payload);
      if (typeof data.answer !== 'string' || !data.answer.trim() || !data.conversation) {
        throw new Error('ODEMS AI returned an incomplete answer.');
      }
      const completedMessages = [
        ...nextMessages,
        { role: 'assistant', content: data.answer.trim() },
      ];
      setMessages(completedMessages);
      setActiveConversationId(data.conversation.id);
      setConversations((current) => [
        data.conversation,
        ...current.filter((conversation) => conversation.id !== data.conversation.id),
      ]);
      saveHistory(completedMessages);
    } catch (error) {
      console.error('ODEMS AI chat request failed:', error);
      setMessages(previousMessages);
      setInput(text);
      toast.error(error.response?.data?.error || error.message || 'ODEMS AI could not respond. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ margin: '24px 0', border: '1px solid #c7d2fe', borderRadius: 14, overflow: 'hidden', background: '#fff', boxShadow: '0 4px 16px rgba(79,70,229,.08)' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', color: '#fff', background: 'linear-gradient(120deg, #4338ca, #7c3aed)' }}>
        <span style={{ display: 'grid', placeItems: 'center', width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,.18)' }}>
          <Bot size={23} />
        </span>
        <div>
          <h2 style={{ margin: 0, fontSize: 18 }}>ODEMS AI</h2>
          <p style={{ margin: '3px 0 0', fontSize: 13, opacity: .9 }}>Ask about {courseTitle}</p>
        </div>
        <Sparkles size={20} style={{ marginLeft: 'auto' }} />
      </header>

      <div style={{ display: 'flex', minHeight: 300 }}>
        <aside aria-label="Chat history" style={{ width: 190, flexShrink: 0, padding: 10, borderRight: '1px solid #e2e8f0', background: '#fff' }}>
          <button type="button" onClick={startNewChat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, width: '100%', padding: '9px 8px', border: '1px solid #c7d2fe', borderRadius: 8, background: '#eef2ff', color: '#4338ca', cursor: 'pointer', fontWeight: 600 }}>
            <MessageSquarePlus size={16} /> New chat
          </button>
          <div style={{ maxHeight: 260, overflowY: 'auto', marginTop: 10 }}>
            {conversations.map((conversation) => (
              <button
                type="button"
                key={conversation.id}
                onClick={() => openConversation(conversation.id)}
                title={conversation.title}
                style={{ display: 'block', width: '100%', overflow: 'hidden', marginTop: 4, padding: '9px 8px', border: 0, borderRadius: 7, textAlign: 'left', textOverflow: 'ellipsis', whiteSpace: 'nowrap', background: conversation.id === activeConversationId ? '#eef2ff' : 'transparent', color: '#334155', cursor: 'pointer', fontSize: 12 }}
              >
                {conversation.title}
              </button>
            ))}
            {!historyLoading && conversations.length === 0 && (
              <p style={{ margin: '12px 4px', color: '#94a3b8', fontSize: 12 }}>Your chats will appear here.</p>
            )}
          </div>
        </aside>

        <div style={{ display: 'flex', minWidth: 0, flex: 1, flexDirection: 'column' }}>
          <div aria-live="polite" style={{ height: 300, overflowY: 'auto', padding: 16, background: '#f8fafc' }}>
            {historyLoading && <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>Loading your saved chats…</p>}
            {!historyLoading && messages.length === 0 && (
              <div style={{ maxWidth: '85%', padding: '11px 14px', borderRadius: '14px 14px 14px 4px', background: '#fff', border: '1px solid #e2e8f0', color: '#334155', lineHeight: 1.5 }}>
                Welcome to ODEMS AI! I can help explain course topics and answer questions about your learning materials.
              </div>
            )}
            {messages.map((message, index) => {
              const isUser = message.role === 'user';
              return (
                <div key={`${index}-${message.role}`} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginTop: 10 }}>
                  <p style={{ maxWidth: '85%', margin: 0, padding: '10px 14px', borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', lineHeight: 1.5, color: isUser ? '#fff' : '#334155', background: isUser ? '#4f46e5' : '#fff', border: isUser ? 'none' : '1px solid #e2e8f0' }}>
                    {message.content}
                  </p>
                </div>
              );
            })}
            {loading && <p style={{ margin: '12px 0 0', color: '#64748b', fontSize: 13 }}>ODEMS AI is thinking…</p>}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={sendMessage} style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid #e2e8f0' }}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={4000}
              aria-label="Message ODEMS AI"
              placeholder="Ask a course question..."
              style={{ flex: 1, minWidth: 0, padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 8, outlineColor: '#6366f1' }}
            />
            <button type="submit" disabled={loading || historyLoading || !input.trim()} aria-label="Send message" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 14px', border: 0, borderRadius: 8, background: loading || historyLoading || !input.trim() ? '#a5b4fc' : '#4f46e5', color: '#fff', cursor: loading || historyLoading || !input.trim() ? 'not-allowed' : 'pointer' }}>
              <Send size={16} /> Send
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default CourseAIChat;
