const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nichelink', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected successfully')).catch(err => console.log(err));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/communities', require('./routes/communities'));

app.get('/', (req, res) => {
  res.send('NicheLink Backend is live and running!');
});

// Socket.io Real-time room synchronization
io.on('connection', (socket) => {
  console.log('User Connected:', socket.id);

  socket.on('join_community', (communityId) => {
    socket.join(communityId);
    console.log(`User joined community room: ${communityId}`);
  });

  socket.on('leave_community', (communityId) => {
    socket.leave(communityId);
    console.log(`User left community room: ${communityId}`);
  });

  socket.on('send_community_message', (data) => {
    // Broadcast message to all other users in the same community room
    socket.to(data.communityId).emit('receive_community_message', data);
  });

  socket.on('disconnect', () => {
    console.log('User Disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});