import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000' 
  : 'https://nichelink-exke.onrender.com';

// Direct socket instance for real-time global chat sync
const socket = io(API_BASE_URL, {
  transports: ['websocket', 'polling'],
  forceNew: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

function Chats() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState('Member');

  useEffect(() => {
    // Fetch logged in username from localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.username) setCurrentUser(parsed.username);
      } catch (e) {
        console.error(e);
      }
    }

    // Join global room on mount
    socket.emit('join_community', 'global_chat');

    // Listen for incoming live real-time messages
    const handleGlobalMessage = (data) => {
      setMessages((prev) => {
        const exists = prev.some(m => m._id === data._id);
        if (exists) return prev;
        return [...prev, data];
      });
    };

    socket.on('receive_community_message', handleGlobalMessage);

    return () => {
      socket.emit('leave_community', 'global_chat');
      socket.off('receive_community_message', handleGlobalMessage);
    };
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageData = {
      _id: Date.now().toString(),
      communityId: 'global_chat',
      author: currentUser,
      content: newMessage.trim(),
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Emit live socket event to all clients
    socket.emit('send_community_message', messageData);

    // Update local chat view immediately
    setMessages((prev) => [...prev, messageData]);
    setNewMessage('');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 140px)',
      background: '#1e293b',
      borderRadius: '14px',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, color: '#f8fafc' }}>💬 Live Global Community Chat</h3>
        <span style={{ fontSize: '12px', color: '#10b981' }}>● Socket Connected Real-Time</span>
      </div>

      {/* Messages Feed Area */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '5px' }}>
        {messages.length === 0 ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: '40px' }}>No messages yet. Send the first message!</p>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.author === currentUser;
            return (
              <div 
                key={msg._id || index} 
                style={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '70%',
                  background: isMe ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : '#0f172a',
                  color: '#ffffff',
                  padding: '10px 14px',
                  borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}
              >
                <div style={{ fontSize: '11px', color: isMe ? '#c7d2fe' : '#818cf8', fontWeight: 'bold', marginBottom: '4px' }}>
                  {msg.author} • <span style={{ opacity: 0.8 }}>{msg.createdAt}</span>
                </div>
                <div style={{ fontSize: '14px', lineHeight: '1.4' }}>{msg.content}</div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Message Form */}
      <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
        <input 
          type="text" 
          placeholder="Type a message to real-time chat..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            outline: 'none',
            fontSize: '14px'
          }}
        />
        <button 
          type="submit" 
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            color: '#ffffff',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Send 🚀
        </button>
      </form>
    </div>
  );
}

export default Chats;