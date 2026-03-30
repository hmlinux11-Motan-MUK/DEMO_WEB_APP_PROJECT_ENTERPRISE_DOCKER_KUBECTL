const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const express = require("express");
const cors = require("cors");
const path = require("path");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 5000;

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || "muk-super-secret-key";
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb://HMadmin:HMpass@localhost:27017/hamza-db?authSource=admin";
const DB_NAME = process.env.DB_NAME || "hamza-db";

let db;

console.log("MONGO_URI:", MONGO_URI);
console.log("DB_NAME:", DB_NAME);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend
app.use(express.static(path.join(__dirname, "../Frontend/public")));

// Connect to MongoDB
async function connectDB() {
  try {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log("✅ Connected to MongoDB");

    db = client.db(DB_NAME);

    const usersCollection = db.collection("users");

    const existingUser = await usersCollection.findOne({ username: "admin" });

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash("admin123", 10);

      await usersCollection.insertOne({
        username: "admin",
        password: hashedPassword,
        fullName: "Hamza Admin",
        role: "admin",
      });

      console.log("✅ Default user inserted");
    } else {
      console.log("✅ Default user already exists");
    }
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
  }
}

connectDB();

// JWT middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token required",
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    req.user = user;
    next();
  });
}

// Login API
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: "Database not connected yet",
      });
    }

    const usersCollection = db.collection("users");
    const user = await usersCollection.findOne({ username });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Protected dashboard API
app.get("/api/dashboard", authenticateToken, async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({
        success: false,
        message: "Database not connected yet",
      });
    }

    const usersCollection = db.collection("users");
    const totalUsers = await usersCollection.countDocuments();

    res.json({
      success: true,
      message: "Dashboard data fetched successfully",
      data: {
        loggedInUser: req.user.username,
        role: req.user.role,
        totalUsers,
        appName: "MUK.cloud",
        cloudStatus: "Healthy",
        activeServices: 3,
        uptime: "99.9%",
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard",
    });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "MUK Cloud App" });
});

// Fallback route
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../Frontend/public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
