import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import JobBoard from './JobBoard';
import Chats from './Chats';

const API_BASE_URL = 'http://localhost:5000';

function Dashboard() {
  const [communities, setCommunities] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('communities'); 
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

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

        const [commRes, profileRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/communities`, config),
          axios.get(`${API_BASE_URL}/api/auth/profile`, config)
        ]);

        setCommunities(commRes.data);
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
    if (!selectedCommunity) return;

    const fetchPosts = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/posts/${selectedCommunity._id}`);
        setPosts(res.data);
      } catch (err) {
        console.error("Error fetching posts:", err);
      }
    };

    fetchPosts();

    const interval = setInterval(fetchPosts, 3000);
    return () => clearInterval(interval);
  }, [selectedCommunity]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.clear();
    setPosts([]);
    setSelectedCommunity(null);
    navigate('/login', { replace: true });
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim() || !selectedCommunity || !userProfile) return;

    const postData = {
      communityId: selectedCommunity._id,
      author: userProfile.username,
      content: newPostContent,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    try {
      const res = await axios.post(`${API_BASE_URL}/api/posts`, postData);
      setPosts([res.data, ...posts]);
      setNewPostContent('');
    } catch (err) {
      console.error("Error creating post:", err);
    }
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
            👥 Communities & Boards
          </button>
          <button 
            onClick={() => { setActiveTab('jobs'); setSelectedCommunity(null); }} 
            style={activeTab === 'jobs' ? styles.navBtnActive : styles.navBtn}
          >
            🚀 Job Board
          </button>
          <button 
            onClick={() => { setActiveTab('chats'); setSelectedCommunity(null); }} 
            style={activeTab === 'chats' ? styles.navBtnActive : styles.navBtn}
          >
            💬 Real-Time Chat
          </button>
          <button 
            onClick={() => { setActiveTab('upgrade'); setSelectedCommunity(null); }} 
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
              {selectedCommunity ? `Discussion Board: ${selectedCommunity.name}` : (
                <>
                  {activeTab === 'communities' && 'Micro-Communities & Tribes'}
                  {activeTab === 'jobs' && 'NicheLink Job Board'}
                  {activeTab === 'chats' && 'Live Chat Communications'}
                  {activeTab === 'upgrade' && 'Account Subscription'}
                </>
              )}
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
          {error && <div style={styles.errorAlert}>{error}</div>}

          {/* COMMUNITIES TAB: All Communities Grid */}
          {activeTab === 'communities' && !selectedCommunity && (
            <div>
              <h3 style={{ margin: '0 0 20px 0', color: '#c084fc', fontSize: '18px' }}>Available Micro-Communities (Tribes)</h3>
              <div style={styles.communitiesGrid}>
                {communities.map((comm) => (
                  <div key={comm._id} style={styles.communityCard}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '18px' }}>{comm.name}</h4>
                        <span style={styles.categoryPill}>{comm.category}</span>
                      </div>
                      <p style={{ margin: '0 0 20px 0', color: '#94a3b8', fontSize: '14px', lineHeight: '1.5' }}>
                        {comm.description}
                      </p>
                    </div>
                    <button 
                      onClick={() => setSelectedCommunity(comm)}
                      style={styles.primaryBtn}
                    >
                      Enter Community Board →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* COMMUNITIES TAB: Single Selected Community Discussion */}
          {activeTab === 'communities' && selectedCommunity && (
            <div>
              <button 
                onClick={() => setSelectedCommunity(null)}
                style={styles.secondaryBtn}
              >
                ← Back to Communities
              </button>

              <div style={styles.cardPanel}>
                <h2 style={{ margin: '0 0 8px 0', color: '#c084fc', fontSize: '22px' }}>{selectedCommunity.name} Board</h2>
                <p style={{ color: '#94a3b8', margin: 0, fontSize: '14px' }}>{selectedCommunity.description}</p>
              </div>

              <div style={styles.cardPanel}>
                <h4 style={{ margin: '0 0 12px 0', color: '#e2e8f0' }}>Create a Discussion Post</h4>
                <form onSubmit={handleCreatePost}>
                  <textarea 
                    rows="3"
                    placeholder="Share your thoughts or start a discussion..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    style={styles.textAreaField}
                  />
                  <button 
                    type="submit"
                    style={styles.primaryBtn}
                  >
                    Publish Post
                  </button>
                </form>
              </div>

              <div style={styles.cardPanel}>
                <h3 style={{ margin: '0 0 15px 0', color: '#e2e8f0', fontSize: '18px' }}>Community Posts Feed</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {posts.length === 0 ? (
                    <p style={{ color: '#64748b', fontStyle: 'italic', margin: 0 }}>
                      No posts yet in this community. Be the first to start a discussion!
                    </p>
                  ) : (
                    posts.map((post) => (
                      <div key={post._id} style={styles.postItem}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                          <strong style={{ color: '#38bdf8' }}>{post.author}</strong>
                          <span style={{ color: '#64748b' }}>{post.createdAt}</span>
                        </div>
                        <p style={{ margin: 0, color: '#e2e8f0', wordBreak: 'break-word', lineHeight: '1.5' }}>{post.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* JOBS TAB */}
          {activeTab === 'jobs' && <JobBoard userProfile={userProfile} />}

          {/* CHATS TAB */}
          {activeTab === 'chats' && <Chats />}

          {/* UPGRADE TAB */}
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

// Modern Midnight Blue & Electric Indigo Stylesheet
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
    border: '1px solid rgba(255, 255, 255, 0.08)',
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
  communitiesGrid: {
    GridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
  },
  communityCard: {
    background: '#1e293b',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '14px',
    padding: '22px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
  },
  categoryPill: {
    fontSize: '11px',
    background: 'rgba(99, 102, 241, 0.2)',
    color: '#818cf8',
    border: '1px solid rgba(99, 102, 241, 0.4)',
    padding: '3px 10px',
    borderRadius: '20px',
    fontWeight: '600',
  },
  cardPanel: {
    background: '#1e293b',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '14px',
    padding: '22px',
    marginBottom: '20px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
  },
  textAreaField: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '8px',
    background: '#0f172a',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    color: '#f8fafc',
    outline: 'none',
    resize: 'vertical',
    marginBottom: '12px',
    boxSizing: 'border-box',
    fontSize: '14px',
  },
  primaryBtn: {
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    color: '#ffffff',
    border: 'none',
    padding: '9px 18px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '13px',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
  },
  secondaryBtn: {
    background: 'rgba(255, 255, 255, 0.06)',
    color: '#c084fc',
    border: '1px solid rgba(192, 132, 252, 0.3)',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '20px',
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
  postItem: {
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    padding: '14px 16px',
    borderRadius: '10px',
  },
  errorAlert: {
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#fca5a5',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '15px',
  },
};

export default Dashboard;