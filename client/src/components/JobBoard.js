import React, { useState } from 'react';

function JobBoard({ userProfile }) {
  const [jobs, setJobs] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handlePostJob = (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    if (!userProfile || !userProfile.isPro) {
      alert('🔒 Access Restricted: Posting project requests on the Job Board is an exclusive Pro feature! Please upgrade to Pro.');
      return;
    }

    const newJob = {
      _id: Date.now().toString(),
      title,
      description,
      author: userProfile.username
    };

    setJobs([newJob, ...jobs]);
    setTitle('');
    setDescription('');
    alert('Project request successfully posted to the Pro Job Board!');
  };

  const isProActive = userProfile && userProfile.isPro;

  return (
    <div style={{ background: 'white', padding: '30px', borderRadius: '8px', border: '1px solid #ddd', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ marginTop: 0, color: '#2c3e50' }}>Pro Member Job & Collaboration Board ⭐</h2>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '25px' }}>
        {isProActive 
          ? '👑 Pro Access Unlocked: You can publish project requests and hire remote talent.' 
          : '🔒 Free Tier View: You can view listings, but upgrading to Pro is required to post project requests.'}
      </p>

      {/* Post Project Form */}
      <div style={{ background: '#fdfdfd', border: '1px solid #e1e8ed', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>Post a Project Request</h4>
        <form onSubmit={handlePostJob}>
          <input 
            type="text"
            placeholder="Project Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', marginBottom: '12px', boxSizing: 'border-box' }}
          />
          <textarea 
            rows="3"
            placeholder="Project details, requirements, and tech stack..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', resize: 'vertical', marginBottom: '12px', boxSizing: 'border-box' }}
          />
          <button 
            type="submit"
            style={{ 
              background: isProActive ? '#27ae60' : '#e67e22', 
              color: 'white', 
              border: 'none', 
              padding: '10px 20px', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              fontWeight: 'bold' 
            }}
          >
            {isProActive ? 'Post Project Request' : '🔒 Upgrade to Pro to Post'}
          </button>
        </form>
      </div>

      {/* Job Listings Feed */}
      <div>
        <h3 style={{ color: '#2c3e50' }}>Active Project Listings</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
          {jobs.length === 0 ? (
            <p style={{ color: '#888', fontStyle: 'italic' }}>No active project requests yet.</p>
          ) : (
            jobs.map((job) => (
              <div key={job._id} style={{ background: '#f8f9fa', border: '1px solid #e1e8ed', padding: '20px', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, color: '#2c3e50' }}>{job.title}</h4>
                  <span style={{ fontSize: '12px', color: '#7f8c8d' }}>Posted by: <strong>{job.author}</strong></span>
                </div>
                <p style={{ margin: 0, color: '#555', lineHeight: '1.5', fontSize: '14px' }}>{job.description}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default JobBoard;