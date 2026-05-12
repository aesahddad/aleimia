import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import client from '../../api/client';

export default function ChatBox({ adId, onClose }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const chatRef = useRef(null);

  useEffect(() => {
    if (!adId) return;

    // Load message history
    if (user) {
      client.get(`/chat/${adId}`).then(r => setMessages(r.data)).catch(err => console.error('Failed to load messages:', err));
    }

    // Connect Socket.IO
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${protocol}://${window.location.hostname}:3001`;

    try {
      // Try using the Socket.IO client from the server
      const ioScript = document.createElement('script');
      ioScript.src = '/socket.io/socket.io.js';
      ioScript.onload = () => {
        if (window.io) {
          const sock = window.io(wsUrl);
          socketRef.current = sock;
          setConnected(true);

          sock.emit('join_chat', adId);

          sock.on('receive_message', (msg) => {
            setMessages(prev => [...prev, msg]);
          });

          sock.on('disconnect', () => setConnected(false));
        }
      };
      document.head.appendChild(ioScript);
    } catch (e) {
      console.warn('Socket.IO not available, chat will be read-only');
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_chat', adId);
        socketRef.current.disconnect();
      }
      const script = document.querySelector('script[src*="socket.io"]');
      if (script) script.remove();
    };
  }, [adId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !socketRef.current || !user) return;
    const msg = {
      adId,
      senderId: user._id,
      senderName: user.username || user.email,
      message: input.trim()
    };
    socketRef.current.emit('send_message', msg);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-box" ref={chatRef}>
      <div className="chat-header">
        <h3>💬 المحادثة</h3>
        <div className="chat-header-actions">
          {connected && <span className="chat-connected">● متصل</span>}
          <button className="chat-close-btn" onClick={onClose}>✕</button>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">لا توجد رسائل بعد</div>
        ) : messages.map((msg, i) => (
          <div key={msg._id || i} className={`chat-message ${msg.senderId === user?._id ? 'own' : 'other'}`}>
            <div className="chat-message-sender">{msg.senderName || 'مستخدم'}</div>
            <div className="chat-message-text">{msg.message}</div>
            <div className="chat-message-time">{new Date(msg.createdAt || Date.now()).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <textarea
          className="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={user ? 'اكتب رسالتك...' : 'سجل دخول للمحادثة'}
          rows={2}
          disabled={!user}
        />
        <button className="chat-send-btn" onClick={sendMessage} disabled={!user || !input.trim()}>
          إرسال
        </button>
      </div>
    </div>
  );
}


