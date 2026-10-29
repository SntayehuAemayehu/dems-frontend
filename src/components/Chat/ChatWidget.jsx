// frontend/src/components/Chat/ChatWidget.jsx
// COMPLETE REAL CHAT — WhatsApp/Messenger-style

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  MessageSquare, X, Send, Users, User, RefreshCw, ChevronLeft,
  Plus, Search, UserPlus, Loader, Trash2, Pencil, Check, CheckCheck,
  Paperclip, Image as ImageIcon, Smile, MoreVertical, ArrowDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/api';

// ---------- small helpers ----------
const sameDay = (a, b) => {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear()
    && da.getMonth() === db.getMonth()
    && da.getDate() === db.getDate();
};

const dayLabel = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  if (sameDay(d, now)) return 'Today';
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (sameDay(d, y)) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatRelative = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString();
};

// =========================================================
//  CHAT WIDGET
// =========================================================
const ChatWidget = () => {
  const { user, isAuthenticated } = useSelector((s) => s.auth || {});

  // ------- state -------
  const [isOpen, setIsOpen] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [sending, setSending] = useState(false);
  const [users, setUsers] = useState([]);
  const [showUserList, setShowUserList] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageSearch, setMessageSearch] = useState('');
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const [statuses, setStatuses] = useState({});
  const [typingUsers, setTypingUsers] = useState({}); // roomId -> {userId: name}
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [initialUsersLoaded, setInitialUsersLoaded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showScrollDown, setShowScrollDown] = useState(false);

  // ------- refs -------
  const messagesEndRef = useRef(null);
  const messagesScrollRef = useRef(null);
  const inputRef = useRef(null);
  const selectedRoomIdRef = useRef(null);
  const pollingRef = useRef(null);
  const lastMessageIdRef = useRef(null);

  // keep selected room id in a ref for polling
  useEffect(() => {
    selectedRoomIdRef.current = selectedRoom?.id ?? null;
  }, [selectedRoom]);

  // =========================================================
  //  API helpers
  // =========================================================
  const markMessagesAsRead = useCallback(async (roomId) => {
    if (!isAuthenticated || !roomId) return;
    try {
      await api.post(`/chat/rooms/${roomId}/read/`);
      setRooms((prev) =>
        (prev || []).map((r) => (r.id === roomId ? { ...r, unread_count: 0 } : r))
      );
    } catch (e) {
      /* silent */
    }
  }, [isAuthenticated]);

  const fetchMessages = useCallback(async (roomId, { silent = false } = {}) => {
    if (!isAuthenticated || !roomId) return;
    if (!silent) setLoadingMessages(true);
    try {
      const res = await api.get(`/chat/rooms/${roomId}/messages/`);
      const list = Array.isArray(res.data) ? res.data : [];
      // newest first from backend → reverse for top-to-bottom
      const ordered = [...list].reverse();
      setMessages(ordered);

      const newest = ordered[ordered.length - 1];
      if (newest && newest.id !== lastMessageIdRef.current) {
        lastMessageIdRef.current = newest.id;
        // only auto-scroll if user is near bottom
        const el = messagesScrollRef.current;
        const nearBottom = el
          ? el.scrollHeight - el.scrollTop - el.clientHeight < 150
          : true;
        if (nearBottom || !silent) scrollToBottom();
      }
      await markMessagesAsRead(roomId);
    } catch (e) {
      if (!silent) setMessages([]);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  }, [isAuthenticated, markMessagesAsRead]);
  const fetchRooms = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    setLoadingRooms(true);
    try {
      const res = await api.get('/chat/rooms/');
      const list = Array.isArray(res.data) ? res.data : [];
      setRooms(list);
      const total = list.reduce((t, r) => t + (r.unread_count || 0), 0);
      setUnreadCount(total);
    } catch (e) {
      console.error("Failed to fetch rooms", e);
      setRooms([]);
    } finally {
      setLoadingRooms(false); // ✅ Forces loader to stop
    }
  }, [isAuthenticated, user]); // ✅ Dependencies fixed

  const fetchUsers = useCallback(async () => {
    if (!isAuthenticated || !user || initialUsersLoaded) return;
    setIsLoadingUsers(true);
    try {
      let data = [];
      try {
        const res = await api.get('/chat/status/all/');
        data = Array.isArray(res.data) ? res.data : [];
      } catch {
        const res = await api.get('/auth/users/');
        data = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      }
      const filtered = data.filter((u) => (u.user || u.id) !== user?.id);
      setUsers(filtered);
      setInitialUsersLoaded(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [isAuthenticated, user, initialUsersLoaded]);

  const fetchStatuses = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/chat/status/all/');
      const map = {};
      (Array.isArray(res.data) ? res.data : []).forEach((s) => {
        map[s.user] = s;
      });
      setStatuses(map);
    } catch {
      // silent
    }
  }, [isAuthenticated]);


  // =========================================================
  //  Actions
  // =========================================================
  const scrollToBottom = useCallback((smooth = true) => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end',
      });
    });
  }, []);

  const sendMessage = useCallback(async (overrideText) => {
    const text = (overrideText ?? messageInput).trim();
    if (!text || !selectedRoom || sending) return;

    setSending(true);

    // optimistic
    const tempId = `tmp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      sender: user.id,
      sender_name: user.full_name,
      content: text,
      message_type: 'TEXT',
      created_at: new Date().toISOString(),
      is_read: false,
      _optimistic: true,
    };
    setMessages((prev) => [...(prev || []), optimistic]);
    setMessageInput('');
    scrollToBottom();

    try {
      const res = await api.post(`/chat/rooms/${selectedRoom.id}/messages/`, {
        content: text,
        message_type: 'TEXT',
      });
      setMessages((prev) =>
        (prev || []).map((m) => (m.id === tempId ? res.data : m))
      );
      lastMessageIdRef.current = res.data.id;
      // bump room order
      setRooms((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        const updated = list.map((r) =>
          r.id === selectedRoom.id
            ? { ...r, last_message: res.data, updated_at: res.data.created_at }
            : r
        );
        updated.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        return updated;
      });
      // notify typing off
      api.post(`/chat/rooms/${selectedRoom.id}/typing/`, { is_typing: false }).catch(() => {});
    } catch (err) {
      setMessages((prev) => (prev || []).filter((m) => m.id !== tempId));
      toast.error(err.response?.data?.error || 'Failed to send message');
      setMessageInput(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [messageInput, selectedRoom, sending, user, scrollToBottom]);

  const deleteMessage = useCallback(async (msg) => {
    if (!msg || msg._optimistic) return;
    if (!window.confirm('Delete this message for everyone?')) return;
    try {
      await api.delete(`/chat/messages/${msg.id}/`);
      setMessages((prev) => (prev || []).filter((m) => m.id !== msg.id));
      toast.success('Message deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete message');
    }
  }, []);

  const saveEdit = useCallback(async (msg, newContent) => {
    const text = newContent.trim();
    if (!text || text === msg.content) {
      setEditingMessage(null);
      return;
    }
    try {
      const res = await api.patch(`/chat/messages/${msg.id}/`, { content: text });
      setMessages((prev) =>
        (prev || []).map((m) => (m.id === msg.id ? res.data : m))
      );
      setEditingMessage(null);
      toast.success('Message updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to edit message');
    }
  }, []);

  const sendTyping = useCallback(
    debounceAsync(async (isTyping) => {
      if (!selectedRoom) return;
      try {
        await api.post(`/chat/rooms/${selectedRoom.id}/typing/`, { is_typing: isTyping });
      } catch { /* silent */ }
    }, 400),
    [selectedRoom]
  );

  const createPrivateRoom = useCallback(async (userId) => {
    if (!isAuthenticated || !user) {
      toast.error('Please login to start a chat');
      return;
    }
    try {
      const res = await api.post('/chat/private-room/', { user_id: userId });
      const room = res.data;
      setRooms((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        return list.some((r) => r.id === room.id) ? list : [room, ...list];
      });
      setSelectedRoom(room);
      await fetchMessages(room.id);
      setShowUserList(false);
      setSearchTerm('');
      toast.success('Chat opened');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start chat');
    }
  }, [isAuthenticated, user, fetchMessages]);

  const uploadAttachment = useCallback(async (file) => {
    if (!file || !selectedRoom) return;
    const form = new FormData();
    form.append('content', file.name);
    form.append('message_type', file.type.startsWith('image/') ? 'IMAGE' : 'FILE');
    form.append('file', file);
    setSending(true);
    try {
      const res = await api.post(`/chat/rooms/${selectedRoom.id}/messages/`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessages((prev) => [...(prev || []), res.data]);
      scrollToBottom();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to upload');
    } finally {
      setSending(false);
    }
  }, [selectedRoom, scrollToBottom]);

  // =========================================================
  //  Polling loop
  // =========================================================
  useEffect(() => {
    if (!isOpen || !isAuthenticated || !user) return;

    fetchRooms();
    fetchStatuses();
    fetchUsers();

    const tick = () => {
      const rid = selectedRoomIdRef.current;
      if (rid) fetchMessages(rid, { silent: true });
      fetchRooms();
      fetchStatuses();
    };

    pollingRef.current = setInterval(tick, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isOpen, isAuthenticated, user]);

  // typing indicator (fake — turn off after 3s)
  useEffect(() => {
    if (!selectedRoom) return;
    const t = setInterval(() => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        const roomTyping = next[selectedRoom.id];
        if (roomTyping) {
          Object.keys(roomTyping).forEach((uid) => {
            if (Date.now() - roomTyping[uid].ts > 4000) delete roomTyping[uid];
          });
          if (Object.keys(roomTyping).length === 0) delete next[selectedRoom.id];
        }
        return next;
      });
    }, 1500);
    return () => clearInterval(t);
  }, [selectedRoom]);

  // track scroll position for "scroll to bottom" button
  const onMessagesScroll = () => {
    const el = messagesScrollRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollDown(dist > 250);
  };

  // =========================================================
  //  Derived data
  // =========================================================
  const filteredUsers = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return (users || []).filter((u) => {
      const name = (u.full_name || u.user?.full_name || '').toLowerCase();
      const email = (u.email || u.user?.email || '').toLowerCase();
      return !q || name.includes(q) || email.includes(q);
    });
  }, [users, searchTerm]);

  const filteredMessages = useMemo(() => {
    if (!messageSearch.trim()) return messages;
    const q = messageSearch.toLowerCase();
    return (messages || []).filter((m) => (m.content || '').toLowerCase().includes(q));
  }, [messages, messageSearch]);

  const roomTitle = useCallback((room) => {
    if (!room) return 'Chat';
    if (room.name) return room.name;
    const others = (room.participants_info || []).filter((p) => p.id !== user?.id);
    if (others.length) return others.map((p) => p.full_name).join(', ');
    return room.room_type === 'PRIVATE' ? 'Private Chat' : 'Group Chat';
  }, [user]);

  const roomAvatar = useCallback((room) => {
    const others = (room.participants_info || []).filter((p) => p.id !== user?.id);
    const person = others[0];
    return person?.full_name?.charAt(0)?.toUpperCase() || '#';
  }, [user]);

  const statusFor = useCallback((userId) => {
    const s = statuses[userId];
    return s?.status || 'OFFLINE';
  }, [statuses]);

  const statusColor = (s) => ({
    ONLINE: '#22c55e',
    AWAY: '#f59e0b',
    BUSY: '#dc2626',
    OFFLINE: '#94a3b8',
  }[s] || '#94a3b8');

  // =========================================================
  //  Render
  // =========================================================
  // Floating button (closed state)
  if (!isAuthenticated || !user) return null;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed', bottom: 24, right: 24, width: 62, height: 62,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
          color: '#fff', border: 'none', cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(37,99,235,0.4)',
          zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        title="Open chat"
      >
        <MessageSquare size={28} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: '#dc2626', color: '#fff',
            fontSize: 11, fontWeight: 700,
            minWidth: 20, height: 20, padding: '0 5px',
            borderRadius: 10, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    );
  }

  // ------- open panel -------
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24,
      width: 420, maxWidth: 'calc(100vw - 24px)',
      height: 620, maxHeight: 'calc(100vh - 48px)',
      background: '#fff', borderRadius: 16,
      boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      border: '1px solid #e2e8f0',
      zIndex: 1000, display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>

      {/* ============ HEADER ============ */}
      <div style={{
        background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
        color: '#fff', padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
        flexShrink: 0,
      }}>
        {selectedRoom && (
          <button
            onClick={() => { setSelectedRoom(null); setMessageSearch(''); setShowMessageSearch(false); }}
            style={iconBtnStyle('#fff')}
            title="Back"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedRoom ? roomTitle(selectedRoom) : 'Messages'}
          </div>
          <div style={{ fontSize: 11, opacity: 0.85 }}>
            {selectedRoom
              ? `${selectedRoom.participants?.length || 0} participant(s)`
              : 'Chat with your contacts'}
          </div>
        </div>

        {selectedRoom && (
          <button
            onClick={() => setShowMessageSearch((v) => !v)}
            style={iconBtnStyle('#fff')}
            title="Search in conversation"
          >
            <Search size={18} />
          </button>
        )}
        <button
          onClick={() => setIsOpen(false)}
          style={iconBtnStyle('#fff')}
          title="Close"
        >
          <X size={20} />
        </button>
      </div>

      {/* ============ MESSAGE SEARCH BAR ============ */}
      {selectedRoom && showMessageSearch && (
        <div style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <input
            autoFocus
            value={messageSearch}
            onChange={(e) => setMessageSearch(e.target.value)}
            placeholder="Search messages..."
            style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
          />
        </div>
      )}

      {/* ============ USER PICKER ============ */}
      {showUserList && !selectedRoom && (
        <div style={{ padding: 12, borderBottom: '1px solid #e2e8f0', background: '#f8fafc', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#94a3b8' }} />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search contacts..."
                style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <button
              onClick={fetchUsers}
              style={{ padding: '0 10px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer' }}
              title="Refresh users"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {isLoadingUsers ? (
              <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>
                <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 13 }}>
                <UserPlus size={24} style={{ marginBottom: 6, opacity: 0.4 }} />
                <div>No contacts found</div>
              </div>
            ) : (
              filteredUsers.map((u) => {
                const uid = u.user || u.id;
                const name = u.full_name || u.user?.full_name || 'Unknown';
                const email = u.email || u.user?.email || '';
                const status = statusFor(uid);
                return (
                  <div
                    key={uid}
                    onClick={() => createPrivateRoom(uid)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                      marginBottom: 4, background: '#fff',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#eff6ff'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                  >
                    <div style={{ position: 'relative' }}>
                      <Avatar text={name.charAt(0)} />
                      <span style={{
                        position: 'absolute', bottom: 0, right: 0,
                        width: 10, height: 10, borderRadius: '50%',
                        background: statusColor(status), border: '2px solid #fff',
                      }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {name}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {email}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ============ BODY ============ */}
      {!selectedRoom ? (
        // ---------- ROOM LIST ----------
        <>
          <div style={{ padding: '8px 12px', flexShrink: 0 }}>
            <button
              onClick={() => { setShowUserList((v) => !v); if (!initialUsersLoaded) fetchUsers(); }}
              style={{
                width: '100%', padding: '9px 12px',
                background: showUserList ? '#e2e8f0' : '#eff6ff',
                color: showUserList ? '#334155' : '#2563eb',
                border: 'none', borderRadius: 8, cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <Plus size={16} />
              {showUserList ? 'Cancel' : 'New chat'}
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px' }}>
            {loadingRooms && rooms.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            ) : rooms.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: '#94a3b8' }}>
                <MessageSquare size={44} style={{ opacity: 0.3, marginBottom: 8 }} />
                <div style={{ fontWeight: 600, color: '#64748b' }}>No conversations yet</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Click "New chat" to start</div>
              </div>
            ) : (
              rooms.map((room) => {
                const last = room.last_message;
                const unread = room.unread_count || 0;
                return (
                  <div
                    key={room.id}
                    onClick={() => { setSelectedRoom(room); fetchMessages(room.id); }}
                    style={{
                      display: 'flex', gap: 10, padding: 10,
                      borderRadius: 10, cursor: 'pointer', marginBottom: 2,
                      background: '#fff', alignItems: 'center',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                  >
                    <Avatar text={roomAvatar(room)} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {roomTitle(room)}
                        </div>
                        {last && (
                          <div style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0, marginLeft: 8 }}>
                            {formatRelative(last.created_at || room.updated_at)}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                        <div style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {last
                            ? `${last.sender === user.id ? 'You: ' : `${last.sender_name}: `}${last.content}`
                            : 'No messages yet'}
                        </div>
                        {unread > 0 && (
                          <span style={{
                            background: '#2563eb', color: '#fff',
                            fontSize: 10, fontWeight: 700,
                            minWidth: 18, height: 18, padding: '0 5px',
                            borderRadius: 9, display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            marginLeft: 8,
                          }}>{unread}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        // ---------- MESSAGE THREAD ----------
        <>
          <div
            ref={messagesScrollRef}
            onScroll={onMessagesScroll}
            style={{
              flex: 1, overflowY: 'auto', padding: '12px 14px',
              background: '#f8fafc', position: 'relative',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {loadingMessages ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                <Loader size={22} style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            ) : filteredMessages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                <MessageSquare size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
                <div>{messageSearch ? 'No matches' : 'No messages yet — say hi 👋'}</div>
              </div>
            ) : (
              filteredMessages.map((msg, idx) => {
                const prev = filteredMessages[idx - 1];
                const showDay = !prev || !sameDay(prev.created_at, msg.created_at);
                const isMine = msg.sender === user.id;
                const isEditing = editingMessage?.id === msg.id;

                return (
                  <React.Fragment key={msg.id}>
                    {showDay && (
                      <div style={{
                        textAlign: 'center', margin: '10px 0 6px',
                        fontSize: 11, color: '#94a3b8', fontWeight: 600,
                      }}>
                        {dayLabel(msg.created_at)}
                      </div>
                    )}
                    <div style={{
                      display: 'flex',
                      justifyContent: isMine ? 'flex-end' : 'flex-start',
                      marginBottom: 6,
                    }}>
                      <div style={{
                        maxWidth: '80%', display: 'flex', flexDirection: 'column',
                        alignItems: isMine ? 'flex-end' : 'flex-start',
                      }}>
                        {!isMine && (
                          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2, paddingLeft: 4 }}>
                            {msg.sender_name}
                          </div>
                        )}
                        <div style={{
                          position: 'relative',
                          background: isMine
                            ? 'linear-gradient(135deg, #2563eb, #7c3aed)'
                            : '#fff',
                          color: isMine ? '#fff' : '#0f172a',
                          padding: '8px 12px',
                          borderRadius: 14,
                          borderTopRightRadius: isMine ? 4 : 14,
                          borderTopLeftRadius: isMine ? 14 : 4,
                          border: isMine ? 'none' : '1px solid #e2e8f0',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                          fontSize: 14, lineHeight: 1.4,
                          wordBreak: 'break-word',
                          opacity: msg._optimistic ? 0.7 : 1,
                        }}>
                          {isEditing ? (
                            <EditBox
                              initial={msg.content}
                              onCancel={() => setEditingMessage(null)}
                              onSave={(t) => saveEdit(msg, t)}
                            />
                          ) : (
                            <>
                              {msg.message_type === 'IMAGE' && msg.file && (
                                <img
                                  src={msg.file}
                                  alt="attachment"
                                  style={{ maxWidth: '100%', borderRadius: 8, marginBottom: 4 }}
                                />
                              )}
                              {msg.message_type === 'FILE' && msg.file && (
                                <a
                                  href={msg.file}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ color: 'inherit', textDecoration: 'underline' }}
                                >
                                  📎 {msg.content}
                                </a>
                              )}
                              {msg.message_type === 'TEXT' && <span>{msg.content}</span>}
                              <div style={{
                                display: 'flex', alignItems: 'center',
                                justifyContent: 'flex-end', gap: 4,
                                fontSize: 10, marginTop: 3,
                                opacity: isMine ? 0.85 : 0.6,
                              }}>
                                <span>{formatTime(msg.created_at)}</span>
                                {isMine && (
                                  <>
                                    {msg.is_read
                                      ? <CheckCheck size={12} />
                                      : <Check size={12} />}
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </div>

                        {isMine && !msg._optimistic && !isEditing && (
                          <div style={{
                            display: 'flex', gap: 6, marginTop: 2,
                            fontSize: 10, opacity: 0.7,
                          }}>
                            <button
                              onClick={() => setEditingMessage(msg)}
                              style={smallLinkBtn}
                              title="Edit"
                            >
                              <Pencil size={11} /> Edit
                            </button>
                            <button
                              onClick={() => deleteMessage(msg)}
                              style={{ ...smallLinkBtn, color: '#dc2626' }}
                              title="Delete"
                            >
                              <Trash2 size={11} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* typing indicator */}
          {typingUsers[selectedRoom.id] && Object.keys(typingUsers[selectedRoom.id]).length > 0 && (
            <div style={{ padding: '4px 16px', background: '#f8fafc', fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>
              {Object.values(typingUsers[selectedRoom.id]).map((t) => t.name).join(', ')} typing…
            </div>
          )}

          {/* scroll-down button */}
          {showScrollDown && (
            <button
              onClick={() => scrollToBottom()}
              style={{
                position: 'absolute', bottom: 78, right: 24,
                width: 34, height: 34, borderRadius: '50%',
                background: '#fff', border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                cursor: 'pointer', zIndex: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              title="Scroll to bottom"
            >
              <ArrowDown size={16} />
            </button>
          )}

          {/* input */}
          <div style={{
            padding: 10, borderTop: '1px solid #e2e8f0',
            display: 'flex', gap: 6, alignItems: 'center',
            background: '#fff', flexShrink: 0,
          }}>
            <label style={{ ...iconBtnStyle('#64748b'), cursor: 'pointer' }} title="Attach">
              <Paperclip size={18} />
              <input
                type="file"
                hidden
                accept="image/*,.pdf,.doc,.docx,.zip"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadAttachment(f);
                  e.target.value = '';
                }}
              />
            </label>

            <input
              ref={inputRef}
              type="text"
              value={messageInput}
              onChange={(e) => {
                setMessageInput(e.target.value);
                sendTyping(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type a message..."
              style={{
                flex: 1, padding: '9px 12px',
                border: '1px solid #e2e8f0', borderRadius: 20,
                fontSize: 14, outline: 'none', background: '#f8fafc',
              }}
            />

            <button
              onClick={() => sendMessage()}
              disabled={sending || !messageInput.trim()}
              style={{
                width: 40, height: 40, borderRadius: '50%', border: 'none',
                background: sending || !messageInput.trim()
                  ? '#cbd5e1'
                  : 'linear-gradient(135deg, #2563eb, #7c3aed)',
                color: '#fff',
                cursor: sending || !messageInput.trim() ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              title="Send"
            >
              <Send size={16} />
            </button>
          </div>
        </>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

// =========================================================
//  Small sub-components + inline styles
// =========================================================
const Avatar = ({ text = '#' }) => (
  <div style={{
    width: 38, height: 38, borderRadius: '50%',
    background: 'linear-gradient(135deg, #dbeafe, #e9d5ff)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#6d28d9', fontWeight: 700, fontSize: 14, flexShrink: 0,
  }}>
    {text}
  </div>
);

const EditBox = ({ initial, onSave, onCancel }) => {
  const [val, setVal] = useState(initial);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 180 }}>
      <input
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSave(val);
          if (e.key === 'Escape') onCancel();
        }}
        style={{
          padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.4)',
          background: 'rgba(255,255,255,0.15)', color: 'inherit',
          fontSize: 14, outline: 'none',
        }}
      />
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', fontSize: 11 }}>
        <button onClick={onCancel} style={smallLinkBtn}>Cancel</button>
        <button onClick={() => onSave(val)} style={{ ...smallLinkBtn, fontWeight: 700 }}>Save</button>
      </div>
    </div>
  );
};

const iconBtnStyle = (color) => ({
  background: 'rgba(255,255,255,0.15)',
  border: 'none', color, cursor: 'pointer',
  padding: 6, borderRadius: 8,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
});

const smallLinkBtn = {
  background: 'transparent',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  color: 'inherit',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 3,
  fontSize: 11,
};

// debounce helper for typing indicator
function debounceAsync(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    return new Promise((res) => {
      t = setTimeout(() => res(fn(...args)), wait);
    });
  };
}

export default ChatWidget;