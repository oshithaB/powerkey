const db = require("../DB/db");

const getEstimates = async (req, res) => {
    try {
        const { companyId } = req.params;

        if (!companyId) {
            return res.status(400).json({ error: "Company ID is required" });
        }

        const query = `SELECT 
                            e.id,
                            e.estimate_number,
                            e.company_id,
                            e.customer_id,
                            c.name AS customer_name,
                            e.employee_id,
                            emp.name AS employee_name,
                            e.estimate_date,
                            e.expiry_date,
                            e.subtotal,
                            e.discount_type,
                            e.discount_amount,
                            e.tax_amount,
                            e.total_amount,
                            e.status,
                            e.is_active,
                            e.notes,
                            e.terms,
                            e.shipping_address,
                            e.billing_address,
                            e.ship_via,
                            e.shipping_date,
                            e.tracking_number,
                            e.invoice_id,
                            e.created_at
                        FROM 
                            estimates e
                        JOIN 
                            customer c ON e.customer_id = c.id
                        LEFT JOIN 
                            employees emp ON e.employee_id = emp.id
                        WHERE 
                            e.company_id = ? AND e.is_active = 1;
                        `;
        const [estimates] = await db.query(query, [companyId]);
        res.json(estimates);
    } catch (error) {
        console.error("Error fetching estimates:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

const getEstimatesByCustomer = async (req, res) => {
    try {
        const { customerId } = req.params;

        if (!customerId) {
            return res.status(400).json({ error: "Customer ID is required" });
        }

        const query = `SELECT 
                            e.id,
                            e.estimate_number,
                            e.company_id,
                            e.customer_id,
                            c.name AS customer_name,
                            e.employee_id,
                            emp.name AS employee_name,
                            e.estimate_date,
                            e.expiry_date,
                            e.subtotal,
                            e.discount_type,
                            e.discount_amount,
                            e.tax_amount,
                            e.total_amount,
                            e.status,
                            e.is_active,
                            e.notes,
                            e.terms,
                            e.shipping_address,
                            e.billing_address,
                            e.ship_via,
                            e.shipping_date,
                            e.tracking_number
                        FROM 
                            estimates e
                        JOIN 
                            customer c ON e.customer_id = c.id
                        LEFT JOIN 
                            employees emp ON e.employee_id = emp.id
                        WHERE 
                            e.customer_id = ? AND e.is_active = 1;`;
        const [estimates] = await db.query(query, [customerId]);
        res.json(estimates);
    } catch (error) {
        console.error("Error fetching estimates by customer:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

const createEstimate = async (req, res) => {
    try {
        console.log("Request body:", req.body);

        const {
            estimate_number,
            company_id,
            customer_id,
            employee_id,
            estimate_date,
            expiry_date,
            subtotal,
            discount_type,
            discount_amount,
            tax_amount,
            total_amount,
            status,
            is_active,
            notes,
            terms,
            shipping_address,
            billing_address,
            ship_via,
            shipping_date,
            tracking_number,
            items
        } = req.body;

        // Validate required fields
        if (!estimate_number) {
            return res.status(400).json({ error: "Estimate number is required" });
        }
        if (!company_id) {
            return res.status(400).json({ error: "Company ID is required" });
        }
        if (!customer_id) {
            return res.status(400).json({ error: "Customer ID is required" });
        }
        if (!estimate_date) {
            return res.status(400).json({ error: "Estimate date is required" });
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

        // Start transaction
        await db.query('START TRANSACTION');

        // Insert into estimates table
        const estimateQuery = `INSERT INTO estimates
                        (estimate_number, company_id, customer_id, employee_id, estimate_date, expiry_date, 
                         subtotal, discount_type, discount_amount, tax_amount, total_amount, 
                         status, is_active, notes, terms, shipping_address, billing_address, ship_via, 
                         shipping_date, tracking_number)
                        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

        const estimateValues = [
            estimate_number,
            company_id,
            customer_id,
            employee_id || null,
            estimate_date,
            expiry_date || null,
            subtotal,
            discount_type || 'fixed',
            discount_amount || 0,
            tax_amount || 0,
            total_amount || 0,
            status || 'pending',
            is_active !== undefined ? is_active : true,
            notes || null,
            terms || null,
            shipping_address || null,
            billing_address || null,
            ship_via || null,
            shipping_date || null,
            tracking_number || null
        ];

        const [estimateResult] = await db.query(estimateQuery, estimateValues);
        
        if (estimateResult.affectedRows === 0) {
            await db.query('ROLLBACK');
            return res.status(400).json({ error: "Failed to create estimate" });
        }

        // Insert estimate items
        const itemQuery = `INSERT INTO estimate_items
                          (estimate_id, product_id, description, quantity, unit_price, actual_unit_price, tax_rate, tax_amount, total_price)
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        for (const item of items) {
            const itemValues = [
                estimateResult.insertId,
                item.product_id,
                item.description,
                item.quantity,
                item.unit_price,
                item.actual_unit_price,
                item.tax_rate,
                item.tax_amount,
                item.total_price
            ];
            const [itemResult] = await db.query(itemQuery, itemValues);
            if (itemResult.affectedRows === 0) {
                await db.query('ROLLBACK');
                return res.status(400).json({ error: "Failed to create estimate items" });
            }
        }

        // Commit transaction
        await db.query('COMMIT');

        const newEstimate = {
            id: estimateResult.insertId,
            estimate_number,
            company_id,
            customer_id,
            employee_id,
            estimate_date,
            expiry_date,
            subtotal,
            discount_type,
            discount_amount,
            tax_amount,
            total_amount,
            status,
            is_active,
            notes,
            terms,
            shipping_address,
            billing_address,
            ship_via,
            shipping_date,
            tracking_number,
            created_at: new Date().toISOString(), // Add created_at field
            items
        };

        res.status(201).json(newEstimate);
    } catch (error) {
        await db.query('ROLLBACK');
        console.error("Error creating estimate:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: `Estimate number '${req.body.estimate_number}' already exists` });
        }
        res.status(500).json({ error: error.sqlMessage || "Internal server error" }); // Return SQL error message
    }
};

const editEstimate = async (req, res) => {
  try {
    const {
      id, // Estimate ID to update
      estimate_number,
      company_id,
      customer_id,
      employee_id,
      estimate_date,
      expiry_date,
      subtotal,
      discount_type,
      discount_amount,
      tax_amount,
      total_amount,
      status,
      is_active,
      notes,
      terms,
      shipping_address,
      billing_address,
      ship_via,
      shipping_date,
      tracking_number,
      items
    } = req.body;

    if (!id) return res.status(400).json({ error: "Estimate ID is required" });

    // Validate required fields (same as in create)
    if (!estimate_number || !company_id || !customer_id || !estimate_date || !subtotal || isNaN(subtotal)) {
      return res.status(400).json({ error: "Required fields are missing or invalid" });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "At least one valid item is required" });
    }

    for (const item of items) {
      if (!item.product_id || item.product_id === 0) return res.status(400).json({ error: "Each item must have a valid product ID" });
      if (!item.description) return res.status(400).json({ error: "Each item must have a description" });
      if (!item.quantity || item.quantity <= 0) return res.status(400).json({ error: "Each item must have a valid quantity" });
      if (!item.unit_price || item.unit_price < 0) return res.status(400).json({ error: "Each item must have a valid unit price" });
      if (item.tax_rate < 0 || item.tax_amount < 0 || item.total_price < 0) {
        return res.status(400).json({ error: "Tax rate, tax amount, and total price must be valid" });
      }
    }

    await db.query('START TRANSACTION');

    // Update estimate
    const updateEstimateQuery = `
      UPDATE estimates SET
        estimate_number = ?, company_id = ?, customer_id = ?, employee_id = ?, estimate_date = ?, expiry_date = ?,
        subtotal = ?, discount_type = ?, discount_amount = ?, tax_amount = ?, total_amount = ?, status = ?, is_active = ?,
        notes = ?, terms = ?, shipping_address = ?, billing_address = ?, ship_via = ?, shipping_date = ?, tracking_number = ?
      WHERE id = ?
    `;

    const updateValues = [
      estimate_number, company_id, customer_id, employee_id || null, estimate_date, expiry_date || null,
      subtotal, discount_type || 'fixed', discount_amount || 0, tax_amount || 0, total_amount || 0, status || 'pending',
      is_active !== undefined ? is_active : true, notes || null, terms || null, shipping_address || null,
      billing_address || null, ship_via || null, shipping_date || null, tracking_number || null,
      id
    ];

    const [updateResult] = await db.query(updateEstimateQuery, updateValues);
    if (updateResult.affectedRows === 0) {
      await db.query('ROLLBACK');
      return res.status(400).json({ error: "Estimate not found or failed to update" });
    }

    // Delete existing items for this estimate
    await db.query('DELETE FROM estimate_items WHERE estimate_id = ?', [id]);

    // Insert updated items
    const insertItemQuery = `
      INSERT INTO estimate_items
        (estimate_id, product_id, description, quantity, unit_price, actual_unit_price, tax_rate, tax_amount, total_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (const item of items) {
      const itemValues = [
        id,
        item.product_id,
        item.description,
        item.quantity,
        item.unit_price,
        item.actual_unit_price || item.unit_price,
        item.tax_rate,
        item.tax_amount,
        item.total_price
      ];
      const [itemResult] = await db.query(insertItemQuery, itemValues);
      if (itemResult.affectedRows === 0) {
        await db.query('ROLLBACK');
        return res.status(400).json({ error: "Failed to update estimate items" });
      }
    }

    await db.query('COMMIT');

    res.status(200).json({ message: "Estimate updated successfully", estimate_id: id });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error("Error updating estimate:", error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: `Estimate number '${req.body.estimate_number}' already exists` });
    }
    res.status(500).json({ error: error.sqlMessage || "Internal server error" });
  }
};

const deleteEstimate = async (req, res) => {
    try {
        const { estimateId } = req.params;

        if (!estimateId) {
            return res.status(400).json({ error: "Estimate ID is required" });
        }

        // Check if estimate exists
        const [estimate] = await db.query('SELECT * FROM estimates WHERE id = ? AND is_active = 1', [estimateId]);
        if (estimate.length === 0) {
            return res.status(404).json({ error: "Estimate not found" });
        }

        // Delete estimate items
        await db.query('DELETE FROM estimate_items WHERE estimate_id = ?', [estimateId]);

        // Delete estimate
        const [result] = await db.query('DELETE FROM estimates WHERE id = ?', [estimateId]);
        
        if (result.affectedRows === 0) {
            return res.status(400).json({ error: "Failed to delete estimate" });
        }

        res.status(200).json({ message: "Estimate deleted successfully" });
    } catch (error) {
        console.error("Error deleting estimate:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

const getEstimatesItems = async (req, res) => {
    try {
        const { estimateId } = req.params;

        if (!estimateId) {
            return res.status(400).json({ error: "Estimate ID is required" });
        }

        const query = `SELECT 
                            ei.id,
                            ei.estimate_id,
                            ei.product_id,
                            p.name AS product_name,
                            ei.description,
                            ei.quantity,
                            ei.unit_price,
                            ei.actual_unit_price,
                            ei.tax_rate,
                            ei.tax_amount,
                            ei.total_price
                        FROM 
                            estimate_items ei
                        JOIN 
                            products p ON ei.product_id = p.id
                        WHERE 
                            ei.estimate_id = ?;`;
        const [items] = await db.query(query, [estimateId]);
        res.json(items);
    } catch (error) {
        console.error("Error fetching estimate items:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

const convertEstimateToInvoice = async (req, res) => {
    try {
        const { companyId, estimateId } = req.params;

        if (!companyId || !estimateId) {
            return res.status(400).json({ error: "Company ID and Estimate ID are required" });
        }

        // Start transaction
        await db.query('START TRANSACTION');

        // Fetch estimate details
        const [estimate] = await db.query(
            `SELECT 
                e.*,
                c.name AS customer_name,
                emp.name AS employee_name
             FROM estimates e
             JOIN customer c ON e.customer_id = c.id
             LEFT JOIN employees emp ON e.employee_id = emp.id
             WHERE e.id = ? AND e.company_id = ? AND e.is_active = 1`,
            [estimateId, companyId]
        );

        if (!estimate || estimate.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ error: "Estimate not found" });
        }

        const estimateData = estimate[0];

        // Check if estimate is already converted using status or invoice_id
        if (estimateData.status === 'converted' || estimateData.invoice_id !== null) {
            await db.query('ROLLBACK');
            return res.status(400).json({ error: "Estimate has already been converted to an invoice" });
        }

        // Generate invoice number (you may want to implement your own logic for invoice number generation)
        const invoiceNumber = `INV-${estimateData.estimate_number}-${Date.now()}`;

        // Create invoice
        const invoiceQuery = `
            INSERT INTO invoices (
                company_id, customer_id, employee_id, estimate_id, invoice_number, 
                invoice_date, due_date, discount_type, discount_value, discount_amount,
                notes, terms, shipping_address, billing_address, ship_via, 
                shipping_date, tracking_number, subtotal, tax_amount, total_amount,
                status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const invoiceValues = [
            companyId,
            estimateData.customer_id,
            estimateData.employee_id || null,
            estimateId,
            invoiceNumber,
            new Date().toISOString().split('T')[0], // Current date as invoice_date
            estimateData.expiry_date || null, // Use estimate expiry date as due date
            estimateData.discount_type || 'fixed',
            estimateData.discount_amount || 0.00, // Using discount_amount as discount_value
            estimateData.discount_amount || 0.00,
            estimateData.notes || null,
            estimateData.terms || null,
            estimateData.shipping_address || null,
            estimateData.billing_address || null,
            estimateData.ship_via || null,
            estimateData.shipping_date || null,
            estimateData.tracking_number || null,
            estimateData.subtotal || 0.00,
            estimateData.tax_amount || 0.00,
            estimateData.total_amount || 0.00,
            'draft' // Initial status
        ];

        const [invoiceResult] = await db.query(invoiceQuery, invoiceValues);

        if (invoiceResult.affectedRows === 0) {
            await db.query('ROLLBACK');
            return res.status(400).json({ error: "Failed to create invoice" });
        }

        // Fetch estimate items
        const [estimateItems] = await db.query(
            `SELECT * FROM estimate_items WHERE estimate_id = ?`,
            [estimateId]
        );

        // Insert invoice items
        const itemQuery = `
            INSERT INTO invoice_items (
                invoice_id, product_id, description, quantity, unit_price, 
                actual_unit_price, tax_rate, tax_amount, total_price
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        for (const item of estimateItems) {
            const itemValues = [
                invoiceResult.insertId,
                item.product_id,
                item.description,
                item.quantity,
                item.unit_price,
                item.actual_unit_price,
                item.tax_rate,
                item.tax_amount,
                item.total_price
            ];
            const [itemResult] = await db.query(itemQuery, itemValues);
            if (itemResult.affectedRows === 0) {
                await db.query('ROLLBACK');
                return res.status(400).json({ error: "Failed to create invoice items" });
            }
        }

        // Update estimate status to 'converted' and set invoice_id
        const updateEstimateQuery = `
            UPDATE estimates 
            SET status = 'converted', invoice_id = ?
            WHERE id = ?
        `;
        await db.query(updateEstimateQuery, [invoiceResult.insertId, estimateId]);

        // Commit transaction
        await db.query('COMMIT');

        res.status(200).json({
            message: "Estimate converted to invoice successfully",
            invoice_id: invoiceResult.insertId,
            invoice_number: invoiceNumber
        });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error("Error converting estimate to invoice:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: `Invoice number '${invoiceNumber}' already exists` });
        }
        res.status(500).json({ error: error.sqlMessage || "Internal server error" });
    }
};

module.exports = {
    getEstimates,
    createEstimate,
    deleteEstimate,
    editEstimate,
    getEstimatesItems,
    convertEstimateToInvoice,
    getEstimatesByCustomer
};