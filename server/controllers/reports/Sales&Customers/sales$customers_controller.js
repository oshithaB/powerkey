const { get } = require('http');
const db = require('../../../DB/db');

// Get customer contacts
const getCustomerContacts = async (req, res) => {
  const { company_id } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT 
          id,
          name,
          email,
          phone,
          billing_address,
          shipping_address
       FROM customer
       WHERE company_id = ? AND is_active = TRUE`,
      [company_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Customer not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: rows,
    });
  } catch (error) {
    console.error('Error fetching customer contacts:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

// Get sales by employee summary
const getSalesByEmployeeSummary = async (req, res) => {
  const { company_id } = req.params;
  const { start_date, end_date } = req.query;
  
  try {
    let query = `
      SELECT 
          e.name AS employee_name,
          COUNT(i.id) AS total_invoices,
          SUM(i.total_amount) AS total_sales,
          SUM(i.paid_amount) AS total_paid,
          SUM(i.balance_due) AS total_balance_due
       FROM employees e
       LEFT JOIN invoices i ON e.id = i.employee_id
       WHERE e.is_active = TRUE
         AND i.company_id = ?
         AND i.total_amount IS NOT NULL
         AND i.status IN ('opened', 'partially_paid', 'overdue')
    `;
    
    const queryParams = [company_id];

    if (start_date && end_date) {
      query += ` AND DATE(i.invoice_date) BETWEEN ? AND ?`;
      queryParams.push(start_date, end_date);
    }

    query += ` GROUP BY e.id, e.name`;

    const [rows] = await db.query(query, queryParams);

    res.status(200).json({
      status: 'success',
      data: rows
    });
  } catch (error) {
    console.error('Error fetching sales by employee summary:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// Get sales by customer summary
const getSalesByCustomerSummary = async (req, res) => {
  const { company_id } = req.params;
  const { start_date, end_date } = req.query;

  try {
    let query = `
      SELECT 
          c.id AS customer_id,
          c.name AS customer_name,
          COUNT(i.id) AS total_invoices,
          SUM(i.total_amount) AS total_sales,
          SUM(i.paid_amount) AS total_paid,
          SUM(i.balance_due) AS total_balance_due
       FROM customer c
       LEFT JOIN invoices i ON c.id = i.customer_id
       WHERE c.is_active = TRUE
         AND c.company_id = ?
         AND i.total_amount IS NOT NULL
         AND i.status IN ('opened', 'partially_paid')
    `;
    
    const queryParams = [company_id];

    if (start_date && end_date) {
      query += ` AND DATE(i.invoice_date) BETWEEN ? AND ?`;
      queryParams.push(start_date, end_date);
    }

    query += ` GROUP BY c.id, c.name`;

    const [rows] = await db.query(query, queryParams);

    res.status(200).json({
      status: 'success',
      data: rows
    });
  } catch (error) {
    console.error('Error fetching sales by customer summary:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// Get sales by customer detail
const getSalesByCustomerDetail = async (req, res) => {
  const { company_id } = req.params;
  const { start_date, end_date } = req.query;
  
  try {
    let query = `
      SELECT 
          c.name AS customer_name,
          i.invoice_number,
          i.invoice_date,
          i.due_date,
          i.total_amount,
          i.paid_amount,
          i.balance_due,
          i.status
       FROM customer c
       JOIN invoices i ON c.id = i.customer_id
       WHERE c.is_active = TRUE
         AND c.company_id = ?
    `;
    
    const queryParams = [company_id];

    if (start_date && end_date) {
      query += ` AND DATE(i.invoice_date) BETWEEN ? AND ?`;
      queryParams.push(start_date, end_date);
    }

    query += ` ORDER BY c.name, i.invoice_date`;

    const [rows] = await db.query(query, queryParams);

    res.status(200).json({
      status: 'success',
      data: rows
    });
  } catch (error) {
    console.error('Error fetching sales by customer detail:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// Get Sales by CustomerID Detail
const getSalesByCustomerIDDetail = async (req, res) => {
  const { company_id, customer_id } = req.params;
  const { start_date, end_date } = req.query;
  
  try {
    let query = `
      SELECT
          c.name AS customer_name,
          i.invoice_number,
          i.invoice_date,
          i.due_date,
          i.total_amount,
          i.paid_amount,
          i.balance_due,
          i.status
        FROM customer c
        JOIN invoices i ON c.id = i.customer_id
        WHERE c.is_active = TRUE
          AND c.company_id = ?
          AND c.id = ?
          AND i.status IN ('opened', 'partially_paid')
    `;
    
    const queryParams = [company_id, customer_id];

    if (start_date && end_date) {
      query += ` AND DATE(i.invoice_date) BETWEEN ? AND ?`;
      queryParams.push(start_date, end_date);
    }

    query += ` ORDER BY i.invoice_date DESC`;

    const [rows] = await db.query(query, queryParams);

    res.status(200).json({
      status: 'success',
      data: rows
    });
  } catch (error) {
    console.error('Error fetching sales by customer ID detail:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// Get Sales by Employee Detail
const getSalesByEmployeeDetail = async (req, res) => {
  const { company_id } = req.params;
  const { start_date, end_date } = req.query;
  
  try {
    let query = `
      SELECT
          e.name AS employee_name,
          i.invoice_number,
          i.invoice_date,
          i.due_date,
          i.total_amount,
          i.paid_amount,
          i.balance_due,
          i.status
        FROM employees e
        JOIN invoices i ON e.id = i.employee_id
        WHERE e.is_active = TRUE
          AND i.company_id = ?
    `;
    
    const queryParams = [company_id];

    if (start_date && end_date) {
      query += ` AND DATE(i.invoice_date) BETWEEN ? AND ?`;
      queryParams.push(start_date, end_date);
    }

    query += ` ORDER BY e.name, i.invoice_date`;

    const [rows] = await db.query(query, queryParams);

    res.status(200).json({
      status: 'success',
      data: rows
    });
  } catch (error) {
    console.error('Error fetching sales by employee detail:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// Get product/service list
const getProductServiceList = async (req, res) => {
  const { company_id } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT 
          p.id,
          p.name,
          p.sku,
          p.description,
          p.unit_price,
          p.quantity_on_hand,
          pc.name AS category_name
       FROM products p
       LEFT JOIN product_categories pc ON p.category_id = pc.id
       WHERE p.is_active = TRUE
         AND p.company_id = ?`,
      [company_id]
    );

    res.status(200).json({
      status: 'success',
      data: rows
    });
  } catch (error) {
    console.error('Error fetching product/service list:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// Get sales by product/service summary
const getSalesByProductServiceSummary = async (req, res) => {
  const { company_id } = req.params;
  const { start_date, end_date } = req.query;
  
  try {
    let query = `
      SELECT
          p.id AS product_id,
          p.name AS product_name,
          p.sku,
          p.unit_price,
          p.cost_price,
          SUM(p.cost_price * ii.quantity) AS total_cost,
          SUM(ii.quantity) AS total_quantity_sold,
          SUM(ii.total_price) AS total_sales
       FROM products p
       JOIN invoice_items ii ON p.id = ii.product_id
       JOIN invoices i ON ii.invoice_id = i.id
       WHERE p.company_id = ?
    `;
    
    const queryParams = [company_id];

    if (start_date && end_date) {
      query += ` AND DATE(i.invoice_date) BETWEEN ? AND ?`;
      queryParams.push(start_date, end_date);
    }

    query += ` GROUP BY p.id, p.name, p.sku`;

    const [rows] = await db.query(query, queryParams);

    res.status(200).json({
      status: 'success',
      data: rows
    });
  } catch (error) {
    console.error('Error fetching sales by product/service summary:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// Get income by customer summary
const getIncomeByCustomerSummary = async (req, res) => {
  const { company_id } = req.params;
  const { start_date, end_date } = req.query;
  
  try {
    let query = `
      SELECT 
          c.name AS customer_name,
          SUM(p.payment_amount) AS total_income,
          COUNT(p.id) AS total_payments
       FROM customer c
       LEFT JOIN payments p ON c.id = p.customer_id
       WHERE c.company_id = ?
    `;
    
    const queryParams = [company_id];

    if (start_date && end_date) {
      query += ` AND p.payment_date BETWEEN ? AND ?`;
      queryParams.push(start_date, end_date);
    }

    query += ` GROUP BY c.id, c.name`;

    const [rows] = await db.query(query, queryParams);

    res.status(200).json({
      status: 'success',
      data: rows
    });
  } catch (error) {
    console.error('Error fetching income by customer summary:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// Get sales by product/service detail
const getSalesByProductServiceDetail = async (req, res) => {
  const { company_id, product_id } = req.params;
  const { start_date, end_date } = req.query;
  
  try {
    let query = `
      SELECT
          p.id AS product_id,
          p.name AS product_name,
          p.sku,
          p.cost_price,
          p.cost_price * ii.quantity AS total_cost,
          ii.description,
          ii.quantity,
          ii.unit_price,
          ii.total_price,
          i.invoice_number,
          i.invoice_date,
          c.name AS customer_name
          
       FROM products p
       JOIN invoice_items ii ON p.id = ii.product_id
       JOIN invoices i ON ii.invoice_id = i.id
       JOIN customer c ON i.customer_id = c.id
       WHERE p.company_id = ? AND p.id = ?
    `;
    
    const queryParams = [company_id, product_id];

    if (start_date && end_date) {
      query += ` AND DATE(i.invoice_date) BETWEEN ? AND ?`;
      queryParams.push(start_date, end_date);
    }

    query += ` ORDER BY p.name, i.invoice_date`;

    const [rows] = await db.query(query, queryParams);

    res.status(200).json({
      status: 'success',
      data: rows
    });
  } catch (error) {
    console.error('Error fetching sales by product/service detail:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// Get customer phone list
const getCustomerPhoneList = async (req, res) => {
  const { company_id } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT 
          name,
          phone
       FROM customer
       WHERE is_active = TRUE
         AND company_id = ?`,
      [company_id]
    );

    res.status(200).json({
      status: 'success',
      data: rows
    });
  } catch (error) {
    console.error('Error fetching customer phone list:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// Get deposit detail
const getDepositDetail = async (req, res) => {
  const { company_id } = req.params;
  const { start_date, end_date } = req.query;
  
  try {
    let query = `
      SELECT 
          p.id,
          p.payment_date,
          p.payment_amount,
          p.payment_method,
          p.deposit_to,
          c.name AS customer_name,
          i.invoice_number,
          i.status AS invoice_status
       FROM payments p
       JOIN customer c ON p.customer_id = c.id
       JOIN invoices i ON p.invoice_id = i.id
       WHERE p.company_id = ?
    `;
    
    const queryParams = [company_id];

    if (start_date && end_date) {
      query += ` AND p.payment_date BETWEEN ? AND ?`;
      queryParams.push(start_date, end_date);
    }

    query += ` ORDER BY i.invoice_number DESC, p.payment_date DESC, p.id DESC`;

    const [rows] = await db.query(query, queryParams);

    res.status(200).json({
      status: 'success',
      data: rows
    });
  } catch (error) {
    console.error('Error fetching deposit detail:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// Get estimates by customer
const getEstimatesByCustomer = async (req, res) => {
  const { company_id } = req.params;
  const { start_date, end_date } = req.query;
  
  try {
    let query = `
      SELECT 
          c.name AS customer_name,
          e.estimate_number,
          e.estimate_date,
          e.expiry_date,
          e.total_amount,
          e.status
       FROM customer c
       JOIN estimates e ON c.id = e.customer_id
       WHERE c.company_id = ?
    `;
    
    const queryParams = [company_id];

    if (start_date && end_date) {
      query += ` AND e.estimate_date BETWEEN ? AND ?`;
      queryParams.push(start_date, end_date);
    }

    query += ` ORDER BY c.name, e.estimate_date`;

    const [rows] = await db.query(query, queryParams);

    res.status(200).json({
      status: 'success',
      data: rows
    });
  } catch (error) {
    console.error('Error fetching estimates by customer:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// Get inventory valuation summary
const getInventoryValuationSummary = async (req, res) => {
  const { company_id } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT 
          p.name AS product_name,
          p.sku,
          p.quantity_on_hand,
          p.unit_price,
          (p.quantity_on_hand * p.unit_price) AS total_value
       FROM products p
       WHERE p.is_active = TRUE
         AND p.company_id = ?
       GROUP BY p.id, p.name, p.sku, p.quantity_on_hand, p.unit_price`,
      [company_id]
    );

    res.status(200).json({
      status: 'success',
      data: rows
    });
  } catch (error) {
    console.error('Error fetching inventory valuation summary:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// Get inventory valuation detail
const getInventoryValuationDetail = async (req, res) => {
  const { company_id } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT 
          p.name AS product_name,
          p.sku,
          p.description,
          p.quantity_on_hand,
          p.unit_price,
          p.cost_price,
          (p.quantity_on_hand * p.unit_price) AS total_value,
          pc.name AS category_name
       FROM products p
       LEFT JOIN product_categories pc ON p.category_id = pc.id
       WHERE p.is_active = TRUE
         AND p.company_id = ?`,
      [company_id]
    );

    res.status(200).json({
      status: 'success',
      data: rows
    });
  } catch (error) {
    console.error('Error fetching inventory valuation detail:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// Get payment method list
const getPaymentMethodList = async (req, res) => {
  const { company_id } = req.params;
  const { start_date, end_date } = req.query;
  
  try {
    let query = `
      SELECT DISTINCT
          pm.id,
          pm.name
       FROM payment_methods pm
       JOIN payments p ON pm.name = p.payment_method
       WHERE p.company_id = ?
    `;
    
    const queryParams = [company_id];

    if (start_date && end_date) {
      query += ` AND p.payment_date BETWEEN ? AND ?`;
      queryParams.push(start_date, end_date);
    }

    const [rows] = await db.query(query, queryParams);

    res.status(200).json({
      status: 'success',
      data: rows
    });
  } catch (error) {
    console.error('Error fetching payment method list:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// Get stock take worksheet
const getStockTakeWorksheet = async (req, res) => {
  const { company_id } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT 
          p.name AS product_name,
          p.sku,
          p.quantity_on_hand,
          p.manual_count,
          p.reorder_level,
          pc.name AS category_name
       FROM products p
       LEFT JOIN product_categories pc ON p.category_id = pc.id
       WHERE p.is_active = TRUE
         AND p.company_id = ?`,
      [company_id]
    );

    res.status(200).json({
      status: 'success',
      data: rows
    });
  } catch (error) {
    console.error('Error fetching stock take worksheet:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// Get time activities by customer detail
const getTimeActivitiesByCustomerDetail = async (req, res) => {
  const { company_id } = req.params;
  const { start_date, end_date } = req.query;
  
  try {
    let query = `
      SELECT 
          c.name AS customer_name,
          i.invoice_number,
          i.invoice_date,
          ii.description,
          ii.quantity AS hours,
          ii.unit_price AS hourly_rate,
          ii.total_price
       FROM customer c
       JOIN invoices i ON c.id = i.customer_id
       JOIN invoice_items ii ON i.id = ii.invoice_id
       WHERE ii.description LIKE '%time activity%'
         AND c.company_id = ?
    `;
    
    const queryParams = [company_id];

    if (start_date && end_date) {
      query += ` AND DATE(i.invoice_date) BETWEEN ? AND ?`;
      queryParams.push(start_date, end_date);
    }

    query += ` ORDER BY c.name, i.invoice_date`;

    const [rows] = await db.query(query, queryParams);

    res.status(200).json({
      status: 'success',
      data: rows
    });
  } catch (error) {
    console.error('Error fetching time activities by customer detail:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

// Get transaction list by customer
const getTransactionListByCustomer = async (req, res) => {
  const { company_id } = req.params;
  const { start_date, end_date } = req.query;
  
  try {
    let query = `
      SELECT 
          c.name AS customer_name,
          i.invoice_number,
          i.invoice_date,
          i.total_amount,
          i.paid_amount,
          i.balance_due,
          i.status,
          p.payment_date,
          p.payment_amount,
          p.payment_method
       FROM customer c
       LEFT JOIN invoices i ON c.id = i.customer_id
       LEFT JOIN payments p ON i.id = p.invoice_id
       WHERE c.company_id = ? AND c.is_active = TRUE
    `;
    
    const queryParams = [company_id];

    if (start_date && end_date) {
      query += ` AND DATE(i.invoice_date) BETWEEN ? AND ?`;
      queryParams.push(start_date, end_date);
    }

    query += ` ORDER BY c.name, i.invoice_date, p.payment_date`;

    const [rows] = await db.query(query, queryParams);

    res.status(200).json({
      status: 'success',
      data: rows
    });
  } catch (error) {
    console.error('Error fetching transaction list by customer:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getCustomerContacts,
  getSalesByEmployeeSummary,
  getSalesByCustomerSummary,
  getSalesByCustomerDetail,
  getSalesByEmployeeDetail,
  getProductServiceList,
  getSalesByProductServiceSummary,
  getIncomeByCustomerSummary,
  getSalesByProductServiceDetail,
  getCustomerPhoneList,
  getDepositDetail,
  getEstimatesByCustomer,
  getInventoryValuationSummary,
  getInventoryValuationDetail,
  getPaymentMethodList,
  getStockTakeWorksheet,
  getTimeActivitiesByCustomerDetail,
  getTransactionListByCustomer,
  getSalesByCustomerIDDetail
};