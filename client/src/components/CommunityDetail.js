import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

function CommunityDetail() {
  const { id } = useParams();
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [commentText, setCommentText] = useState({});
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchCommunityData = useCallback(async () => {
    try {
      const commRes = await axios.get('http://localhost:5000/api/communities');
      const currentComm = commRes.data.find(c => c._id === id);
      setCommunity(currentComm);
    } catch (err) {
      console.log('Error fetching community:', err);
    }
  }, [id]);

  const fetchPosts = useCallback(async () => {
    try {
      const postsRes = await axios.get(`http://localhost:5000/api/posts/${id}`);
      setPosts(postsRes.data);
      setError('');
    } catch (err) {
      console.log('Error fetching posts:', err);
      setError('Could not load posts for this community.');
    }
  }, [id]);

  useEffect(() => {
    fetchCommunityData();
    fetchPosts();
  }, [fetchCommunityData, fetchPosts]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert('Please login first to create a post.');
      navigate('/login');
      return;
    }

    if (!newPost.title.trim() || !newPost.content.trim()) {
      alert('Please fill in both title and content.');
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/posts', {
        communityId: id,
        title: newPost.title,
        content: newPost.content
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNewPost({ title: '', content: '' });
      fetchPosts(); 
    } catch (err) {
      console.error('Error creating post:', err.response || err.message);
      alert(err.response?.data?.message || err.response?.data?.error || 'Failed to create post.');
    }
  };

  const handleAddComment = async (postId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to comment.');
      return;
    }

    const text = commentText[postId];
    if (!text) return;

    try {
      await axios.post('http://localhost:5000/api/posts/comment', {
        postId,
        text
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCommentText({ ...commentText, [postId]: '' });
      fetchPosts();
    } catch (err) {
      alert('Failed to add comment');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <button onClick={() => navigate('/dashboard')} style={{ marginBottom: '15px', padding: '5px 10px', cursor: 'pointer' }}>← Back to Dashboard</button>
      
      {community && (
        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '5px', marginBottom: '20px', border: '1px solid #ddd' }}>
          <h2>{community.name} {community.isProOnly && <span style={{ color: 'gold' }}>⭐ Pro Only</span>}</h2>
          <p>{community.description}</p>
          <small>Category: {community.category}</small>
        </div>
      )}

      {/* Create Post Form */}
      <div style={{ background: '#fff', padding: '15px', borderRadius: '5px', border: '1px solid #ddd', marginBottom: '20px' }}>
        <h3>Create a New Discussion Post</h3>
        <form onSubmit={handleCreatePost}>
          <div style={{ marginBottom: '10px' }}>
            <input type="text" placeholder="Post Title" value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <textarea placeholder="What's on your mind?" value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box', height: '80px' }} />
          </div>
          <button type="submit" style={{ padding: '8px 15px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Post</button>
        </form>
      </div>

      {/* Posts List */}
      <h3>Community Discussions</h3>
      {error && <p style={{ color: 'orange', fontSize: '14px' }}>{error}</p>}
      {posts.length === 0 ? (
        <p>No posts yet. Be the first to start a discussion using the form above!</p>
      ) : (
        posts.map(post => (
          <div key={post._id} style={{ background: '#fff', padding: '15px', borderRadius: '5px', border: '1px solid #ddd', marginBottom: '15px' }}>
            <h4>{post.title}</h4>
            <p>{post.content}</p>
            <small style={{ color: '#666' }}>Posted by: {post.author?.username || 'User'}</small>

            {/* Comments Section */}
            <div style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
              <h5>Comments</h5>
              {post.comments && post.comments.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#888' }}>No comments yet.</p>
              ) : (
                post.comments?.map((c, idx) => (
                  <div key={idx} style={{ background: '#f9f9f9', padding: '8px', borderRadius: '4px', marginBottom: '5px', fontSize: '13px' }}>
                    <b>{c.user?.username || 'User'}:</b> {c.text}
                  </div>
                ))
              )}

              {/* Add Comment Input */}
              <div style={{ display: 'flex', marginTop: '10px', gap: '10px' }}>
                <input 
                  type="text" 
                  placeholder="Write a comment..." 
                  value={commentText[post._id] || ''} 
                  onChange={e => setCommentText({...commentText, [post._id]: e.target.value})}
                  style={{ flex: 1, padding: '6px', boxSizing: 'border-box' }} 
                />
                <button onClick={() => handleAddComment(post._id)} style={{ padding: '6px 12px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Comment</button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default CommunityDetail;