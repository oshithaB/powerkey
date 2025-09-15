const db = require('../DB/db');

const createBill = async (req, res) => {
  const { company_id } = req.params;
  const {
    bill_number,
    order_id,
    vendor_id,
    bill_date,
    payment_method,
    notes,
    total_amount,
    items,
  } = req.body;

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    // First, get the payment method ID from the name
    let payment_method_id = null;
    if (payment_method) {
      const [paymentMethodResult] = await conn.execute(
        'SELECT id FROM payment_methods WHERE name = ?',
        [payment_method]
      );
      if (paymentMethodResult.length > 0) {
        payment_method_id = paymentMethodResult[0].id;
      }
    }

    // Insert Bill
    const [result] = await conn.execute(
      `INSERT INTO bills 
        (company_id, bill_number, order_id, vendor_id, bill_date, payment_method_id, notes, total_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        company_id,
        bill_number,
        order_id || null,
        vendor_id || null,
        bill_date,
        payment_method_id,
        notes || null,
        total_amount,
      ]
    );

    const billId = result.insertId;

    // Insert Bill Items
    for (const item of items) {
      await conn.execute(
        `INSERT INTO bill_items 
          (bill_id, product_id, product_name, description, quantity, unit_price, total_price)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          billId,
          item.product_id || null,
          item.product_name,
          item.description,
          item.quantity,
          item.unit_price,
          item.total_price,
        ]
      );
    }
    await conn.commit();
    res.status(201).json({ message: "Bill created successfully", billId });
  } catch (error) {
    await conn.rollback();
    console.error("Error creating bill:", error);
    res.status(500).json({ error: "Failed to create bill" });
  } finally {
    conn.release();
  }
};

const getAllBills = async (req, res) => {
    const { company_id } = req.params;

    try {
        const [bills] = await db.query(
            `SELECT b.*,
            pm.name AS payment_method,
            v.name AS vendor_name,
            o.order_no AS order_number
            FROM bills b
            JOIN payment_methods pm ON b.payment_method_id = pm.id
            LEFT JOIN vendor v ON b.vendor_id = v.vendor_id
            LEFT JOIN orders o ON b.order_id = o.id
            WHERE b.company_id = ?
            ORDER BY b.created_at DESC`,
            [company_id]
        );
        res.json(bills);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch bills" });
  }
};  

const getBillById = async (req, res) => {
    const { company_id, bill_id } = req.params;

    try {
        const [bill] = await db.query(
            `SELECT * FROM bills WHERE company_id = ? AND id = ?`,
            [company_id, bill_id]
        );

        if (bill.length === 0) {
            return res.status(404).json({ error: "Bill not found" });
        }

        const [items] = await db.query(
            `SELECT * FROM bill_items WHERE bill_id = ?`,
            [bill_id]
        );

        res.json({ ...bill[0], items });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch bill" });
    }
}

const updateBill = async (req, res) => {
    const { company_id, bill_id } = req.params;
    const {
        order_id,
        vendor_id,
        bill_date,
        payment_method_id,
        notes,
        total_amount,
        items,
  } = req.body;

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    // Update Bill
    await conn.execute(
      `UPDATE bills 
       SET order_id=?, vendor_id=?, bill_date=?, payment_method_id=?, notes=?, total_amount=?
       WHERE id=? AND company_id=?`,
      [
        order_id || null,
        vendor_id,
        bill_date,
        payment_method_id,
        notes,
        total_amount,
        bill_id,
        company_id,
      ]
    );

    // Replace Items
    await conn.execute(`DELETE FROM bill_items WHERE bill_id=?`, [bill_id]);

    for (const item of items) {
      await conn.execute(
        `INSERT INTO bill_items 
          (bill_id, product_id, product_name, description, quantity, unit_price, total_price)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          bill_id,
          item.product_id,
          item.product_name,
          item.description,
          item.quantity,
          item.unit_price,
          item.total_price,
        ]
      );
    }

    await conn.commit();
    res.json({ message: "Bill updated successfully" });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({ error: "Failed to update bill" });
  } finally {
    conn.release();
  }
};

module.exports = {
  createBill,
  getAllBills,
  getBillById,
  updateBill,
};