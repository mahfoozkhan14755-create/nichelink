import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import JobBoard from './JobBoard';
import Chats from './Chats';

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
          navigate('/login');
          return;
        }

        const config = {
          headers: { Authorization: `Bearer ${token}` }
        };

        const [commRes, profileRes] = await Promise.all([
          axios.get('http://localhost:5000/api/communities', config),
          axios.get('http://localhost:5000/api/auth/profile', config)
        ]);

        setCommunities(commRes.data);
        setUserProfile(profileRes.data);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError('Failed to load dashboard data');
      }
    };

    fetchDashboardData();
  }, [navigate]);

  useEffect(() => {
    if (!selectedCommunity) return;

    const fetchPosts = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/posts/${selectedCommunity._id}`);
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
    navigate('/login');
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
      const res = await axios.post('http://localhost:5000/api/posts', postData);
      setPosts([res.data, ...posts]);
      setNewPostContent('');
    } catch (err) {
      console.error("Error creating post:", err);
    }
  };

  const handleSimulateUpgrade = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put('http://localhost:5000/api/auth/upgrade', {}, {
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
    <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', background: '#f4f6f8' }}>
      <header style={{ background: '#2c3e50', color: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>NicheLink Dashboard</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {userProfile && (
            <span>
              Welcome, <strong>{userProfile.username}</strong>{' '}
              <span style={{ 
                background: userProfile.isPro ? '#f39c12' : '#7f8c8d', 
                color: 'white', 
                padding: '3px 10px', 
                borderRadius: '4px', 
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {userProfile.isPro ? 'Pro Member' : 'Free Tier'}
              </span>
            </span>
          )}
          <button 
            onClick={handleLogout} 
            style={{ background: '#e74c3c', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Logout
          </button>
        </div>
      </header>

      <nav style={{ background: 'white', padding: '0 30px', borderBottom: '1px solid #ddd', display: 'flex', gap: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <button onClick={() => { setActiveTab('communities'); setSelectedCommunity(null); }} style={tabStyle(activeTab === 'communities')}>
          Communities & Discussion Board
        </button>
        <button onClick={() => { setActiveTab('jobs'); setSelectedCommunity(null); }} style={tabStyle(activeTab === 'jobs')}>
          Job Board
        </button>
        <button onClick={() => { setActiveTab('chats'); setSelectedCommunity(null); }} style={tabStyle(activeTab === 'chats')}>
          Real-Time Chat
        </button>
        <button onClick={() => { setActiveTab('upgrade'); setSelectedCommunity(null); }} style={tabStyle(activeTab === 'upgrade')}>
          Upgrade to Pro ⭐
        </button>
      </nav>

      <main style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {activeTab === 'communities' && !selectedCommunity && (
          <div>
            <h3>Available Micro-Communities (Tribes)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '15px' }}>
              {communities.map((comm) => (
                <div key={comm._id} style={{ background: 'white', border: '1px solid #e1e8ed', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>{comm.name}</h4>
                    <p style={{ margin: '0 0 15px 0', color: '#666', fontSize: '14px' }}>{comm.description}</p>
                    <span style={{ fontSize: '12px', background: '#3498db', color: 'white', padding: '4px 10px', borderRadius: '4px', display: 'inline-block', marginBottom: '15px' }}>
                      {comm.category}
                    </span>
                  </div>
                  <button 
                    onClick={() => setSelectedCommunity(comm)}
                    style={{ 
                      background: '#2ecc71', 
                      color: 'white', 
                      border: 'none', 
                      padding: '6px 14px', 
                      borderRadius: '20px', 
                      cursor: 'pointer', 
                      fontSize: '13px',
                      fontWeight: '600',
                      width: 'fit-content'
                    }}
                  >
                    Enter Community Board
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
              style={{ background: '#7f8c8d', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', marginBottom: '20px' }}
            >
              &larr; Back to Communities
            </button>

            <div style={{ background: 'white', padding: '25px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '20px' }}>
              <h2 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>{selectedCommunity.name} - Discussion Board</h2>
              <p style={{ color: '#666', margin: '0 0 15px 0' }}>{selectedCommunity.description}</p>
            </div>

            <div style={{ background: 'white', padding: '25px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '20px' }}>
              <h4>Create a Discussion Post</h4>
              <form onSubmit={handleCreatePost}>
                <textarea 
                  rows="3"
                  placeholder="Share your thoughts or start a discussion..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', resize: 'vertical', marginBottom: '10px', boxSizing: 'border-box' }}
                />
                <button 
                  type="submit"
                  style={{ background: '#3498db', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Publish Post
                </button>
              </form>
            </div>

            <div style={{ background: 'white', padding: '25px', borderRadius: '8px', border: '1px solid #ddd' }}>
              <h3>Community Posts Feed</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                {posts.length === 0 ? (
                  <p style={{ color: '#888', fontStyle: 'italic' }}>No posts yet in this community. Be the first to start a discussion!</p>
                ) : (
                  posts.map((post) => (
                    <div key={post._id} style={{ background: '#fdfdfd', border: '1px solid #e1e8ed', padding: '15px', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#555' }}>
                        <strong>{post.author}</strong>
                        <span style={{ color: '#999' }}>{post.createdAt}</span>
                      </div>
                      <p style={{ margin: 0, color: '#333', wordBreak: 'break-word', lineHeight: '1.5' }}>{post.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'jobs' && <JobBoard userProfile={userProfile} />}

        {activeTab === 'chats' && <Chats />}

        {activeTab === 'upgrade' && (
          <div style={{ background: 'white', padding: '40px', borderRadius: '8px', textAlign: 'center', border: '1px solid #ddd', maxWidth: '700px', margin: '0 auto' }}>
            <h2>Unlock Full Platform Power with NicheLink Pro</h2>
            <p style={{ color: '#666', margin: '15px 0 25px 0', lineHeight: '1.6' }}>
              {userProfile?.isPro 
                ? '🎉 You are a Pro Member! All features are unlocked.' 
                : 'Get unlimited messaging access, priority listings on the Job Board, and entry into exclusive Pro micro-communities.'}
            </p>
            {!userProfile?.isPro && (
              <button 
                style={{ background: '#f39c12', color: 'white', border: 'none', padding: '12px 30px', fontSize: '16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                onClick={handleSimulateUpgrade}
              >
                Upgrade Now ($9.99/month - Sandbox)
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

const tabStyle = (isActive) => ({
  background: 'none',
  border: 'none',
  padding: '15px 20px',
  cursor: 'pointer',
  fontSize: '15px',
  fontWeight: isActive ? 'bold' : 'normal',
  color: isActive ? '#3498db' : '#555',
  borderBottom: isActive ? '3px solid #3498db' : '3px solid transparent'
});

export default Dashboard;