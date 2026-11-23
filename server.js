const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    // Use polling first for reliable connections, then upgrade to websocket
    transports: ['polling', 'websocket'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Make io globally available for API routes
  global._io = io;

  // Track connected sockets for debugging
  let connectedCount = 0;

  io.on("connection", (socket) => {
    connectedCount++;
    console.log(`🔌 Socket connected: ${socket.id} (total: ${connectedCount})`);

    socket.on("register-doctor", ({ doctorId }) => {
      const room = `doctor_${doctorId}`;
      socket.join(room);
      console.log(`👨‍⚕️ Doctor ${doctorId} joined room: ${room} (socket: ${socket.id})`);
      // Log room members for debugging
      const roomMembers = io.sockets.adapter.rooms.get(room);
      console.log(`   Room ${room} now has ${roomMembers ? roomMembers.size : 0} member(s)`);
    });

    socket.on("register-user", ({ userId }) => {
      const room = `user_${userId}`;
      socket.join(room);
      socket.join(userId.toString()); // Also join with just userId for compatibility
      console.log(`👤 User ${userId} joined room: ${room} (socket: ${socket.id})`);
    });

    socket.on("register-patient", ({ userId }) => {
      const room = `patient_${userId}`;
      socket.join(room);
      // Also join user_ room for compatibility with escalation accept events
      socket.join(`user_${userId}`);
      console.log(`🏥 Patient ${userId} joined rooms: ${room}, user_${userId} (socket: ${socket.id})`);
    });

    socket.on("join-room", (roomId) => {
      socket.join(roomId);
      console.log(`User joined room: ${roomId}`);
      
      const roomSockets = io.sockets.adapter.rooms.get(roomId);
      if (roomSockets && roomSockets.size >= 2) {
        console.log(`Both users in room ${roomId}, ready for call`);
      }
    });

    socket.on("offer", ({ roomId, offer }) => {
      socket.to(roomId).emit("offer", offer);
    });

    socket.on("answer", ({ roomId, answer }) => {
      socket.to(roomId).emit("answer", answer);
    });

    socket.on("ice-candidate", ({ roomId, candidate }) => {
      socket.to(roomId).emit("ice-candidate", candidate);
    });

    socket.on("end-call", (roomId) => {
      socket.to(roomId).emit("user-disconnected");
    });

    socket.on("disconnect", (reason) => {
      connectedCount--;
      console.log(`🔌 Socket disconnected: ${socket.id} (reason: ${reason}, remaining: ${connectedCount})`);
    });
  });

  // Log global._io availability periodically for debugging
  console.log(`✅ global._io is set: ${!!global._io}`);

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO server running`);
    console.log(`> global._io available: ${!!global._io}`);
  });
});