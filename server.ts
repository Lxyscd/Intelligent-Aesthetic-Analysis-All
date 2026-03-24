import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import Database from "better-sqlite3";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = 3000;
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key-change-this";

// Proxy analysis requests to Spring Boot backend
app.use(['/api/analyze', '/api/status', '/api/similar', '/api/stats', '/api/admin/logs'], createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/admin/logs': '/api/admin/logs', // Keep path as is
  },
}));

// Database setup
const db = new Database("history.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS analysis_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    image_url TEXT,
    analysis_result TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS community_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username TEXT,
    image_url TEXT,
    analysis_result TEXT,
    likes_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS likes (
    user_id INTEGER,
    post_id INTEGER,
    PRIMARY KEY (user_id, post_id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(post_id) REFERENCES community_posts(id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER,
    user_id INTEGER,
    username TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(post_id) REFERENCES community_posts(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Middleware to verify JWT
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: "Unauthorized" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ message: "Forbidden" });
    req.user = user;
    next();
  });
};

// API Routes
app.post("/api/auth/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)");
    stmt.run(username, hashedPassword);
    res.json({ status: "success", message: "User registered" });
  } catch (e) {
    res.status(400).json({ status: "error", message: "Username already exists" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);

  if (user && await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, username: user.username });
  } else {
    res.status(401).json({ status: "error", message: "Invalid credentials" });
  }
});

app.get("/api/history", authenticateToken, (req: any, res) => {
  const history = db.prepare("SELECT * FROM analysis_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 20").all(req.user.id);
  res.json(history);
});

app.post("/api/save-analysis", authenticateToken, (req: any, res) => {
  const { image_url, analysis_result } = req.body;
  const stmt = db.prepare("INSERT INTO analysis_history (user_id, image_url, analysis_result) VALUES (?, ?, ?)");
  const info = stmt.run(req.user.id, image_url, JSON.stringify(analysis_result));
  res.json({ id: info.lastInsertRowid });
});

// Community Features
app.get("/api/community", (req: any, res) => {
  const posts = db.prepare(`
    SELECT p.*,
    (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count
    FROM community_posts p
    ORDER BY created_at DESC
    LIMIT 50
  `).all();

  // Attach comments to each post
  const postsWithComments = posts.map(post => {
    const comments = db.prepare("SELECT * FROM comments WHERE post_id = ? ORDER BY created_at DESC").all(post.id);
    return { ...post, comments };
  });

  res.json(postsWithComments);
});

app.post("/api/community/share", authenticateToken, (req: any, res) => {
  const { image_url, analysis_result } = req.body;
  const stmt = db.prepare("INSERT INTO community_posts (user_id, username, image_url, analysis_result) VALUES (?, ?, ?, ?)");
  const info = stmt.run(req.user.id, req.user.username, image_url, JSON.stringify(analysis_result));
  res.json({ id: info.lastInsertRowid });
});

app.post("/api/community/like", authenticateToken, (req: any, res) => {
  const { post_id } = req.body;
  try {
    const existingLike = db.prepare("SELECT * FROM likes WHERE user_id = ? AND post_id = ?").get(req.user.id, post_id);

    if (existingLike) {
      db.prepare("DELETE FROM likes WHERE user_id = ? AND post_id = ?").run(req.user.id, post_id);
    } else {
      db.prepare("INSERT INTO likes (user_id, post_id) VALUES (?, ?)").run(req.user.id, post_id);
    }

    const likesCount = db.prepare("SELECT COUNT(*) as count FROM likes WHERE post_id = ?").get(post_id).count;
    res.json({ likes_count: likesCount });
  } catch (e) {
    res.status(400).json({ message: "Error toggling like" });
  }
});

app.post("/api/community/comment", authenticateToken, (req: any, res) => {
  const { post_id, content } = req.body;
  try {
    const stmt = db.prepare("INSERT INTO comments (post_id, user_id, username, content) VALUES (?, ?, ?, ?)");
    const info = stmt.run(post_id, req.user.id, req.user.username, content);
    const newComment = db.prepare("SELECT * FROM comments WHERE id = ?").get(info.lastInsertRowid);
    res.json(newComment);
  } catch (e) {
    res.status(400).json({ message: "Error adding comment" });
  }
});

// Vite middleware for development
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      root: path.join(process.cwd(), "frontend"),
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "frontend/dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "frontend/dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupVite();
