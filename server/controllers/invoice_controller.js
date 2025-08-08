const db = require('../DB/db');
const asyncHandler = require('express-async-handler');

// Create Invoice
const createInvoice = asyncHandler(async (req, res) => {
  const {
    company_id,
    customer_id,
    employee_id,
    estimate_id,
    invoice_number,
    head_note,
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
    shipping_cost,
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

    // Check for duplicate invoice number
    const [duplicateInvoice] = await connection.query(
      `SELECT id FROM invoices WHERE invoice_number = ? AND company_id = ?`,
      [invoice_number, company_id]
    );

    if (duplicateInvoice.length > 0) {
      await connection.rollback();
      return res.status(400).json({ error: `Invoice number '${invoice_number}' already exists` });
    }

    const invoiceData = {
      company_id,
      customer_id,
      employee_id: employee_id || null,
      estimate_id: estimate_id || null,
      invoice_number,
      head_note: head_note || null,
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
      shipping_cost: shipping_cost || 0,
      total_amount: total_amount || 0,
      status: 'draft',
      created_at: new Date(),
      updated_at: new Date()
    };

    // Create new invoice
    const [result] = await connection.query(
      `INSERT INTO invoices SET ?`,
      invoiceData
    );
    const invoiceId = result.insertId;

    // Insert invoice items
    const itemQuery = `INSERT INTO invoice_items
                      (invoice_id, product_id, product_name, description, quantity, unit_price, actual_unit_price, tax_rate, tax_amount, total_price)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    for (const item of items) {
      const itemData = [
        invoiceId,
        item.product_id,
        item.product_name || null,
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
        await connection.rollback();
        return res.status(400).json({ error: "Failed to create invoice items" });
      }
    }

    // Handle file attachment if provided
    if (req.file) {
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
      head_note,
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
      shipping_cost,
      total_amount,
      status: 'draft',
      created_at: invoiceData.created_at.toISOString(),
      updated_at: invoiceData.updated_at.toISOString(),
      items
    };

    res.status(201).json(newInvoice);
  } catch (error) {
    await connection.rollback();
    console.error('Error creating invoice:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: `Invoice number '${invoice_number}' already exists` });
    }
    res.status(500).json({ error: error.sqlMessage || 'Internal server error' });
  } finally {
    connection.release();
  }
});

// Update Invoice
const updateInvoice = asyncHandler(async (req, res) => {
  const {
    company_id,
    customer_id,
    employee_id,
    estimate_id,
    invoice_number,
    head_note,
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
    shipping_cost,
    total_amount,
    items,
    attachment
  } = req.body;

  const invoiceId = req.params.invoiceId;

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

    // Check if invoice exists
    const [existingInvoice] = await connection.query(
      `SELECT id, invoice_number FROM invoices WHERE id = ? AND company_id = ?`,
      [invoiceId, company_id]
    );

    if (existingInvoice.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Check if invoice_number is unique only if it has changed
    if (invoice_number !== existingInvoice[0].invoice_number) {
      const [duplicateInvoice] = await connection.query(
        `SELECT id FROM invoices WHERE invoice_number = ? AND company_id = ? AND id != ?`,
        [invoice_number, company_id, invoiceId]
      );

      if (duplicateInvoice.length > 0) {
        await connection.rollback();
        return res.status(400).json({ error: `Invoice number '${invoice_number}' already exists` });
      }
    }

    const invoiceData = {
      company_id,
      customer_id,
      employee_id: employee_id || null,
      estimate_id: estimate_id || null,
      invoice_number,
      head_note: head_note || null,
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
      shipping_cost: shipping_cost || 0,
      total_amount: total_amount || 0,
      status: 'draft',
      updated_at: new Date()
    };

    // Update existing invoice
    const [updateResult] = await connection.query(
      `UPDATE invoices SET ? WHERE id = ? AND company_id = ?`,
      [invoiceData, invoiceId, company_id]
    );

    // Update estimate's shipping cost and total amount if estimate_id is provided
    if (estimate_id) {
      await connection.query(
        `UPDATE estimates SET shipping_cost = ?, total_amount = ?, updated_at = ? WHERE id = ? AND company_id = ?`,
        [shipping_cost, total_amount, new Date(), estimate_id, company_id]
      );
    }

    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(400).json({ error: "Failed to update invoice" });
    }

    // Delete existing items
    await connection.query(
      `DELETE FROM invoice_items WHERE invoice_id = ?`,
      [invoiceId]
    );

    // Insert updated invoice items
    const itemQuery = `INSERT INTO invoice_items
                      (invoice_id, product_id, product_name, description, quantity, unit_price, actual_unit_price, tax_rate, tax_amount, total_price)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    for (const item of items) {
      const itemData = [
        invoiceId,
        item.product_id,
        item.product_name || null,
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
        await connection.rollback();
        return res.status(400).json({ error: "Failed to create invoice items" });
      }
    }

    // Handle file attachment if provided
    if (req.file) {
      await connection.query(
        `DELETE FROM invoice_attachments WHERE invoice_id = ?`,
        [invoiceId]
      );
      await connection.query(
        `INSERT INTO invoice_attachments (invoice_id, file_path, file_name, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)`,
        [invoiceId, req.file.path, req.file.originalname, new Date(), new Date()]
      );
    }

    await connection.commit();

    const updatedInvoice = {
      id: invoiceId,
      invoice_number,
      head_note,
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
      shipping_cost,
      total_amount,
      status: 'draft',
      created_at: existingInvoice[0].created_at?.toISOString() || new Date().toISOString(),
      updated_at: invoiceData.updated_at.toISOString(),
      items
    };

    res.status(200).json({ message: 'Invoice updated successfully', invoice: updatedInvoice });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating invoice:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: `Invoice number '${invoice_number}' already exists` });
    }
    res.status(500).json({ error: error.sqlMessage || 'Internal server error' });
  } finally {
    connection.release();
  }
});

// Delete Invoice
const deleteInvoice = async (req, res) => {
  const { invoiceId } = req.params;

  if (!invoiceId) {
    return res.status(400).json({ error: "Invoice ID is required" });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Check if invoice exists
    const [existingInvoice] = await connection.query(
      `SELECT id FROM invoices WHERE id = ?`,
      [invoiceId]
    );

    if (existingInvoice.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Update the estimate status to pending and remove the invoice_id
    await connection.query(
      `UPDATE estimates SET status = 'pending', invoice_id = NULL WHERE invoice_id = ?`,
      [invoiceId]
    );

    // Delete invoice items
    await connection.query(
      `DELETE FROM invoice_items WHERE invoice_id = ?`,
      [invoiceId]
    );

    // Delete invoice attachments
    await connection.query(
      `DELETE FROM invoice_attachments WHERE invoice_id = ?`,
      [invoiceId]
    );

    // Delete payments associated with the invoice
    await connection.query(
      `DELETE FROM payments WHERE invoice_id = ?`,
      [invoiceId]
    );

    // Delete the invoice
    const [deleteResult] = await connection.query(
      `DELETE FROM invoices WHERE id = ?`,
      [invoiceId]
    );

    if (deleteResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(400).json({ error: "Failed to delete invoice" });
    }

    await connection.commit();
    res.status(200).json({ message: "Invoice deleted successfully" });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting invoice:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// Get Invoice
const getInvoice = async (req, res) => {
  const { id, company_id } = req.params;

  if (!id || !company_id) {
    return res.status(400).json({ error: 'Invoice ID and Company ID are required' });
  }

  try {
    const invoiceQuery = `
      SELECT i.*, c.name AS customer_name, c.phone AS customer_phone,
             e.name AS employee_name
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN employees e ON i.employee_id = e.id
      WHERE i.id = ? AND i.company_id = ?
    `;
    const [invoiceRows] = await db.execute(invoiceQuery, [id, company_id]);

    if (invoiceRows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoice = invoiceRows[0];

    const itemsQuery = `
      SELECT ii.*, p.name AS product_name, p.price AS product_price
      FROM invoice_items ii
      LEFT JOIN products p ON ii.product_id = p.id
      WHERE ii.invoice_id = ?
    `;
    const [itemsRows] = await db.execute(itemsQuery, [id]);

    invoice.items = itemsRows;

    res.status(200).json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get Invoices
const getInvoices = async (req, res) => {
  try {
    const { company_id } = req.params;

    if (!company_id) {
      return res.status(400).json({ error: "Company ID is required" });
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const query = `SELECT i.*, c.name AS customer_name, e.name AS employee_name
                     FROM invoices i
                     LEFT JOIN customer c ON i.customer_id = c.id
                     LEFT JOIN employees e ON i.employee_id = e.id
                     WHERE i.company_id = ?
                     ORDER BY i.created_at DESC`;
      
      const [invoices] = await connection.query(query, [company_id]);

      const currentDate = new Date();

      for (const invoice of invoices) {
        const dueDate = invoice.due_date ? new Date(invoice.due_date) : null;
        const paidAmount = Number(invoice.paid_amount) || 0;
        const totalAmount = Number(invoice.total_amount) || 0;
        const balanceDue = totalAmount - paidAmount;

        if (
          dueDate &&
          dueDate < currentDate &&
          invoice.status !== 'paid' &&
          invoice.status !== 'cancelled' &&
          balanceDue > 0
        ) {
          await connection.query(
            `UPDATE invoices 
             SET status = 'overdue', balance_due = ?, updated_at = ?
             WHERE id = ? AND company_id = ?`,
            [balanceDue, new Date(), invoice.id, company_id]
          );

          invoice.status = 'overdue';
          invoice.balance_due = balanceDue;
          invoice.updated_at = new Date().toISOString();
        }

        const [items] = await connection.query(
          `SELECT * FROM invoice_items WHERE invoice_id = ?`,
          [invoice.id]
        );

        invoice.items = items.map(item => ({
          ...item,
          created_at: item.created_at ? new Date(item.created_at).toISOString() : null,
          updated_at: item.updated_at ? new Date(item.updated_at).toISOString() : null
        }));

        invoice.invoice_date = invoice.invoice_date ? new Date(invoice.invoice_date).toISOString() : null;
        invoice.due_date = invoice.due_date ? new Date(invoice.due_date).toISOString() : null;
        invoice.shipping_date = invoice.shipping_date ? new Date(invoice.shipping_date).toISOString() : null;
        invoice.created_at = invoice.created_at ? new Date(invoice.created_at).toISOString() : null;
        invoice.updated_at = invoice.updated_at ? new Date(invoice.updated_at).toISOString() : null;
      }

      await connection.commit();
      res.status(200).json(invoices);
    } catch (error) {
      await connection.rollback();
      console.error('Error processing invoices:', error);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get Invoice By ID
const getInvoiceById = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    if (!invoiceId) {
      return res.status(400).json({ error: "Invoice ID is required" });
    }

    const query = `SELECT i.*, c.name AS customer_name, e.name AS employee_name
                   FROM invoices i
                   LEFT JOIN customer c ON i.customer_id = c.id
                   LEFT JOIN employees e ON i.employee_id = e.id
                   WHERE i.id = ?`;
    
    const [invoice] = await db.query(query, [invoiceId]);

    if (invoice.length === 0) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const itemsQuery = `SELECT * FROM invoice_items WHERE invoice_id = ?`;
    const [items] = await db.query(itemsQuery, [invoiceId]);
    invoice[0].items = items;

    res.status(200).json(invoice[0]);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get Invoice Items
const getInvoiceItems = async(req, res) => {
  try {
    const { invoiceId } = req.params;

    if (!invoiceId) {
      return res.status(400).json({ error: "Invoice ID is required" });
    }

    const query = `SELECT * FROM invoice_items WHERE invoice_id = ?`;
    const [items] = await db.query(query, [invoiceId]);

    if (items.length === 0) {
      return res.status(404).json({ message: "No items found for this invoice" });
    }

    res.status(200).json(items);
  } catch (error) {
    console.error('Error fetching invoice items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get Invoices By Customer
const getInvoicesByCustomer = asyncHandler(async (req, res) => {
  const { customerId, company_id } = req.params;

  if (!customerId || !company_id) {
    return res.status(400).json({ error: "Customer ID and Company ID are required" });
  }

  try {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const query = `SELECT i.*, c.name AS customer_name, e.name AS employee_name
                     FROM invoices i
                     LEFT JOIN customer c ON i.customer_id = c.id
                     LEFT JOIN employees e ON i.employee_id = e.id
                     WHERE i.customer_id = ? AND i.company_id = ?
                     ORDER BY i.created_at DESC`;

      const [invoices] = await connection.query(query, [customerId, company_id]);

      if (invoices.length === 0) {
        await connection.commit();
        return res.status(404).json({ message: "No invoices found for this customer" });
      }

      const currentDate = new Date();
      for (const invoice of invoices) {
        const dueDate = new Date(invoice.due_date);
        if (
          dueDate < currentDate &&
          invoice.status !== 'paid' &&
          invoice.status !== 'cancelled' &&
          invoice.balance_due > 0
        ) {
          await connection.query(
            `UPDATE invoices 
             SET status = 'overdue', updated_at = ?
             WHERE id = ? AND company_id = ?`,
            [new Date(), invoice.id, company_id]
          );
          invoice.status = 'overdue';
        }

        const [items] = await connection.query(
          `SELECT * FROM invoice_items WHERE invoice_id = ?`,
          [invoice.id]
        );
        invoice.items = items;
      }

      await connection.commit();
      res.status(200).json(invoices);
    } catch (error) {
      await connection.rollback();
      console.error('Error processing invoices by customer:', error);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching invoices by customer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Record Payment
const recordPayment = asyncHandler(async (req, res) => {
  const { customerId, company_id } = req.params;
  const { payment_amount, payment_date, payment_method, deposit_to, notes, invoice_payments } = req.body;

  if (!customerId || !company_id) {
    return res.status(400).json({ error: "Customer ID and Company ID are required" });
  }

  if (!payment_amount || payment_amount <= 0) {
    return res.status(400).json({ error: "Valid payment amount is required" });
  }

  if (!payment_date) {
    return res.status(400).json({ error: "Payment date is required" });
  }

  if (!payment_method) {
    return res.status(400).json({ error: "Payment method is required" });
  }

  if (!deposit_to) {
    return res.status(400).json({ error: "Deposit to is required" });
  }

  if (!invoice_payments || !Array.isArray(invoice_payments) || invoice_payments.length === 0) {
    return res.status(400).json({ error: "Invoice payment distribution is required" });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const totalInvoicePayments = invoice_payments.reduce((sum, { payment_amount }) => sum + Number(payment_amount), 0);
    if (Math.abs(totalInvoicePayments - payment_amount) > 0.01) {
      await connection.rollback();
      return res.status(400).json({ error: "Sum of invoice payments does not match total payment amount" });
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_id INT NOT NULL,
        customer_id INT NOT NULL,
        company_id INT NOT NULL,
        payment_amount DECIMAL(10,2) NOT NULL,
        payment_date DATE NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        deposit_to VARCHAR(100) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id),
        FOREIGN KEY (customer_id) REFERENCES customer(id),
        FOREIGN KEY (company_id) REFERENCES company(company_id)
      )
    `);

    const currentDate = new Date();

    for (const invoicePayment of invoice_payments) {
      const { invoice_id, payment_amount: invoicePaymentAmount } = invoicePayment;

      if (!invoice_id || invoicePaymentAmount <= 0) {
        await connection.rollback();
        return res.status(400).json({ error: "Invalid invoice ID or payment amount" });
      }

      const [invoice] = await connection.query(
        `SELECT total_amount, paid_amount, due_date FROM invoices WHERE id = ? AND company_id = ? AND customer_id = ?`,
        [invoice_id, company_id, customerId]
      );

      if (invoice.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: `Invoice ${invoice_id} not found` });
      }

      const newPaidAmount = (Number(invoice[0].paid_amount) || 0) + Number(invoicePaymentAmount);
      const totalAmount = Number(invoice[0].total_amount) || 0;
      const balanceDue = totalAmount - newPaidAmount;
      let status = 'draft';

      if (newPaidAmount >= totalAmount) {
        status = 'paid';
      } else if (newPaidAmount > 0) {
        status = 'partially_paid';
      }

      const dueDate = new Date(invoice[0].due_date);
      if (
        status !== 'paid' &&
        dueDate < currentDate &&
        balanceDue > 0 &&
        status !== 'cancelled'
      ) {
        status = 'overdue';
      }

      await connection.query(
        `INSERT INTO payments (invoice_id, customer_id, company_id, payment_amount, payment_date, payment_method, deposit_to, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [invoice_id, customerId, company_id, invoicePaymentAmount, payment_date, payment_method, deposit_to, notes || null]
      );

      await connection.query(
        `UPDATE invoices 
         SET paid_amount = ?, 
             balance_due = ?, 
             status = ?,
             updated_at = ?
         WHERE id = ? AND company_id = ?`,
        [newPaidAmount, balanceDue, status, new Date(), invoice_id, company_id]
      );
    }

    await connection.commit();
    res.status(200).json({ message: 'Payment recorded successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error recording payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
});

module.exports = {
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoice,
  getInvoices,
  getInvoiceById,
  getInvoiceItems,
  getInvoicesByCustomer,
  recordPayment
};