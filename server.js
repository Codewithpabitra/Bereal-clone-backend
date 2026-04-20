const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

// connect to the DB
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded images statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/posts", require("./routes/posts"));
app.use("/api/users", require("./routes/users"));
app.use("/api/comments", require("./routes/comments"));
app.use("/api/saved", require("./routes/saved"));
app.use("/api/analytics", require("./routes/analytics"));
app.use("/api/notifications", require("./routes/notifications"));

app.get("/", (req, res) => res.json({ message: "BeReal Clone API ✅" }));

app.use((err, req, res, next) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} ✅`));