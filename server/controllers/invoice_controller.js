const db = require('../DB/db');
const asyncHandler = require('express-async-handler');

// Create or Update Invoice
const createOrUpdateInvoice = asyncHandler(async (req, res) => {
  const {
    company_id,
    customer_id,
    employee_id,
    estimate_id,
    invoice_number,
    invoice_date,
    due_date,
    discount_type,
    discount_value,
    notes,
    terms,
    shipping_address,
    billing_address,
    ship_via,
    shipping_date,
    tracking_number,
    subtotal,
    tax_amount,
    discount_amount,
    total_amount,
    items,
    attachment
  } = req.body;

  // Validate required fields
  if (!invoice_number) {
    return res.status(400).json({ error: "Invoice number is required" });
  }
  if (!company_id) {
    return res.status(400).json({ error: "Company ID is required" });
  }
  if (!customer_id) {
    return res.status(400).json({ error: "Customer ID is required" });
  }
  if (!invoice_date) {
    return res.status(400).json({ error: "Invoice date is required" });
  }
  if (!subtotal || isNaN(subtotal)) {
    return res.status(400).json({ error: "Valid subtotal is required" });
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "At least one valid item is required" });
  }

  // Validate items
  for (const item of items) {
    if (!item.product_id || item.product_id === 0) {
      return res.status(400).json({ error: "Each item must have a valid product ID" });
    }
    if (!item.description) {
      return res.status(400).json({ error: "Each item must have a description" });
    }
    if (!item.quantity || item.quantity <= 0) {
      return res.status(400).json({ error: "Each item must have a valid quantity" });
    }
    if (!item.unit_price || item.unit_price < 0) {
      return res.status(400).json({ error: "Each item must have a valid unit price" });
    }
    if (item.tax_rate < 0) {
      return res.status(400).json({ error: "Tax rate cannot be negative" });
    }
    if (item.tax_amount < 0) {
      return res.status(400).json({ error: "Tax amount cannot be negative" });
    }
    if (item.total_price < 0) {
      return res.status(400).json({ error: "Total price cannot be negative" });
    }
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const invoiceData = {
      company_id,
      customer_id,
      employee_id: employee_id || null,
      estimate_id: estimate_id || null,
      invoice_number,
      invoice_date,
      due_date: due_date || null,
      discount_type: discount_type || 'fixed',
      discount_value: discount_value || 0,
      notes: notes || null,
      terms: terms || null,
      shipping_address: shipping_address || null,
      billing_address: billing_address || null,
      ship_via: ship_via || null,
      shipping_date: shipping_date || null,
      tracking_number: tracking_number || null,
      subtotal,
      tax_amount: tax_amount || 0,
      discount_amount: discount_amount || 0,
      total_amount: total_amount || 0,
      status: 'draft',
      created_at: new Date(),
      updated_at: new Date()
    };

    let invoiceId;
    if (req.params.id) {
      // Update existing invoice
      await connection.query(
        `UPDATE invoices SET ? WHERE id = ? AND company_id = ?`,
        [invoiceData, req.params.id, company_id]
      );
      invoiceId = req.params.id;

      // Delete existing items
      await connection.query(
        `DELETE FROM invoice_items WHERE invoice_id = ?`,
        [invoiceId]
      );
    } else {
      // Create new invoice
      const [result] = await connection.query(
        `INSERT INTO invoices SET ?`,
        invoiceData
      );
      invoiceId = result.insertId;
    }

    // Insert invoice items
    const itemQuery = `INSERT INTO invoice_items
                      (invoice_id, product_id, product_name, description, quantity, unit_price, actual_unit_price, tax_rate, tax_amount, total_price)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    for (const item of items) {
      const itemData = [
        invoiceId,
        item.product_id,
        item.product_name,
        item.description,
        item.quantity,
        item.unit_price,
        item.actual_unit_price,
        item.tax_rate,
        item.tax_amount,
        item.total_price
      ];
      const [itemResult] = await connection.query(itemQuery, itemData);
      if (itemResult.affectedRows === 0) {
        await connection.query('ROLLBACK');
        return res.status(400).json({ error: "Failed to create invoice items" });
      }
    }

    // Handle file attachment if provided
    if (attachment && req.file) {
      await connection.query(
        `INSERT INTO invoice_attachments (invoice_id, file_path, file_name, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [invoiceId, req.file.path, req.file.originalname, new Date(), new Date()]
      );
    }

    await connection.commit();

    const newInvoice = {
      id: invoiceId,
      invoice_number,
      company_id,
      customer_id,
      employee_id,
      estimate_id,
      invoice_date,
      due_date,
      discount_type,
      discount_value,
      notes,
      terms,
      shipping_address,
      billing_address,
      ship_via,
      shipping_date,
      tracking_number,
      subtotal,
      tax_amount,
      discount_amount,
      total_amount,
      status: 'draft',
      created_at: new Date().toISOString(),
      items
    };

    res.status(req.params.id ? 200 : 201).json(req.params.id ? { message: 'Invoice updated successfully', invoice: newInvoice } : newInvoice);
  } catch (error) {
    await connection.rollback();
    console.error('Error saving invoice:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: `Invoice number '${invoice_number}' already exists` });
    }
    res.status(500).json({ error: error.sqlMessage || 'Internal server error' });
  } finally {
    connection.release();
  }
});

// Get Invoices
const getInvoices = async (req, res) => {
    try {
        const { company_id } = req.params;

        if (!company_id) {
            return res.status(400).json({ error: "Company ID is required" });
        }

        const query = `SELECT i.*, c.name AS customer_name, e.name AS employee_name
               FROM invoices i
               LEFT JOIN customer c ON i.customer_id = c.id
               LEFT JOIN employees e ON i.employee_id = e.id
               WHERE i.company_id = ?
               ORDER BY i.created_at DESC`;
        
        const [invoices] = await db.query(query, [company_id]);

        if (invoices.length === 0) {
            return res.status(404).json({ message: "No invoices found for this company" });
        }

        // Fetch items for each invoice
        const invoiceItemsQuery = `SELECT * FROM invoice_items WHERE invoice_id = ?`;
        for (const invoice of invoices) {
            const [items] = await db.query(invoiceItemsQuery, [invoice.id]);
            invoice.items = items;
        }

        res.status(200).json(invoices);
    }

    catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {
  createOrUpdateInvoice,
  getInvoices
};