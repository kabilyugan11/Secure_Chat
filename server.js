const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.io
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Store online users
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // User joins with their ID
    socket.on('join', (userId) => {
      console.log('User joined:', userId);
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
      
      // Broadcast online status
      io.emit('user-online', { userId, online: true });
    });

    // Join a chat room
    socket.on('join-room', (roomId) => {
      console.log('User joined room:', roomId);
      socket.join(roomId);
    });

    // Leave a chat room
    socket.on('leave-room', (roomId) => {
      console.log('User left room:', roomId);
      socket.leave(roomId);
    });

    // Handle new message
    socket.on('send-message', (data) => {
      const { roomId, message } = data;
      console.log('New message in room:', roomId);
      
      // Broadcast to everyone in the room (including sender for confirmation)
      io.to(roomId).emit('new-message', message);
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      const { roomId, userId, userName } = data;
      socket.to(roomId).emit('user-typing', { userId, userName });
    });

    // Handle stop typing
    socket.on('stop-typing', (data) => {
      const { roomId, userId } = data;
      socket.to(roomId).emit('user-stop-typing', { userId });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        io.emit('user-online', { userId: socket.userId, online: false });
      }
    });
  });

  // Make io accessible to API routes
  global.io = io;

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
