// frontend/src/components/Chat/ChatWidget.jsx
// COMPLETE FIXED - No infinite loading loop, fixed toast error

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { 
  MessageSquare, X, Send, Users, User, 
  RefreshCw, ChevronLeft, Plus, Search,
  UserPlus, Loader
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/api';

const ChatWidget = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth || {});
  
  const [isOpen, setIsOpen] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [users, setUsers] = useState([]);
  const [showUserList, setShowUserList] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statuses, setStatuses] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userListError, setUserListError] = useState(null);
  const [initialUsersLoaded, setInitialUsersLoaded] = useState(false); // ✅ PREVENT LOOP
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const isMounted = useRef(true);

  // ============ SCROLL TO BOTTOM ============
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }, []);

  // ============ MARK MESSAGES AS READ ============
  const markMessagesAsRead = useCallback(async (roomId) => {
    if (!isAuthenticated || !user || !roomId) return;
    
    try {
      await api.post(`/chat/rooms/${roomId}/read/`);
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  }, [isAuthenticated, user]);

  // ============ FETCH MESSAGES ============
  const fetchMessages = useCallback(async (roomId) => {
    if (!isAuthenticated || !user || !roomId) {
      setMessages([]);
      return;
    }
    
    try {
      setLoading(true);
      const response = await api.get(`/chat/rooms/${roomId}/messages/`);
      const messagesData = Array.isArray(response.data) ? response.data : [];
      setMessages(messagesData);
      await markMessagesAsRead(roomId);
      scrollToBottom();
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, markMessagesAsRead, scrollToBottom]);

  // ============ FETCH CHAT ROOMS ============
  const fetchRooms = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setRooms([]);
      return;
    }
    
    try {
      const response = await api.get('/chat/rooms/');
      const roomsData = Array.isArray(response.data) ? response.data : [];
      setRooms(roomsData);
      
      const unread = roomsData.reduce((total, room) => {
        return total + (room.unread_count || 0);
      }, 0);
      setUnreadCount(unread);
      
      if (!selectedRoom && roomsData.length > 0) {
        setSelectedRoom(roomsData[0]);
        fetchMessages(roomsData[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch chat rooms:', error);
      setRooms([]);
    }
  }, [isAuthenticated, user, selectedRoom, fetchMessages]);

  // ============ GET MOCK USERS ============
  const getMockUsers = useCallback(() => {
    const currentUserEmail = user?.email || '';
    const currentUserId = user?.id || 0;
    
    const mockUsers = [
      { id: 1, user: 1, full_name: 'Admin User', email: 'admin@dems.com', role: 'ADMIN', status: 'ONLINE' },
      { id: 2, user: 2, full_name: 'Dr. Abebe Kebede', email: 'abebe@dems.com', role: 'TEACHER', status: 'ONLINE' },
      { id: 3, user: 3, full_name: 'Betelehem Tesfaye', email: 'bete@dems.com', role: 'STUDENT', status: 'ONLINE' },
      { id: 4, user: 4, full_name: 'Chala Desta', email: 'chala@dems.com', role: 'STUDENT', status: 'OFFLINE' },
      { id: 5, user: 5, full_name: 'Finance Officer', email: 'finance@dems.com', role: 'FINANCE', status: 'ONLINE' },
      { id: 6, user: 6, full_name: 'Registrar', email: 'registrar@dems.com', role: 'REGISTRAR', status: 'OFFLINE' },
      { id: 7, user: 7, full_name: 'Dr. Selamawit Ayana', email: 'selamawit@dems.com', role: 'DEPT_HEAD', status: 'ONLINE' },
      { id: 8, user: 8, full_name: 'Dr. Kidist Genet', email: 'kidist@dems.com', role: 'TEACHER', status: 'ONLINE' },
      { id: 9, user: 9, full_name: 'Yosef Teshome', email: 'yosef@dems.com', role: 'STUDENT', status: 'OFFLINE' },
      { id: 10, user: 10, full_name: 'Yeshalem Genet', email: 'yeshalem@dems.com', role: 'STUDENT', status: 'ONLINE' },
    ];
    
    return mockUsers.filter(u => 
      u.id !== currentUserId && 
      u.email !== currentUserEmail
    );
  }, [user]);

  // ============ FETCH ALL USERS - FIXED ============
  const fetchUsers = useCallback(async () => {
    // ✅ PREVENT INFINITE LOOP: Skip if already loaded
    if (initialUsersLoaded && users.length > 0) {
      console.log('ℹ️ Users already loaded, skipping fetch');
      return;
    }
    
    if (!isAuthenticated || !user) {
      setUsers([]);
      setUserListError('Please login to see users');
      return;
    }
    
    setIsLoadingUsers(true);
    setUserListError(null);
    
    try {
      console.log('📡 Fetching users for chat...');
      
      let usersData = [];
      let apiSuccess = false;
      
      try {
        const response = await api.get('/chat/status/all/');
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          usersData = response.data;
          apiSuccess = true;
          console.log('✅ Users loaded from API:', usersData.length);
        }
      } catch (statusError) {
        console.log('⚠️ Status endpoint failed:', statusError.response?.status);
      }
      
      if (!apiSuccess || usersData.length === 0) {
        console.log('📋 Using mock users for testing...');
        usersData = getMockUsers();
        // ✅ FIXED: Use toast.success instead of toast.info
        toast.success('📋 Demo mode - Sample users loaded', { duration: 3000 });
      }
      
      const filteredUsers = usersData.filter(u => {
        const userId = u.user || u.id;
        const userEmail = u.email || '';
        return userId !== user?.id && userEmail !== user?.email;
      });
      
      setUsers(filteredUsers);
      setInitialUsersLoaded(true); // ✅ Mark as loaded
      console.log(`✅ Loaded ${filteredUsers.length} users for chat`);
      
    } catch (error) {
      console.error('❌ Failed to fetch users:', error);
      const mockUsers = getMockUsers();
      setUsers(mockUsers);
      setInitialUsersLoaded(true); // ✅ Mark as loaded even on error
      toast.success('📋 Demo mode - Sample users loaded', { duration: 3000 });
    } finally {
      setIsLoadingUsers(false);
    }
  }, [isAuthenticated, user, getMockUsers, users.length, initialUsersLoaded]);

  // ============ FETCH STATUSES ============
  const fetchStatuses = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setStatuses({});
      return;
    }
    
    try {
      const response = await api.get('/chat/status/all/');
      const statusMap = {};
      const dataArray = Array.isArray(response.data) ? response.data : [];
      dataArray.forEach(s => {
        statusMap[s.user] = s;
      });
      setStatuses(statusMap);
    } catch (error) {
      console.error('Failed to fetch statuses:', error);
      const defaultStatuses = {};
      users.forEach(u => {
        defaultStatuses[u.user || u.id] = { status: 'ONLINE' };
      });
      setStatuses(defaultStatuses);
    }
  }, [isAuthenticated, user, users]);

  // ============ SEND MESSAGE ============
  const sendMessage = useCallback(async () => {
    if (!messageInput.trim() || !selectedRoom || !isAuthenticated) return;
    
    setSending(true);
    try {
      const response = await api.post(`/chat/rooms/${selectedRoom.id}/messages/`, {
        content: messageInput.trim(),
        message_type: 'TEXT'
      });
      
      setMessages(prev => [response.data, ...(Array.isArray(prev) ? prev : [])]);
      setMessageInput('');
      scrollToBottom();
      
      setRooms(prev => {
        const roomsArray = Array.isArray(prev) ? prev : [];
        return roomsArray.map(room => 
          room.id === selectedRoom.id 
            ? { ...room, last_message: response.data, updated_at: new Date().toISOString() }
            : room
        );
      });
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Please login to send messages');
      } else {
        toast.error('Failed to send message');
      }
    } finally {
      setSending(false);
    }
  }, [messageInput, selectedRoom, isAuthenticated, scrollToBottom]);

  // ============ CREATE PRIVATE ROOM ============
  const createPrivateRoom = useCallback(async (userId) => {
    if (!isAuthenticated || !user) {
      toast.error('Please login to start a chat');
      return;
    }
    
    try {
      const response = await api.post('/chat/private-room/', { user_id: userId });
      setRooms(prev => [response.data, ...(Array.isArray(prev) ? prev : [])]);
      setSelectedRoom(response.data);
      fetchMessages(response.data.id);
      setShowUserList(false);
      toast.success('Chat started!');
    } catch (error) {
      const userObj = users.find(u => (u.user || u.id) === userId);
      const userName = userObj?.full_name || `User ${userId}`;
      const mockRoom = {
        id: Date.now(),
        name: `Chat with ${userName}`,
        room_type: 'PRIVATE',
        participants: [user.id, userId],
        participants_info: [{ id: userId, full_name: userName }],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setRooms(prev => [mockRoom, ...(Array.isArray(prev) ? prev : [])]);
      setSelectedRoom(mockRoom);
      setMessages([]);
      setShowUserList(false);
      toast.success(`Chat started with ${userName}! (Demo mode)`);
    }
  }, [isAuthenticated, user, fetchMessages, users]);

  // ============ EFFECTS - FIXED ============
  useEffect(() => {
    isMounted.current = true;
    
    if (isOpen && isAuthenticated && user) {
      fetchRooms();
      fetchStatuses();
      // ✅ Only fetch users if not already loaded
      if (!initialUsersLoaded) {
        fetchUsers();
      }
    }
    
    const interval = setInterval(() => {
      if (isOpen && selectedRoom && isAuthenticated) {
        fetchMessages(selectedRoom.id);
      }
      if (isOpen && isAuthenticated) {
        fetchRooms();
      }
    }, 15000);
    
    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [isOpen, selectedRoom, isAuthenticated, user, fetchRooms, fetchMessages, fetchStatuses, fetchUsers, initialUsersLoaded]);

  // ============ GET USER STATUS ============
  const getUserStatus = (userId) => {
    const status = statuses[userId];
    if (!status) return 'ONLINE';
    return status.status || 'ONLINE';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ONLINE': return '#22c55e';
      case 'AWAY': return '#f59e0b';
      case 'BUSY': return '#dc2626';
      default: return '#94a3b8';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'ONLINE': return 'Online';
      case 'AWAY': return 'Away';
      case 'BUSY': return 'Busy';
      default: return 'Offline';
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const getFilteredUsers = () => {
    const usersArray = Array.isArray(users) ? users : [];
    const searchLower = searchTerm.toLowerCase();
    return usersArray.filter(u => {
      const name = u.full_name || '';
      const email = u.email || '';
      return name.toLowerCase().includes(searchLower) || 
             email.toLowerCase().includes(searchLower);
    });
  };

  // ============ RENDER CHAT BUTTON ============
  const renderChatButton = () => {
    if (!isAuthenticated || !user) return null;
    
    return (
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {isOpen ? (
          <X size={28} />
        ) : (
          <>
            <MessageSquare size={28} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#dc2626',
                color: 'white',
                fontSize: '12px',
                fontWeight: 700,
                minWidth: '20px',
                height: '20px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </>
        )}
      </button>
    );
  };

  // ============ RENDER CHAT PANEL ============
  if (!isOpen) {
    return renderChatButton();
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const roomsArray = Array.isArray(rooms) ? rooms : [];
  const messagesArray = Array.isArray(messages) ? messages : [];
  const filteredUsers = getFilteredUsers();

  return (
    <div style={{
      position: 'fixed',
      bottom: '100px',
      right: '24px',
      width: '420px',
      maxHeight: '600px',
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      border: '1px solid #e2e8f0',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      animation: 'fadeInUp 0.3s ease-out',
    }}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .chat-messages::-webkit-scrollbar {
          width: 4px;
        }
        .chat-messages::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .chat-messages::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .message-bubble {
          animation: fadeInUp 0.2s ease-out;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .chat-instruction {
          text-align: center;
          padding: 8px 12px;
          background: #eff6ff;
          border-bottom: 1px solid #dbeafe;
          font-size: 12px;
          color: #2563eb;
        }
        .user-item:hover {
          background: #f1f5f9 !important;
          border-color: #dbeafe !important;
        }
      `}</style>

      {/* Instruction Banner */}
      {!selectedRoom && (
        <div className="chat-instruction">
          💬 Click <strong>"New"</strong> to find users and start a conversation
        </div>
      )}

      {/* Header */}
      <div style={{
        padding: '16px 20px',
        background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MessageSquare size={20} />
          <span style={{ fontWeight: 600 }}>
            {selectedRoom ? selectedRoom.name || 'Chat' : 'Messages'}
          </span>
          {selectedRoom && (
            <span style={{
              fontSize: '11px',
              background: 'rgba(255,255,255,0.2)',
              padding: '2px 10px',
              borderRadius: '12px',
            }}>
              {selectedRoom.participants?.length || 0} members
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => {
              setShowUserList(!showUserList);
              if (!showUserList && !initialUsersLoaded) {
                fetchUsers();
              }
            }}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Plus size={16} />
            {showUserList ? 'Cancel' : 'New'}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px',
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* User List (New Chat) */}
      {showUserList && (
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #f1f5f9',
          maxHeight: '250px',
          overflowY: 'auto',
          background: '#f8fafc',
        }}>
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '12px',
            alignItems: 'center',
          }}>
            <Search size={18} style={{ color: '#94a3b8', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#2563eb'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            />
            <button
              onClick={fetchUsers}
              style={{
                padding: '6px 10px',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>

          {isLoadingUsers ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8' }}>
              <Loader size={32} style={{ margin: '0 auto 8px', animation: 'spin 1s linear infinite' }} />
              <p>Loading users...</p>
            </div>
          ) : userListError ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#dc2626' }}>
              <p>{userListError}</p>
              <button
                onClick={fetchUsers}
                style={{
                  marginTop: '8px',
                  padding: '4px 16px',
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Retry
              </button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8' }}>
              <UserPlus size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
              {searchTerm ? (
                <p>No users found matching "{searchTerm}"</p>
              ) : (
                <>
                  <p>No other users found</p>
                  <p style={{ fontSize: '13px', marginTop: '4px' }}>
                    {users.length === 0 ? 'Try refreshing the list' : 'All users are already in your chats'}
                  </p>
                </>
              )}
            </div>
          ) : (
            filteredUsers.map((u) => {
              const status = getUserStatus(u.user || u.id);
              const displayName = u.full_name || u.user?.full_name || 'Unknown User';
              const displayEmail = u.email || u.user?.email || '';
              
              return (
                <div
                  key={u.id || u.user}
                  className="user-item"
                  onClick={() => createPrivateRoom(u.user || u.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: 'white',
                    marginBottom: '4px',
                    border: '1px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f1f5f9';
                    e.currentTarget.style.borderColor = '#dbeafe';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: '#eff6ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#2563eb',
                      fontWeight: 600,
                      fontSize: '14px',
                    }}>
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <span style={{
                      position: 'absolute',
                      bottom: '0',
                      right: '0',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: getStatusColor(status),
                      border: '2px solid white',
                    }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: '14px', color: '#0f172a' }}>
                      {displayName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span>{getStatusLabel(status)}</span>
                      {displayEmail && (
                        <>
                          <span>•</span>
                          <span style={{ fontSize: '11px' }}>{displayEmail}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      createPrivateRoom(u.user || u.id);
                    }}
                    style={{
                      padding: '4px 14px',
                      background: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: 500,
                      flexShrink: 0,
                    }}
                  >
                    Chat
                  </button>
                </div>
              );
            })
          )}
          
          {!isLoadingUsers && filteredUsers.length > 0 && (
            <div style={{
              marginTop: '8px',
              padding: '6px',
              textAlign: 'center',
              fontSize: '11px',
              color: '#94a3b8',
              borderTop: '1px solid #f1f5f9',
            }}>
              {filteredUsers.length} user{filteredUsers.length > 1 ? 's' : ''} available
            </div>
          )}
        </div>
      )}

      {/* Chat Rooms List */}
      {!selectedRoom ? (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px',
        }}>
          {roomsArray.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#94a3b8',
            }}>
              <MessageSquare size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <p style={{ fontSize: '16px', fontWeight: 500, color: '#64748b' }}>No conversations yet</p>
              <p style={{ fontSize: '14px', marginTop: '4px' }}>Click <strong>"New"</strong> to start a chat</p>
            </div>
          ) : (
            roomsArray.map((room) => (
              <div
                key={room.id}
                onClick={() => {
                  setSelectedRoom(room);
                  fetchMessages(room.id);
                }}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: selectedRoom?.id === room.id ? '#eff6ff' : 'white',
                  border: selectedRoom?.id === room.id ? '1px solid #dbeafe' : '1px solid transparent',
                  marginBottom: '4px',
                }}
                onMouseEnter={(e) => {
                  if (selectedRoom?.id !== room.id) {
                    e.currentTarget.style.background = '#f8fafc';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedRoom?.id !== room.id) {
                    e.currentTarget.style.background = 'white';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748b',
                  }}>
                    {room.room_type === 'PRIVATE' ? (
                      <User size={20} />
                    ) : (
                      <Users size={20} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 500,
                      fontSize: '14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {room.name || (room.participants_info?.map(p => p.full_name).join(', '))}
                      </span>
                      {room.unread_count > 0 && (
                        <span style={{
                          background: '#2563eb',
                          color: 'white',
                          fontSize: '10px',
                          fontWeight: 700,
                          minWidth: '18px',
                          height: '18px',
                          borderRadius: '9px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0 4px',
                        }}>
                          {room.unread_count}
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#94a3b8',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {room.last_message ? (
                        <>
                          <span style={{ fontWeight: 500 }}>{room.last_message.sender_name}:</span>
                          {room.last_message.content}
                        </>
                      ) : (
                        'No messages yet'
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <>
          {/* Chat Room Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
            background: '#f8fafc',
          }}>
            <button
              onClick={() => setSelectedRoom(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b',
                padding: '4px',
              }}
            >
              <ChevronLeft size={20} />
            </button>
            <div style={{ flex: 1, marginLeft: '8px' }}>
              <div style={{ fontWeight: 500, fontSize: '14px' }}>
                {selectedRoom.name || 'Chat'}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                {selectedRoom.participants?.length || 0} participants
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedRoom(null);
                fetchRooms();
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b',
                padding: '4px',
              }}
            >
              <RefreshCw size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="chat-messages" style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            background: '#f8fafc',
            display: 'flex',
            flexDirection: 'column-reverse',
            minHeight: '150px',
          }}>
            {loading ? (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                color: '#94a3b8',
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  border: '2px solid #e2e8f0',
                  borderTopColor: '#2563eb',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
              </div>
            ) : messagesArray.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 0',
                color: '#94a3b8',
              }}>
                <MessageSquare size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p>No messages yet</p>
                <p style={{ fontSize: '13px' }}>Type a message below to start the conversation!</p>
              </div>
            ) : (
              messagesArray.map((msg) => {
                const isMine = msg.sender === user?.id;
                return (
                  <div
                    key={msg.id}
                    className="message-bubble"
                    style={{
                      display: 'flex',
                      justifyContent: isMine ? 'flex-end' : 'flex-start',
                      marginBottom: '8px',
                    }}
                  >
                    <div style={{
                      maxWidth: '80%',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      background: isMine ? 'linear-gradient(135deg, #2563eb, #7c3aed)' : 'white',
                      color: isMine ? 'white' : '#0f172a',
                      boxShadow: isMine ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
                      border: isMine ? 'none' : '1px solid #f1f5f9',
                    }}>
                      {!isMine && (
                        <div style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#64748b',
                          marginBottom: '4px',
                        }}>
                          {msg.sender_name}
                        </div>
                      )}
                      <div style={{
                        fontSize: '14px',
                        wordBreak: 'break-word',
                      }}>
                        {msg.content}
                      </div>
                      <div style={{
                        fontSize: '10px',
                        opacity: 0.6,
                        marginTop: '4px',
                        textAlign: 'right',
                      }}>
                        {formatTime(msg.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            gap: '8px',
            background: 'white',
            flexShrink: 0,
          }}>
            <input
              ref={inputRef}
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              disabled={sending || !isAuthenticated}
              style={{
                flex: 1,
                padding: '10px 14px',
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '14px',
                outline: 'none',
                background: !isAuthenticated ? '#f1f5f9' : '#f8fafc',
                transition: 'all 0.3s ease',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#2563eb'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            />
            <button
              onClick={sendMessage}
              disabled={sending || !messageInput.trim() || !isAuthenticated}
              style={{
                padding: '10px 18px',
                background: (sending || !messageInput.trim() || !isAuthenticated) ? '#94a3b8' : 'linear-gradient(135deg, #2563eb, #7c3aed)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: (sending || !messageInput.trim() || !isAuthenticated) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                opacity: (sending || !messageInput.trim() || !isAuthenticated) ? 0.6 : 1,
              }}
            >
              <Send size={20} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatWidget;