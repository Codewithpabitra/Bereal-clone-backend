const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

// ✅ Create HTTP server from express app
const server = http.createServer(app);

// ✅ Attach Socket.io to the server
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:4173",
      process.env.FRONTEND_URL || "*",
    ],
    methods: ["GET", "POST"],
  },
});

// ✅ Store io instance so controllers can use it
app.set("io", io);

// Online users map — userId → socketId
const onlineUsers = new Map();
app.set("onlineUsers", onlineUsers);

// Socket.io connection
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // User comes online
  socket.on("user:online", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`User ${userId} is online`);

    // Broadcast online users count
    io.emit("users:online-count", onlineUsers.size);
  });

  // User joins their own room for private notifications
  socket.on("user:join", (userId) => {
    socket.join(`user:${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  // User disconnects
  socket.on("disconnect", () => {
    onlineUsers.forEach((socketId, userId) => {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`User ${userId} went offline`);
      }
    });
    io.emit("users:online-count", onlineUsers.size);
  });
});

// Middleware
app.use(cors());
app.use(express.json());

// Static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/posts", require("./routes/posts"));
app.use("/api/users", require("./routes/users"));
app.use("/api/comments", require("./routes/comments"));
app.use("/api/saved", require("./routes/saved"));
app.use("/api/analytics", require("./routes/analytics"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/reactions", require("./routes/reactions"));
app.use("/api/reports", require("./routes/reports"));

// Error handler
app.use((err, req, res, next) => {
  if (err) return res.status(400).json({ message: err.message });
  next();
});

app.get("/", (req, res) => res.json({ message: "Candid API ✅" }));

const PORT = process.env.PORT || 5000;

// ✅ Use server.listen not app.listen
server.listen(PORT, () =>
  console.log(`Server running on port ${PORT} ✅`)
);