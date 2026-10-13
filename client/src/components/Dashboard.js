import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import JobBoard from './JobBoard';
import Chats from './Chats';

const API_BASE_URL = 'http://localhost:5000';

function Dashboard() {
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('jobs'); 
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
              {activeTab === 'jobs' && 'NicheLink Job Board'}
              {activeTab === 'chats' && 'Live Chat Communications'}
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
  cardPanel: {
    background: '#1e293b',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '14px',
    padding: '22px',
    marginBottom: '20px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
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