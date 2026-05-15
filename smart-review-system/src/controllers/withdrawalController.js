const pool = require("../config/db");

// ==========================================
// 💸 Request Withdrawal (Buyer/Seller) - 🔥 SECURED TRANSACTION
// ==========================================
const requestWithdrawal = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;
    const { amount, payment_method, account_details } = req.body;
    const amountValue = parseFloat(amount);

    // Strict input validation
    if (!amountValue || amountValue <= 0 || !payment_method || !account_details) {
      return res.status(400).json({ success: false, message: "Valid amount, payment_method, and account_details are required" });
    }

    await client.query('BEGIN');

    // 1. Lock user's wallet to prevent concurrent double-spending (Race Condition prevention)
    const userResult = await client.query("SELECT wallet_balance FROM users WHERE id = $1 FOR UPDATE", [userId]);
    
    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const currentBalance = parseFloat(userResult.rows[0].wallet_balance);

    if (currentBalance < amountValue) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
    }

    // 2. Deduct amount from wallet balance securely
    await client.query(
      "UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2",
      [amountValue, userId]
    );

    // 3. Insert withdrawal request into database (Sanitized strings)
    const withdrawalResult = await client.query(
      `INSERT INTO withdrawals (user_id, amount, payment_method, account_details, status)
       VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
      [userId, amountValue, payment_method.trim(), account_details.trim()]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: "Withdrawal request submitted successfully. Balance deducted.",
      data: withdrawalResult.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("REQUEST WITHDRAWAL ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  } finally {
    client.release();
  }
};

// ==========================================
// 📜 Get My Withdrawals (Buyer/Seller)
// ==========================================
const getMyWithdrawals = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      "SELECT * FROM withdrawals WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error("GET MY WITHDRAWALS ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==========================================
// 👑 Get All Withdrawals (Admin)
// ==========================================
const getAllWithdrawals = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT w.*, u.name, u.email 
       FROM withdrawals w
       JOIN users u ON w.user_id = u.id
       ORDER BY w.created_at DESC`
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error("GET ALL WITHDRAWALS ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==========================================
// 👑 Approve Withdrawal (Admin) - 🔥 SECURED TRANSACTION
// ==========================================
const approveWithdrawal = async (req, res) => {
  const client = await pool.connect();
  try {
    const withdrawalId = req.params.id;
    const { transaction_id, screenshot_url } = req.body;

    await client.query('BEGIN');

    // Lock withdrawal record to prevent duplicate approvals/rejections
    const checkResult = await client.query("SELECT status FROM withdrawals WHERE id = $1 FOR UPDATE", [withdrawalId]);
    
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: "Withdrawal not found" });
    }
    
    if (checkResult.rows[0].status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: "Only pending requests can be approved" });
    }

    const safeTxId = transaction_id ? transaction_id.trim() : null;
    const safeUrl = screenshot_url ? screenshot_url.trim() : null;

    // Update status to approved AND save payment proofs
    const updateResult = await client.query(
      "UPDATE withdrawals SET status = 'approved', transaction_id = $2, screenshot_url = $3 WHERE id = $1 RETURNING *",
      [withdrawalId, safeTxId, safeUrl]
    );

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: "Withdrawal approved successfully.",
      data: updateResult.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("APPROVE WITHDRAWAL ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  } finally {
    client.release();
  }
};

// ==========================================
// 👑 Reject Withdrawal (Admin) - 🔥 SECURED TRANSACTION
// ==========================================
const rejectWithdrawal = async (req, res) => {
  const client = await pool.connect();
  try {
    const withdrawalId = req.params.id;

    await client.query('BEGIN');

    // Lock the withdrawal record to prevent concurrent actions
    const checkResult = await client.query("SELECT * FROM withdrawals WHERE id = $1 FOR UPDATE", [withdrawalId]);
    
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: "Withdrawal not found" });
    }
    
    const withdrawal = checkResult.rows[0];
    
    if (withdrawal.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: "Only pending requests can be rejected" });
    }

    // 1. Update status to rejected
    const updateResult = await client.query(
      "UPDATE withdrawals SET status = 'rejected' WHERE id = $1 RETURNING *",
      [withdrawalId]
    );

    // 2. Refund money back to user's wallet safely
    await client.query(
      "UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2",
      [withdrawal.amount, withdrawal.user_id]
    );

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: "Withdrawal rejected. Money refunded to user's wallet.",
      data: updateResult.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("REJECT WITHDRAWAL ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  } finally {
    client.release();
  }
};

module.exports = {
  requestWithdrawal,
  getMyWithdrawals,
  getAllWithdrawals,
  approveWithdrawal,
  rejectWithdrawal
};