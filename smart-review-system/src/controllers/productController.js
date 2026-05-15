const pool = require("../config/db");

// =======================
// ✅ CREATE PRODUCT - 🔥 SECURED
// =======================
const createProduct = async (req, res) => {
  const client = await pool.connect();
  try {
    const sellerId = req.user.id;
    const { product_name, price, store_name, search_keyword, reward, product_link, country, required_orders, instructions, platform, category } = req.body;

    let image_url = '';
    if (req.file) {
      image_url = `http://localhost:5000/uploads/${req.file.filename}`;
    } else {
      return res.status(400).json({ success: false, message: "Product image file is required" });
    }

    const priceVal = parseFloat(price) || 0;
    const rewardVal = parseFloat(reward) || 0;
    const qtyVal = parseInt(required_orders) || 1;

    if (priceVal < 0 || rewardVal < 0 || qtyVal <= 0) {
       return res.status(400).json({ success: false, message: "Invalid pricing or quantity values" });
    }

    const costPerOrder = priceVal + rewardVal;
    const commissionPerOrder = costPerOrder * 0.10; 
    const requiredDepositPerProduct = costPerOrder + commissionPerOrder;
    
    const totalRequiredDeposit = requiredDepositPerProduct * qtyVal;

    await client.query('BEGIN');

    // Row-level lock on user to check balance securely
    const userResult = await client.query("SELECT wallet_balance FROM users WHERE id = $1 FOR UPDATE", [sellerId]);
    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const currentBalance = parseFloat(userResult.rows[0].wallet_balance) || 0;

    if (currentBalance < totalRequiredDeposit) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false,
        message: `Insufficient balance. You need a deposit of $${totalRequiredDeposit.toFixed(2)} to list this product.` 
      });
    }

    // Deduct Balance
    await client.query(
      "UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2",
      [totalRequiredDeposit, sellerId]
    );

    // Insert Product (Sanitizing strings where needed)
    const result = await client.query(
      `INSERT INTO products 
      (image_url, product_name, price, store_name, search_keyword, reward, product_link, country, required_orders, instructions, seller_id, platform, category, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'pending')
      RETURNING *`,
      [
        image_url, 
        product_name.trim(), 
        priceVal, 
        store_name.trim(), 
        search_keyword.trim(), 
        rewardVal, 
        product_link.trim(), 
        country.trim(), 
        qtyVal, 
        instructions ? instructions.trim() : '', 
        sellerId, 
        platform ? platform.trim() : 'Amazon', 
        category ? category.trim() : 'General'
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({ 
      success: true,
      message: "Product created successfully. Deposit deducted from wallet.", 
      product: result.rows[0] 
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("CREATE PRODUCT ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  } finally {
    client.release();
  }
};

// =======================
// ❌ CANCEL PRODUCT & REFUND (Seller) - 🔥 SECURED
// =======================
const cancelProduct = async (req, res) => {
  const client = await pool.connect();
  try {
    const sellerId = req.user.id;
    const productId = req.params.id;

    await client.query('BEGIN');

    // Lock product row
    const prodCheck = await client.query("SELECT * FROM products WHERE id = $1 AND seller_id = $2 FOR UPDATE", [productId, sellerId]);
    if (prodCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: "Product not found or unauthorized" });
    }
    
    const product = prodCheck.rows[0];

    if (product.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: "You can only cancel pending products." });
    }

    const priceVal = parseFloat(product.price) || 0;
    const rewardVal = parseFloat(product.reward) || 0;
    const qtyVal = parseInt(product.required_orders) || 1;
    
    const costPerOrder = priceVal + rewardVal;
    const commissionPerOrder = costPerOrder * 0.10;
    const refundAmount = (costPerOrder + commissionPerOrder) * qtyVal;

    // Refund wallet
    await client.query(
      "UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2",
      [refundAmount, sellerId]
    );

    // 🔥 SECURITY FIX: Log transaction
    await client.query(
      "INSERT INTO transactions (user_id, amount, type, description, status) VALUES ($1, $2, 'refund', $3, 'completed')",
      [sellerId, refundAmount, `Refund for self-cancelled product: ${product.product_name} (ID: ${product.id})`]
    );

    // Delete product
    await client.query("DELETE FROM products WHERE id = $1", [productId]);

    await client.query('COMMIT');

    res.status(200).json({ 
      success: true, 
      message: `Product cancelled successfully. $${refundAmount.toFixed(2)} has been refunded to your wallet.` 
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("CANCEL PRODUCT ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  } finally {
    client.release();
  }
};

// =======================
// ✏️ EDIT PRODUCT (Seller)
// =======================
const editProduct = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const productId = req.params.id;
    
    const { product_name, product_link, store_name, search_keyword, country, instructions, platform, category } = req.body;

    const prodCheck = await pool.query("SELECT id, status FROM products WHERE id = $1 AND seller_id = $2", [productId, sellerId]);
    if (prodCheck.rows.length === 0) return res.status(404).json({ success: false, message: "Product not found or unauthorized" });
    
    if (prodCheck.rows[0].status !== 'pending') {
      return res.status(400).json({ success: false, message: "You can only edit products that are in pending status." });
    }

    const result = await pool.query(
      `UPDATE products 
       SET product_name = $1, product_link = $2, store_name = $3, search_keyword = $4, country = $5, instructions = $6, platform = $7, category = $8
       WHERE id = $9 RETURNING *`,
      [
        product_name.trim(), 
        product_link.trim(), 
        store_name.trim(), 
        search_keyword.trim(), 
        country.trim(), 
        instructions ? instructions.trim() : '', 
        platform ? platform.trim() : 'Amazon', 
        category ? category.trim() : 'General', 
        productId
      ]
    );

    res.status(200).json({ success: true, message: "Product updated successfully.", product: result.rows[0] });

  } catch (error) {
    console.error("EDIT PRODUCT ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =======================
// 🌍 GET PUBLIC PRODUCTS (For Home Page - NO AUTH REQUIRED)
// =======================
const getPublicProducts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.product_name, p.image_url, p.price, p.reward, p.platform, p.country, p.category, p.status, p.required_orders,
             COALESCE(COUNT(a.id), 0)::int AS application_count
      FROM products p
      LEFT JOIN applications a ON p.id = a.product_id AND a.status != 'rejected'
      WHERE p.status IN ('approved', 'stopped')
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);
    res.status(200).json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    console.error("GET PUBLIC PRODUCTS ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =======================
// ✅ GET PRODUCTS (Admin & Buyer Logic - List View)
// =======================
const getProducts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.name AS seller_name, u.email AS seller_email,
             COALESCE(COUNT(a.id), 0)::int AS application_count
      FROM products p
      LEFT JOIN users u ON p.seller_id = u.id
      LEFT JOIN applications a ON p.id = a.product_id AND a.status != 'rejected'
      GROUP BY p.id, u.name, u.email
      ORDER BY p.created_at DESC
    `);
    res.status(200).json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =======================
// ✅ APPROVE PRODUCT (Admin)
// =======================
const approveProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const result = await pool.query(
      `UPDATE products SET status = 'approved' WHERE id = $1 RETURNING *`,
      [productId]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, message: "Product approved successfully", product: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =======================
// 🛑 STOP PRODUCT (Admin)
// =======================
const stopProductAdmin = async (req, res) => {
  try {
    const productId = req.params.id;
    const result = await pool.query(
      `UPDATE products SET status = 'stopped' WHERE id = $1 RETURNING *`,
      [productId]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, message: "Product stopped. It will now appear as Sold Out.", product: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =======================
// ▶️ RESUME PRODUCT (Admin)
// =======================
const resumeProductAdmin = async (req, res) => {
  try {
    const productId = req.params.id;
    const result = await pool.query(
      `UPDATE products SET status = 'approved' WHERE id = $1 RETURNING *`,
      [productId]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, message: "Product resumed successfully.", product: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =======================
// ❌ REJECT PRODUCT (Admin) - 🔥 DYNAMIC REFUND SECURED
// =======================
const rejectProductAdmin = async (req, res) => {
  const client = await pool.connect();
  try {
    const productId = req.params.id;
    
    await client.query('BEGIN');

    // Lock product row to prevent double rejection/cancellation
    const prodCheck = await client.query("SELECT * FROM products WHERE id = $1 FOR UPDATE", [productId]);
    if (prodCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const product = prodCheck.rows[0];
    
    // Allow rejection for both pending and stopped products
    if(product.status !== 'pending' && product.status !== 'stopped'){
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: "Only pending or stopped products can be rejected and refunded." });
    }
    
    const priceVal = parseFloat(product.price) || 0;
    const rewardVal = parseFloat(product.reward) || 0;
    const qtyVal = parseInt(product.required_orders) || 1;
    
    const costPerOrder = priceVal + rewardVal;
    const commissionPerOrder = costPerOrder * 0.10;

    // Smart Refund Logic: Check how many applications are already submitted
    const appCheck = await client.query("SELECT COUNT(*) FROM applications WHERE product_id = $1 AND status != 'rejected'", [productId]);
    const usedQty = parseInt(appCheck.rows[0].count) || 0;
    
    // If pending, full refund. If stopped, refund only unused quota
    let remainingQty = qtyVal;
    if (product.status === 'stopped') {
        remainingQty = Math.max(0, qtyVal - usedQty);
    }
    
    const refundAmount = (costPerOrder + commissionPerOrder) * remainingQty;

    // Refund the wallet ONLY if there is remaining money
    if (refundAmount > 0) {
        await client.query("UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2", [refundAmount, product.seller_id]);
        
        // 🔥 SECURITY FIX: Log Admin-initiated refund
        await client.query(
            "INSERT INTO transactions (user_id, amount, type, description, status) VALUES ($1, $2, 'refund', $3, 'completed')",
            [product.seller_id, refundAmount, `Admin refund for deleted/rejected product: ${product.product_name} (ID: ${product.id})`]
        );
    }
    
    // 🔥 SOFT DELETE: Update status instead of Hard Delete
    await client.query("UPDATE products SET status = 'rejected' WHERE id = $1", [productId]);

    await client.query('COMMIT');

    res.status(200).json({ 
        success: true, 
        message: `Product deleted & $${refundAmount.toFixed(2)} refunded to seller for ${remainingQty} unused slots.` 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("REJECT PRODUCT ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  } finally {
    client.release();
  }
};

// ===============================
// ✅ GET MY PRODUCTS (SELLER)
// ===============================
const getMyProducts = async (req, res) => {
  try {
    const sellerId = req.user.id;
    
    const result = await pool.query(
      `SELECT p.*, COALESCE(COUNT(a.id), 0)::int AS application_count 
       FROM products p 
       LEFT JOIN applications a ON p.id = a.product_id AND a.status != 'rejected'
       WHERE p.seller_id = $1 
       GROUP BY p.id 
       ORDER BY p.created_at DESC`, 
      [sellerId]
    );
    
    res.status(200).json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    console.error("GET MY PRODUCTS ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================================
// 🔥 GET PRODUCT BY ID (Smart Visibility)
// ============================================
const getProductById = async (req, res) => {
  try {
    const productId = req.params.id;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    const productResult = await pool.query('SELECT * FROM products WHERE id = $1', [productId]);
    
    if (productResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Product not found' });
    
    let product = productResult.rows[0];

    if (userRole === 'admin' || userRole === 'seller') {
        return res.status(200).json({ success: true, data: product });
    }

    if (userRole === 'buyer') {
        const appResult = await pool.query(
            `SELECT status FROM applications WHERE user_id = $1 AND product_id = $2`,
            [userId, productId]
        );

        const hasApplied = appResult.rows.length > 0;
        const isApproved = hasApplied && appResult.rows[0].status === 'approved';

        if (isApproved) {
            delete product.product_link; 
            delete product.seller_id; 
            return res.status(200).json({ success: true, data: product });
        } else {
            return res.status(200).json({
                success: true,
                data: {
                    id: product.id, image_url: product.image_url, price: product.price,
                    reward: product.reward, country: product.country, category: product.category, status: product.status
                }
            });
        }
    }
    res.status(403).json({ success: false, message: "Access denied" });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ============================================
// 🔥 GET MY REFUNDS (SELLER) - [NEW FUNCTION ADDED]
// ============================================
const getMyRefunds = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const result = await pool.query(
      `SELECT * FROM transactions WHERE user_id = $1 AND type = 'refund' ORDER BY created_at DESC`,
      [sellerId]
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error("GET MY REFUNDS ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================================
// 🔥 GET ALL REFUNDS (ADMIN) - [NEW FUNCTION ADDED]
// ============================================
const getAllRefunds = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, u.name, u.email 
       FROM transactions t 
       JOIN users u ON t.user_id = u.id 
       WHERE t.type = 'refund' 
       ORDER BY t.created_at DESC`
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error("GET ALL REFUNDS ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  createProduct,
  cancelProduct, 
  editProduct,   
  getPublicProducts, 
  getProducts,
  approveProduct,
  stopProductAdmin,
  resumeProductAdmin,
  rejectProductAdmin, 
  getMyProducts,
  getProductById,
  getMyRefunds,     // 🔥 Exported successfully
  getAllRefunds     // 🔥 Exported successfully
};