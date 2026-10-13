import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import JobBoard from './JobBoard';
import Chats from './Chats';

const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000' 
  : 'https://nichelink-backend.onrender.com';

// Enhanced socket instance with forced new connection and reconnection settings
const socket = io(API_BASE_URL, {
  transports: ['websocket', 'polling'],
  forceNew: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

function Dashboard() {
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('communities'); 
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [newContent, setNewContent] = useState('');
  const navigate = useNavigate();

  const communitiesList = [
    { id: 'saas-devs', name: 'SaaS Developers', description: 'Discuss SaaS architecture, scaling, and backend code.' },
    { id: 'digital-nomads', name: 'Digital Nomads', description: 'Remote work lifestyle, travel setups, and global hubs.' },
    { id: 'tech-writers', name: 'Technical Writers', description: 'Documentation, API guides, and developer content.' }
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          localStorage.clear();
          navigate('/login', { replace: true });
          return;
        }

        const config = {
          headers: { Authorization: `Bearer ${token}` }
        };

        const profileRes = await axios.get(`${API_BASE_URL}/api/auth/profile`, config);
        setUserProfile(profileRes.data);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        localStorage.clear();
        navigate('/login', { replace: true });
      }
    };

    fetchDashboardData();
  }, [navigate]);

  useEffect(() => {
    if (selectedCommunity) {
      fetchCommunityPosts(selectedCommunity.id);

      socket.emit('join_community', selectedCommunity.id);

      const handleCommunityMessage = (data) => {
        if (data.communityId === selectedCommunity.id) {
          setCommunityPosts((prev) => {
            const exists = prev.some(p => p._id === data._id);
            if (exists) return prev;
            return [data, ...prev];
          });
        }
      };

      socket.on('receive_community_message', handleCommunityMessage);

      return () => {
        socket.emit('leave_community', selectedCommunity.id);
        socket.off('receive_community_message', handleCommunityMessage);
      };
    }
  }, [selectedCommunity]);

  const fetchCommunityPosts = async (communityId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/posts/${communityId}`);
      if (Array.isArray(res.data)) {
        setCommunityPosts(res.data);
      }
    } catch (err) {
      console.error('Error fetching community posts:', err);
      setCommunityPosts([]);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newContent.trim() || !selectedCommunity) return;

    const tempId = Date.now().toString();
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const authorName = userProfile?.username || 'Member';
    
    const messageData = {
      _id: tempId,
      communityId: selectedCommunity.id,
      author: authorName,
      content: newContent,
      createdAt: currentTime
    };

    // Instant local state update for sender
    setCommunityPosts((prev) => [messageData, ...prev]);
    const textToSend = newContent;
    setNewContent('');

    // Emit live message via Socket.io to other users in the same room
    socket.emit('send_community_message', messageData);

    // Persist to Database via API
    try {
      const res = await axios.post(`${API_BASE_URL}/api/posts`, {
        communityId: selectedCommunity.id,
        author: authorName,
        content: textToSend,
        createdAt: currentTime
      });
      if (res.data) {
        setCommunityPosts((prev) => prev.map(p => p._id === tempId ? res.data : p));
      }
    } catch (err) {
      console.error('API Save error:', err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login', { replace: true });
  };

  const handleSimulateUpgrade = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_BASE_URL}/api/auth/upgrade`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserProfile(res.data);
      alert('Congratulations! Your account has been permanently upgraded to NicheLink Pro.');
    } catch (err) {
      console.error("Upgrade failed, forcing local state", err);
      setUserProfile((prev) => ({ ...prev, isPro: true }));
      alert('Upgraded to Pro successfully!');
    }
  };

  return (
    <div style={styles.container}>
      {/* Sidebar Navigation */}
      <aside style={styles.sidebar}>
        <div style={styles.brandGroup}>
          <div style={styles.brandBadge}>NL</div>
          <h2 style={styles.brandTitle}>NicheLink</h2>
        </div>

        <nav style={styles.navStack}>
          <button 
            onClick={() => { setActiveTab('communities'); setSelectedCommunity(null); }} 
            style={activeTab === 'communities' ? styles.navBtnActive : styles.navBtn}
          >
            🌐 Communities & Boards
          </button>
          <button 
            onClick={() => setActiveTab('jobs')} 
            style={activeTab === 'jobs' ? styles.navBtnActive : styles.navBtn}
          >
            🚀 Job Board
          </button>
          <button 
            onClick={() => setActiveTab('chats')} 
            style={activeTab === 'chats' ? styles.navBtnActive : styles.navBtn}
          >
            💬 Real-Time Chat
          </button>
          <button 
            onClick={() => setActiveTab('upgrade')} 
            style={activeTab === 'upgrade' ? styles.navBtnActive : styles.navBtn}
          >
            ⭐ Upgrade to Pro
          </button>
        </nav>

        <div style={styles.sidebarFooter}>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main Content View Pane */}
      <div style={styles.mainPane}>
        {/* Top Header Bar */}
        <header style={styles.topHeader}>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#f8fafc' }}>
              {activeTab === 'communities' && (selectedCommunity ? `Community: ${selectedCommunity.name}` : 'Select a Micro-Community')}
              {activeTab === 'jobs' && 'NicheLink Job Board'}
              {activeTab === 'chats' && 'Live Global Chat Communications'}
              {activeTab === 'upgrade' && 'Account Subscription'}
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
              {userProfile ? `Welcome back, ${userProfile.username}!` : 'NicheLink Dashboard'}
            </p>
          </div>

          {userProfile && (
            <div style={styles.profileBadge}>
              <div style={styles.avatar}>
                {userProfile.username ? userProfile.username[0].toUpperCase() : 'U'}
              </div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px', color: '#f8fafc' }}>{userProfile.username}</div>
                <div style={{ 
                  color: userProfile.isPro ? '#a855f7' : '#06b6d4', 
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {userProfile.isPro ? 'Pro Member ✨' : 'Free Tier'}
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Dynamic Body Content Area */}
        <main style={styles.contentArea}>
          {activeTab === 'communities' && !selectedCommunity && (
            <div>
              <h3 style={{ color: '#f8fafc', marginBottom: '20px' }}>Choose a Community to Enter:</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {communitiesList.map((comm) => (
                  <div key={comm.id} style={styles.communityCard}>
                    <h4 style={{ color: '#818cf8', fontSize: '18px', margin: '0 0 10px 0' }}>{comm.name}</h4>
                    <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 20px 0', lineHeight: '1.5' }}>{comm.description}</p>
                    <button 
                      style={styles.primaryBtn} 
                      onClick={() => setSelectedCommunity(comm)}
                    >
                      Enter Community 🚀
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'communities' && selectedCommunity && (
            <div>
              <button 
                onClick={() => setSelectedCommunity(null)} 
                style={styles.backBtn}
              >
                ← Back to Communities
              </button>

              <div style={styles.cardPanel}>
                <h3 style={{ margin: '0 0 15px 0', color: '#f8fafc' }}>What's on your mind?</h3>
                <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <textarea 
                    placeholder="Share your thoughts with the community..." 
                    value={newContent} 
                    onChange={(e) => setNewContent(e.target.value)} 
                    style={{ ...styles.inputField, height: '90px', resize: 'vertical' }}
                    required
                  />
                  <button type="submit" style={styles.primaryBtn}>Post to Community ⚡</button>
                </form>
              </div>

              <div style={{ marginTop: '20px' }}>
                <h3 style={{ color: '#f8fafc', marginBottom: '15px' }}>Community Feed & Live Chats</h3>
                {communityPosts.length === 0 ? (
                  <p style={{ color: '#94a3b8' }}>No chats in this community yet. Start the conversation!</p>
                ) : (
                  communityPosts.map((post, idx) => (
                    <div key={post._id || idx} style={styles.cardPanel}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                        <strong style={{ color: '#818cf8' }}>{post.author?.username || post.author || 'Member'}</strong>
                        <span style={{ color: '#64748b' }}>{post.createdAt || 'Just now'}</span>
                      </div>
                      <p style={{ color: '#cbd5e1', fontSize: '15px', margin: 0, lineHeight: '1.5' }}>{post.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'jobs' && <JobBoard userProfile={userProfile} />}
          {activeTab === 'chats' && <Chats />}

          {activeTab === 'upgrade' && (
            <div style={{ ...styles.cardPanel, textAlign: 'center', maxWidth: '650px', margin: '40px auto 0 auto', padding: '40px' }}>
              <h2 style={{ color: '#c084fc', margin: '0 0 15px 0' }}>Unlock Full Platform Power with NicheLink Pro</h2>
              <p style={{ color: '#94a3b8', margin: '0 0 30px 0', lineHeight: '1.6', fontSize: '15px' }}>
                {userProfile?.isPro 
                  ? '🎉 You are a Pro Member! All premium features and priority options are active.' 
                  : 'Get unlimited messaging access, priority listings on the Job Board, and entry into exclusive Pro micro-communities.'}
              </p>
              {!userProfile?.isPro && (
                <button 
                  style={styles.upgradeBtn}
                  onClick={handleSimulateUpgrade}
                >
                  ⭐ Upgrade Now ($9.99/month)
                </button>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Modern Midnight Blue Stylesheet
const styles = {
  container: {
    display: 'flex',
    width: '100vw',
    height: '100vh',
    maxHeight: '100vh',
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.12) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(168, 85, 247, 0.12) 0%, transparent 40%)',
    color: '#f8fafc',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    boxSizing: 'border-box',
  },
  sidebar: {
    width: '260px',
    minWidth: '260px',
    backgroundColor: '#1e293b',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '25px 20px',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    boxSizing: 'border-box',
  },
  brandGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '35px',
  },
  brandBadge: {
    width: '40px',
    height: '40px',
    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '18px',
    color: '#ffffff',
    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
  },
  brandTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#f8fafc',
    margin: 0,
  },
  navStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    flex: 1,
  },
  navBtn: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    padding: '12px 15px',
    borderRadius: '8px',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  navBtnActive: {
    background: 'rgba(99, 102, 241, 0.18)',
    borderLeft: '4px solid #818cf8',
    color: '#c084fc',
    padding: '12px 15px',
    borderRadius: '8px',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  sidebarFooter: {
    marginTop: 'auto',
    paddingTop: '20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  },
  logoutBtn: {
    width: '100%',
    padding: '10px',
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#fca5a5',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
  },
  mainPane: {
    flex: 1,
    height: '100vh',
    padding: '25px 35px',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  topHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '60px',
    marginBottom: '20px',
    flexShrink: 0,
  },
  profileBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: '#1e293b',
    padding: '8px 16px',
    borderRadius: '30px',
    border: '1px solid rgba(255, 255, 2, 0.08)',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
    color: '#ffffff',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentArea: {
    height: 'calc(100vh - 120px)',
    width: '100%',
    boxSizing: 'border-box',
    overflowY: 'auto',
    paddingRight: '5px',
  },
  cardPanel: {
    background: '#1e293b',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '14px',
    padding: '22px',
    marginBottom: '20px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
  },
  communityCard: {
    background: '#1e293b',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '14px',
    padding: '25px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  inputField: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box',
    fontSize: '14px',
  },
  primaryBtn: {
    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    color: '#ffffff',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    alignSelf: 'flex-start',
  },
  backBtn: {
    background: 'rgba(255, 255, 255, 0.08)',
    color: '#f8fafc',
    border: 'none',
    padding: '8px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    marginBottom: '20px',
    fontSize: '13px'
  },
  upgradeBtn: {
    background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
    color: '#ffffff',
    border: 'none',
    padding: '12px 28px',
    fontSize: '15px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    boxShadow: '0 4px 16px rgba(168, 85, 247, 0.3)',
  },
};

export default Dashboard;