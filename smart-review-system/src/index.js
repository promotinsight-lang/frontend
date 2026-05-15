console.log("✅ PRODUCT ROUTES MOUNTED at /api/products");
console.log("🔥🔥🔥 NEW SECURE SERVER RUNNING 🔥🔥🔥");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const pool = require("./config/db");
require("dotenv").config();

const app = express();

// ==========================================
// 🛡️ ENTERPRISE-GRADE SECURITY MIDDLEWARES
// ==========================================

// 1. Set Security HTTP Headers (Blocks Clickjacking, Sniffing, etc.)
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" })); // Allows safe cross-origin image loading

// 2. CORS Setup (Strict Origins & Credentials)
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173", // Only allow your frontend
    credentials: true, // 🔥 MUST BE TRUE for HttpOnly Cookies to work properly
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. Body Parser with Payload Limits (Prevents DoS via large payloads)
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// 4. Cookie Parser (🔥 REQUIRED for reading HttpOnly JWT cookies)
app.use(cookieParser());


// 6. Global Rate Limiting (Defense in Depth Fallback)
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 total requests
    message: { success: false, message: "Too many requests from this IP, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use("/api", globalLimiter);

// ==========================================
// 📁 STATIC FOLDER (Images)
// ==========================================
app.use("/uploads", express.static("uploads"));

// ==========================================
// 🔗 ROUTES IMPORT & MOUNT
// ==========================================
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const withdrawalRoutes = require("./routes/withdrawalRoutes");
const adminRoutes = require("./routes/adminRoutes");
const appealRoutes = require("./routes/appealRoutes"); 
const supportRoutes = require("./routes/supportRoutes"); 
// 🔥 Announcement Route Import করা হলো
const announcementRoutes = require("./routes/announcementRoutes"); 

app.use("/api/users", userRoutes); 
app.use("/api/products", productRoutes); 
app.use("/api/applications", applicationRoutes);
app.use("/api/withdrawals", withdrawalRoutes); 
app.use("/api/admin", adminRoutes);
app.use("/api/appeals", appealRoutes); 
app.use("/api/support", supportRoutes); 
// 🔥 Announcement Route Mount করা হলো
app.use("/api/announcements", announcementRoutes); 

// ==========================================
// 🌐 HEALTH CHECK & ERROR HANDLING
// ==========================================
app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      success: true,
      message: "Secure API running ✔",
      time: result.rows[0].now,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "DB connection error" });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global Error handler
app.use((err, req, res, next) => {
  console.error("🔥 GLOBAL ERROR:", err.stack);
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

// ==========================================
// 🕒 START BACKGROUND JOBS
// ==========================================
const startCronJobs = require('./cronJobs'); 
startCronJobs(); 

// ==========================================
// 🚀 SERVER IGNITION
// ==========================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Secure Enterprise Server running on port ${PORT}`);
});