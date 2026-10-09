import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

function Chats() {
  const [room, setRoom] = useState('general');
  const [message, setMessage] = useState('');
  const [messageList, setMessageList] = useState([]);
  const [username, setUsername] = useState('User');
  
  const socketRef = useRef(null);

  // Fetch logged-in username securely from backend token
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await axios.get('http://localhost:5000/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data && res.data.username) {
          setUsername(res.data.username);
        }
      } catch (err) {
        console.error("Error fetching chat user profile:", err);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io('http://localhost:5000');

    // Join room
    socketRef.current.emit('join_room', room);

    // Listen for incoming messages in real-time
    const handleReceiveMessage = (data) => {
      setMessageList((list) => [...list, data]);
    };

    socketRef.current.on('receive_message', handleReceiveMessage);

    // Cleanup on unmount or room change
    return () => {
      if (socketRef.current) {
        socketRef.current.off('receive_message', handleReceiveMessage);
        socketRef.current.disconnect();
      }
    };
  }, [room]);

  const sendMessage = async () => {
    if (message.trim() !== '' && socketRef.current) {
      const messageData = {
        room: room,
        author: username,
        message: message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      // Emit message to server for real-time broadcast
      socketRef.current.emit('send_message', messageData);
      
      // Append locally
      setMessageList((list) => [...list, messageData]);
      setMessage('');
    }
  };

  return (
    <div style={{ background: 'white', padding: '25px', borderRadius: '8px', border: '1px solid #ddd', maxWidth: '800px', margin: '0 auto' }}>
      <h3 style={{ marginTop: 0, color: '#2c3e50' }}>Real-Time Community Chat (Logged in as: {username})</h3>
      
      {/* Room Selector */}
      <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <label style={{ fontWeight: 'bold' }}>Select Room: </label>
        <select 
          value={room} 
          onChange={(e) => {
            setRoom(e.target.value);
            setMessageList([]);
          }} 
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="general">General</option>
          <option value="tech">Tech & SaaS</option>
          <option value="design">Design & Remote</option>
        </select>
      </div>

      {/* Chat Messages Box */}
      <div style={{ height: '400px', border: '1px solid #e1e8ed', borderRadius: '6px', padding: '15px', overflowY: 'scroll', display: 'flex', flexDirection: 'column', gap: '12px', background: '#f8f9fa' }}>
        {messageList.map((msgContent, index) => {
          const isMe = msgContent.author === username;
          return (
            <div key={index} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '3px', textAlign: isMe ? 'right' : 'left' }}>
                {isMe ? 'You' : msgContent.author}
              </div>
              <div style={{ 
                background: isMe ? '#007bff' : '#e4e6eb', 
                color: isMe ? 'white' : 'black', 
                padding: '10px 14px', 
                borderRadius: '12px', 
                wordBreak: 'break-word',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}>
                {msgContent.message}
              </div>
              <div style={{ fontSize: '10px', color: '#999', marginTop: '2px', textAlign: isMe ? 'right' : 'left' }}>
                {msgContent.time}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      <div style={{ display: 'flex', marginTop: '15px', gap: '10px' }}>
        <input
          type="text"
          value={message}
          placeholder="Type a message..."
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' }}
        />
        <button 
          onClick={sendMessage} 
          style={{ background: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default Chats;