import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import CommunityDetail from './components/CommunityDetail';

function Home() {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Welcome to NicheLink</h1>
      <p>Community Platform for Remote Workers & Creators</p>
      <div style={{ marginTop: '20px' }}>
        <Link to="/login" style={{ marginRight: '15px', padding: '10px 20px', background: '#28a745', color: '#fff', textDecoration: 'none', borderRadius: '4px' }}>Login</Link>
        <Link to="/register" style={{ padding: '10px 20px', background: '#007bff', color: '#fff', textDecoration: 'none', borderRadius: '4px' }}>Register</Link>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/community/:id" element={<CommunityDetail />} />
      </Routes>
    </Router>
  );
}

export default App;