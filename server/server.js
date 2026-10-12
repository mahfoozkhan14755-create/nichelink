const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { 
    origin: "*", 
    methods: ["GET", "POST"] 
  }
});

app.use(express.json());
app.use(cors());

// Models Import
const Community = require('./models/Community');
const Post = require('./models/Post'); 

// Fresh Communities Seeding & Reset Function
const seedCommunities = async () => {
  try {
    await Community.deleteMany({});
    await Community.insertMany([
      {
        name: "SaaS Founders",
        description: "A place for SaaS creators and builders to share growth tips, MRR milestones, and scaling strategies.",
        category: "tech"
      },
      {
        name: "AI & LLM Builders",
        description: "Discussing prompt engineering, fine-tuning open-source models, and integrating AI into modern web apps.",
        category: "AI"
      },
      {
        name: "Remote UI/UX Designers",
        description: "Showcasing high-end SaaS designs, design systems, wireframes, and modern user experience feedback.",
        category: "design"
      },
      {
        name: "Full Stack Masterminds",
        description: "Deep dive into MERN stack architecture, microservices, database optimizations, and robust API scaling.",
        category: "development"
      }
    ]);
    console.log("⚡ Fresh micro-communities re-created successfully!");
  } catch (err) {
    console.error("Error re-creating communities:", err);
  }
};

// MongoDB Connection & Absolute Wipe of Old Posts
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nichelink';
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected successfully');
    await seedCommunities();
    
    try {
      const deleteResult = await Post.deleteMany({});
      console.log(`🧹 Cleaned all ${deleteResult.deletedCount} old posts from database!`);
    } catch (wipeErr) {
      console.error("Error clearing posts:", wipeErr);
    }
  })
  .catch(err => console.log('MongoDB Connection Error:', err));

// Routes Import
const authRoutes = require('./routes/auth');
const communityRoutes = require('./routes/communities'); 
const postRoutes = require('./routes/posts'); 

// Routes Middleware
app.use('/api/auth', authRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/posts', postRoutes); 

// Clear All Endpoint
app.delete('/api/posts/clear-all', async (req, res) => {
  try {
    await Post.deleteMany({});
    res.status(200).json({ message: 'All community chats cleared successfully!' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear posts' });
  }
});

// Socket.io Connection
io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on('join_room', (room) => {
    socket.join(room);
  });

  socket.on('send_message', (data) => {
    socket.to(data.room).emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log(`User Disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});