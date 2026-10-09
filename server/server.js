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

// Community Model Import
const Community = require('./models/Community');

// Default Communities Seeding Function
const seedCommunities = async () => {
  try {
    const count = await Community.countDocuments();
    if (count === 0) {
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
      console.log("⚡ Default micro-communities seeded successfully!");
    }
  } catch (err) {
    console.error("Error seeding communities:", err);
  }
};

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nichelink';
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected successfully');
    seedCommunities(); // Trigger community seeding on successful connection
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

// Socket.io Real-Time Connection
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