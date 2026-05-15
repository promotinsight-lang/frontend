const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const {
  getPublicLiveFeed,      // 🔥 IMPORTED
  generateCaptcha,        // 🔥 IMPORTED
  sendRegistrationOtp,    // 🔥 IMPORTED
  registerUser,
  loginUser,
  logoutUser, 
  getUserProfile,
  depositFunds,
  getMyDeposits,
  getPaymentSettings,
  updateTrustScore,
  submitAppeal,
  getPendingAppeals,
  resolveAppeal,
  forgotPassword,
  resetPassword,
  submitVerification,
  getAllUsersByRole,
  updateUserStatus,
  getAdminUserDetailsById
} = require("../controllers/userController");

const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

// ==========================================
// 🛡️ Rate Limiters (Defense in Depth)
// ==========================================

// Limit Login/Register requests
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
  message: { success: false, message: "Too many authentication attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Blocks Email Spamming for Password Resets
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 3, 
  message: { success: false, message: "Too many password reset requests. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// 🔥 NEW: Blocks OTP Email Spamming 
const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Max 3 OTP requests per 5 minutes
  message: { success: false, message: "Too many OTP requests. Please wait before trying again." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Prevents flooding deposit requests
const financialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15, 
  message: { success: false, message: "Too many deposit requests. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ==========================
// 🔐 Authentication Routes (Public)
// ==========================

// 🔥 NEW: Live Feed Public Route
router.get("/live-feed", getPublicLiveFeed);

// 🔥 NEW: Generate Captcha (Used in Login)
router.get("/captcha", generateCaptcha);

// 🔥 NEW: Send Registration OTP Email
router.post("/send-otp", otpLimiter, sendRegistrationOtp);

router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);
router.post("/logout", logoutUser); 

// Password Reset 
router.post("/forgot-password", passwordResetLimiter, forgotPassword);
router.patch("/reset-password/:id/:token", passwordResetLimiter, resetPassword);

// ==========================
// 👤 User Profile & Verification
// ==========================
router.get("/profile", protect, getUserProfile);
router.post("/verify", protect, submitVerification);

// ==========================
// 💳 Financial & Settings Routes
// ==========================
router.post("/deposit", protect, financialLimiter, depositFunds);
router.get("/deposits", protect, getMyDeposits);
router.get("/payment-settings", protect, getPaymentSettings);

// ==========================
// ⚖️ Appeals (User)
// ==========================
router.post("/appeal", protect, submitAppeal);

// ==========================
// 👑 Admin Routes (Strictly Protected)
// ==========================
router.get("/admin/role/:role", protect, authorize("admin"), getAllUsersByRole);
router.patch("/admin/status/:id", protect, authorize("admin"), updateUserStatus);
router.patch("/:id/trust-score", protect, authorize("admin"), updateTrustScore);
router.get("/admin/user/:id", protect, authorize("admin"), getAdminUserDetailsById);

// Appeals Management
router.get("/admin/appeals", protect, authorize("admin"), getPendingAppeals);
router.patch("/admin/appeal/:id", protect, authorize("admin"), resolveAppeal);

module.exports = router;