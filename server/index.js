import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'powerkey'
};

let db;

async function initDatabase() {
  try {
    // Step 1: Connect without database first, to create the database if needed
    const tempDb = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });
    console.log('Connected to MySQL (no DB selected yet)');

    // Step 2: Create the database if it doesn't exist
    await tempDb.execute(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
    await tempDb.end();

    // Step 3: Now connect with the database specified
    db = await mysql.createConnection(dbConfig);
    console.log(`Connected to MySQL database: ${dbConfig.database}`);

    // Step 4: Create tables
    await createTables();

  } catch (error) {
    console.error('Database connection failed:', error);
  }
}

async function createTables() {
  const tables = [
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    
    // Companies table
    `CREATE TABLE IF NOT EXISTS companies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      address TEXT,
      phone VARCHAR(50),
      email VARCHAR(255),
      tax_number VARCHAR(100),
      logo VARCHAR(255),
      currency VARCHAR(10) DEFAULT 'USD',
      fiscal_year_start DATE,
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )`,
    
    // Company users (many-to-many relationship)
    `CREATE TABLE IF NOT EXISTS company_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT,
      user_id INT,
      role ENUM('admin', 'manager', 'employee') DEFAULT 'employee',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY unique_company_user (company_id, user_id)
    )`,
    
    // Tax rates table
    `CREATE TABLE IF NOT EXISTS tax_rates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT,
      name VARCHAR(100) NOT NULL,
      rate DECIMAL(5,2) NOT NULL,
      type ENUM('sales', 'purchase', 'both') DEFAULT 'both',
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    )`,
    
    // Employees table
    `CREATE TABLE IF NOT EXISTS employees (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT,
      employee_id VARCHAR(50),
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      address TEXT,
      position VARCHAR(100),
      department VARCHAR(100),
      salary DECIMAL(10,2),
      hire_date DATE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    )`,
    
    // Customers table
    `CREATE TABLE IF NOT EXISTS customers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT,
      customer_code VARCHAR(50),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      address TEXT,
      city VARCHAR(100),
      state VARCHAR(100),
      zip_code VARCHAR(20),
      country VARCHAR(100),
      credit_limit DECIMAL(15,2) DEFAULT 0,
      balance DECIMAL(15,2) DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      credit_hold BOOLEAN DEFAULT FALSE,
      credit_hold_date DATE NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    )`,
    
    // Vendors table
    `CREATE TABLE IF NOT EXISTS vendors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT,
      vendor_code VARCHAR(50),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      address TEXT,
      city VARCHAR(100),
      state VARCHAR(100),
      zip_code VARCHAR(20),
      country VARCHAR(100),
      balance DECIMAL(15,2) DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    )`,
    
    // Products/Items table
    `CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT,
      sku VARCHAR(100),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100),
      unit_price DECIMAL(10,2) DEFAULT 0,
      cost_price DECIMAL(10,2) DEFAULT 0,
      quantity_on_hand INT DEFAULT 0,
      reorder_level INT DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    )`,
    
    // Chart of Accounts
    `CREATE TABLE IF NOT EXISTS accounts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT,
      account_code VARCHAR(20),
      account_name VARCHAR(255) NOT NULL,
      account_type ENUM('Asset', 'Liability', 'Equity', 'Revenue', 'Expense') NOT NULL,
      parent_id INT NULL,
      balance DECIMAL(15,2) DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES accounts(id)
    )`,
    
    // Estimates table
    `CREATE TABLE IF NOT EXISTS estimates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT,
      estimate_number VARCHAR(50) NOT NULL,
      customer_id INT,
      employee_id INT,
      estimate_date DATE NOT NULL,
      expiry_date DATE,
      subtotal DECIMAL(15,2) DEFAULT 0,
      discount_type ENUM('percentage', 'fixed') DEFAULT 'fixed',
      discount_value DECIMAL(10,2) DEFAULT 0,
      discount_amount DECIMAL(15,2) DEFAULT 0,
      tax_amount DECIMAL(15,2) DEFAULT 0,
      total_amount DECIMAL(15,2) DEFAULT 0,
      status ENUM('draft', 'sent', 'accepted', 'declined', 'expired', 'converted') DEFAULT 'draft',
      notes TEXT,
      terms TEXT,
      converted_to_invoice_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    )`,
    
    // Estimate items table
    `CREATE TABLE IF NOT EXISTS estimate_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      estimate_id INT,
      product_id INT,
      description VARCHAR(255),
      quantity DECIMAL(10,2) NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      tax_rate DECIMAL(5,2) DEFAULT 0,
      tax_amount DECIMAL(15,2) DEFAULT 0,
      total_price DECIMAL(15,2) NOT NULL,
      FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )`,
    
    // Invoices table
    `CREATE TABLE IF NOT EXISTS invoices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT,
      invoice_number VARCHAR(50) NOT NULL,
      customer_id INT,
      employee_id INT,
      estimate_id INT NULL,
      invoice_date DATE NOT NULL,
      due_date DATE,
      subtotal DECIMAL(15,2) DEFAULT 0,
      discount_type ENUM('percentage', 'fixed') DEFAULT 'fixed',
      discount_value DECIMAL(10,2) DEFAULT 0,
      discount_amount DECIMAL(15,2) DEFAULT 0,
      tax_amount DECIMAL(15,2) DEFAULT 0,
      total_amount DECIMAL(15,2) DEFAULT 0,
      paid_amount DECIMAL(15,2) DEFAULT 0,
      balance_due DECIMAL(15,2) DEFAULT 0,
      status ENUM('draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled') DEFAULT 'draft',
      notes TEXT,
      terms TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      FOREIGN KEY (estimate_id) REFERENCES estimates(id)
    )`,
    
    // Invoice items table
    `CREATE TABLE IF NOT EXISTS invoice_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      invoice_id INT,
      product_id INT,
      description VARCHAR(255),
      quantity DECIMAL(10,2) NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      tax_rate DECIMAL(5,2) DEFAULT 0,
      tax_amount DECIMAL(15,2) DEFAULT 0,
      total_price DECIMAL(15,2) NOT NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )`,
    
    // Payments table
    `CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT,
      invoice_id INT,
      payment_number VARCHAR(50),
      payment_date DATE NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      payment_method ENUM('cash', 'check', 'credit_card', 'bank_transfer', 'other') NOT NULL,
      reference_number VARCHAR(100),
      notes TEXT,
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )`,
    
    // Expenses table
    `CREATE TABLE IF NOT EXISTS expenses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT,
      expense_number VARCHAR(50),
      vendor_id INT,
      employee_id INT,
      account_id INT,
      expense_date DATE NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      tax_amount DECIMAL(15,2) DEFAULT 0,
      total_amount DECIMAL(15,2) NOT NULL,
      payment_method ENUM('cash', 'check', 'credit_card', 'bank_transfer', 'other'),
      reference_number VARCHAR(100),
      description TEXT,
      receipt_file VARCHAR(255),
      status ENUM('pending', 'approved', 'paid', 'rejected') DEFAULT 'pending',
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (vendor_id) REFERENCES vendors(id),
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      FOREIGN KEY (account_id) REFERENCES accounts(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )`
  ];

  for (const table of tables) {
    try {
      await db.execute(table);
    } catch (error) {
      console.error('Error creating table:', error);
    }
  }
}

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    // Check if user already exists
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const [result] = await db.execute(
      'INSERT INTO users (email, password, first_name, last_name) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, firstName, lastName]
    );
    
    const token = jwt.sign(
      { userId: result.insertId, email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: result.insertId,
        email,
        firstName,
        lastName
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const [users] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const user = users[0];
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Company routes
app.get('/api/companies', authenticateToken, async (req, res) => {
  try {
    const [companies] = await db.execute(`
      SELECT c.*, cu.role 
      FROM companies c
      JOIN company_users cu ON c.id = cu.company_id
      WHERE cu.user_id = ?
    `, [req.user.userId]);
    
    res.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

app.post('/api/companies', authenticateToken, upload.single('logo'), async (req, res) => {
  try {
    const {
      name,
      address,
      phone,
      email,
      taxNumber,
      currency,
      fiscalYearStart,
      taxRates,
      employees
    } = req.body;
    
    const logoPath = req.file ? `/uploads/${req.file.filename}` : null;
    
    // Create company
    const [companyResult] = await db.execute(
      `INSERT INTO companies (name, address, phone, email, tax_number, logo, currency, fiscal_year_start, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, address, phone, email, taxNumber, logoPath, currency, fiscalYearStart, req.user.userId]
    );
    
    const companyId = companyResult.insertId;
    
    // Add user as admin of the company
    await db.execute(
      'INSERT INTO company_users (company_id, user_id, role) VALUES (?, ?, ?)',
      [companyId, req.user.userId, 'admin']
    );
    
    // Add tax rates
    if (taxRates && Array.isArray(taxRates)) {
      for (const taxRate of taxRates) {
        await db.execute(
          'INSERT INTO tax_rates (company_id, name, rate, type) VALUES (?, ?, ?, ?)',
          [companyId, taxRate.name, taxRate.rate, taxRate.type]
        );
      }
    }
    
    // Add employees
    if (employees && Array.isArray(employees)) {
      for (const employee of employees) {
        await db.execute(
          `INSERT INTO employees (company_id, employee_id, first_name, last_name, email, phone, position, department, salary, hire_date) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [companyId, employee.employeeId, employee.firstName, employee.lastName, employee.email, employee.phone, employee.position, employee.department, employee.salary, employee.hireDate]
        );
      }
    }
    
    // Create default chart of accounts
    await createDefaultAccounts(companyId);
    
    res.json({ id: companyId, message: 'Company created successfully' });
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ error: 'Failed to create company' });
  }
});

async function createDefaultAccounts(companyId) {
  const defaultAccounts = [
    { code: '1000', name: 'Cash', type: 'Asset' },
    { code: '1200', name: 'Accounts Receivable', type: 'Asset' },
    { code: '1300', name: 'Inventory', type: 'Asset' },
    { code: '1500', name: 'Equipment', type: 'Asset' },
    { code: '2000', name: 'Accounts Payable', type: 'Liability' },
    { code: '2100', name: 'Sales Tax Payable', type: 'Liability' },
    { code: '3000', name: 'Owner\'s Equity', type: 'Equity' },
    { code: '4000', name: 'Sales Revenue', type: 'Revenue' },
    { code: '5000', name: 'Cost of Goods Sold', type: 'Expense' },
    { code: '6000', name: 'Operating Expenses', type: 'Expense' },
    { code: '6100', name: 'Office Supplies', type: 'Expense' },
    { code: '6200', name: 'Travel & Entertainment', type: 'Expense' },
    { code: '6300', name: 'Utilities', type: 'Expense' },
    { code: '6400', name: 'Rent', type: 'Expense' }
  ];
  
  for (const account of defaultAccounts) {
    await db.execute(
      'INSERT INTO accounts (company_id, account_code, account_name, account_type) VALUES (?, ?, ?, ?)',
      [companyId, account.code, account.name, account.type]
    );
  }
}

// Dashboard data
app.get('/api/dashboard/:companyId', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    
    // Get dashboard metrics
    const [customers] = await db.execute('SELECT COUNT(*) as count FROM customers WHERE company_id = ?', [companyId]);
    const [vendors] = await db.execute('SELECT COUNT(*) as count FROM vendors WHERE company_id = ?', [companyId]);
    const [products] = await db.execute('SELECT COUNT(*) as count FROM products WHERE company_id = ?', [companyId]);
    const [invoices] = await db.execute('SELECT COUNT(*) as count, SUM(total_amount) as total FROM invoices WHERE company_id = ?', [companyId]);
    const [estimates] = await db.execute('SELECT COUNT(*) as count, SUM(total_amount) as total FROM estimates WHERE company_id = ?', [companyId]);
    const [expenses] = await db.execute('SELECT COUNT(*) as count, SUM(total_amount) as total FROM expenses WHERE company_id = ?', [companyId]);
    
    // Get recent invoices
    const [recentInvoices] = await db.execute(`
      SELECT i.*, c.name as customer_name 
      FROM invoices i 
      LEFT JOIN customers c ON i.customer_id = c.id 
      WHERE i.company_id = ? 
      ORDER BY i.created_at DESC 
      LIMIT 5
    `, [companyId]);
    
    res.json({
      metrics: {
        customers: customers[0].count,
        vendors: vendors[0].count,
        products: products[0].count,
        invoices: invoices[0].count,
        estimates: estimates[0].count,
        expenses: expenses[0].count,
        totalRevenue: invoices[0].total || 0,
        totalEstimates: estimates[0].total || 0,
        totalExpenses: expenses[0].total || 0
      },
      recentInvoices
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Check customer credit status
async function checkCustomerCreditStatus(customerId, companyId) {
  const [overdueInvoices] = await db.execute(`
    SELECT COUNT(*) as count, SUM(balance_due) as total_due
    FROM invoices 
    WHERE customer_id = ? AND company_id = ? 
    AND status IN ('sent', 'partially_paid', 'overdue') 
    AND due_date < DATE_SUB(NOW(), INTERVAL 60 DAY)
  `, [customerId, companyId]);
  
  const hasOverdueInvoices = overdueInvoices[0].count > 0;
  
  if (hasOverdueInvoices) {
    // Update customer credit hold status
    await db.execute(
      'UPDATE customers SET credit_hold = TRUE, credit_hold_date = NOW() WHERE id = ? AND company_id = ?',
      [customerId, companyId]
    );
  }
  
  return hasOverdueInvoices;
}

// Estimates routes
app.get('/api/estimates/:companyId', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    const [estimates] = await db.execute(`
      SELECT e.*, c.name as customer_name, emp.first_name, emp.last_name
      FROM estimates e
      LEFT JOIN customers c ON e.customer_id = c.id
      LEFT JOIN employees emp ON e.employee_id = emp.id
      WHERE e.company_id = ? 
      ORDER BY e.created_at DESC
    `, [companyId]);
    
    res.json(estimates);
  } catch (error) {
    console.error('Error fetching estimates:', error);
    res.status(500).json({ error: 'Failed to fetch estimates' });
  }
});

app.post('/api/estimates/:companyId', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    const {
      estimate_number,
      customer_id,
      employee_id,
      estimate_date,
      expiry_date,
      items,
      discount_type,
      discount_value,
      notes,
      terms
    } = req.body;
    
    // Calculate totals
    let subtotal = 0;
    let totalTax = 0;
    
    for (const item of items) {
      const itemTotal = item.quantity * item.unit_price;
      subtotal += itemTotal;
      totalTax += item.tax_amount || 0;
    }
    
    // Calculate discount
    let discountAmount = 0;
    if (discount_type === 'percentage') {
      discountAmount = (subtotal * discount_value) / 100;
    } else {
      discountAmount = discount_value || 0;
    }
    
    const totalAmount = subtotal - discountAmount + totalTax;
    
    // Create estimate
    const [result] = await db.execute(`
      INSERT INTO estimates (
        company_id, estimate_number, customer_id, employee_id, estimate_date, expiry_date,
        subtotal, discount_type, discount_value, discount_amount, tax_amount, total_amount,
        notes, terms
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      companyId, estimate_number, customer_id, employee_id, estimate_date, expiry_date,
      subtotal, discount_type, discount_value, discountAmount, totalTax, totalAmount,
      notes, terms
    ]);
    
    const estimateId = result.insertId;
    
    // Add estimate items
    for (const item of items) {
      await db.execute(`
        INSERT INTO estimate_items (
          estimate_id, product_id, description, quantity, unit_price, tax_rate, tax_amount, total_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        estimateId, item.product_id, item.description, item.quantity, item.unit_price,
        item.tax_rate, item.tax_amount, item.quantity * item.unit_price
      ]);
    }
    
    res.json({ id: estimateId, message: 'Estimate created successfully' });
  } catch (error) {
    console.error('Error creating estimate:', error);
    res.status(500).json({ error: 'Failed to create estimate' });
  }
});

// Update estimate
app.put('/api/estimates/:companyId/:estimateId', authenticateToken, async (req, res) => {
  try {
    const { companyId, estimateId } = req.params;
    const {
      estimate_number,
      customer_id,
      employee_id,
      estimate_date,
      expiry_date,
      items,
      discount_type,
      discount_value,
      notes,
      terms
    } = req.body;
    
    // Calculate totals
    let subtotal = 0;
    let totalTax = 0;
    
    for (const item of items) {
      const itemTotal = item.quantity * item.unit_price;
      subtotal += itemTotal;
      totalTax += item.tax_amount || 0;
    }
    
    // Calculate discount
    let discountAmount = 0;
    if (discount_type === 'percentage') {
      discountAmount = (subtotal * discount_value) / 100;
    } else {
      discountAmount = discount_value || 0;
    }
    
    const totalAmount = subtotal - discountAmount + totalTax;
    
    // Update estimate
    await db.execute(`
      UPDATE estimates SET
        estimate_number = ?, customer_id = ?, employee_id = ?, estimate_date = ?, expiry_date = ?,
        subtotal = ?, discount_type = ?, discount_value = ?, discount_amount = ?, tax_amount = ?, 
        total_amount = ?, notes = ?, terms = ?
      WHERE id = ? AND company_id = ?
    `, [
      estimate_number, customer_id, employee_id, estimate_date, expiry_date,
      subtotal, discount_type, discount_value, discountAmount, totalTax, totalAmount,
      notes, terms, estimateId, companyId
    ]);
    
    // Delete existing items
    await db.execute('DELETE FROM estimate_items WHERE estimate_id = ?', [estimateId]);
    
    // Add new estimate items
    for (const item of items) {
      await db.execute(`
        INSERT INTO estimate_items (
          estimate_id, product_id, description, quantity, unit_price, tax_rate, tax_amount, total_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        estimateId, item.product_id, item.description, item.quantity, item.unit_price,
        item.tax_rate, item.tax_amount, item.quantity * item.unit_price
      ]);
    }
    
    res.json({ message: 'Estimate updated successfully' });
  } catch (error) {
    console.error('Error updating estimate:', error);
    res.status(500).json({ error: 'Failed to update estimate' });
  }
});

// Delete estimate
// Delete individual estimate item
app.delete('/api/estimate-items/:companyId/:estimateId/:itemId', authenticateToken, async (req, res) => {
  try {
    const { companyId, estimateId, itemId } = req.params;

    // Check if estimate exists and belongs to the company
    const [estimate] = await db.execute(
      'SELECT id FROM estimates WHERE id = ? AND company_id = ?',
      [estimateId, companyId]
    );

    if (estimate.length === 0) {
      return res.status(404).json({ error: 'Estimate not found' });
    }

    // Check if the item exists
    const [item] = await db.execute(
      'SELECT id FROM estimate_items WHERE id = ? AND estimate_id = ?',
      [itemId, estimateId]
    );

    if (item.length === 0) {
      return res.status(404).json({ error: 'Estimate item not found' });
    }

    // Delete the estimate item
    await db.execute('DELETE FROM estimate_items WHERE id = ? AND estimate_id = ?', [itemId, estimateId]);

    res.json({ message: 'Estimate item deleted successfully' });
  } catch (error) {
    console.error('Error deleting estimate item:', error);
    res.status(500).json({ error: 'Failed to delete estimate item' });
  }
});

// Get estimate items
app.get('/api/estimates/:companyId/:estimateId/items', authenticateToken, async (req, res) => {
  try {
    const { companyId, estimateId } = req.params;
    const [items] = await db.execute(`
      SELECT ei.*, p.name as product_name
      FROM estimate_items ei
      LEFT JOIN products p ON ei.product_id = p.id
      WHERE ei.estimate_id = ?
    `, [estimateId]);
    
    res.json(items);
  } catch (error) {
    console.error('Error fetching estimate items:', error);
    res.status(500).json({ error: 'Failed to fetch estimate items' });
  }
});

// Convert estimate to invoice
app.post('/api/estimates/:companyId/:estimateId/convert', authenticateToken, async (req, res) => {
  try {
    const { companyId, estimateId } = req.params;
    
    // Check customer credit status
    const [estimate] = await db.execute(
      'SELECT customer_id FROM estimates WHERE id = ? AND company_id = ?',
      [estimateId, companyId]
    );
    
    if (estimate.length === 0) {
      return res.status(404).json({ error: 'Estimate not found' });
    }
    
    const isOnCreditHold = await checkCustomerCreditStatus(estimate[0].customer_id, companyId);
    if (isOnCreditHold) {
      return res.status(400).json({ 
        error: 'Customer has overdue invoices (60+ days). Cannot convert estimate to invoice.' 
      });
    }
    
    // Get estimate details
    const [estimateDetails] = await db.execute(`
      SELECT * FROM estimates WHERE id = ? AND company_id = ?
    `, [estimateId, companyId]);
    
    const [estimateItems] = await db.execute(`
      SELECT * FROM estimate_items WHERE estimate_id = ?
    `, [estimateId]);
    
    if (estimateDetails.length === 0) {
      return res.status(404).json({ error: 'Estimate not found' });
    }
    
    const est = estimateDetails[0];
    
    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`;
    
    // Create invoice
    const [invoiceResult] = await db.execute(`
      INSERT INTO invoices (
        company_id, invoice_number, customer_id, employee_id, estimate_id,
        invoice_date, due_date, subtotal, discount_type, discount_value, discount_amount,
        tax_amount, total_amount, balance_due, notes, terms
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      companyId, invoiceNumber, est.customer_id, est.employee_id, estimateId,
      new Date().toISOString().split('T')[0], est.expiry_date,
      est.subtotal, est.discount_type, est.discount_value, est.discount_amount,
      est.tax_amount, est.total_amount, est.total_amount, est.notes, est.terms
    ]);
    
    const invoiceId = invoiceResult.insertId;
    
    // Copy estimate items to invoice items
    for (const item of estimateItems) {
      await db.execute(`
        INSERT INTO invoice_items (
          invoice_id, product_id, description, quantity, unit_price, tax_rate, tax_amount, total_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        invoiceId, item.product_id, item.description, item.quantity, item.unit_price,
        item.tax_rate, item.tax_amount, item.total_price
      ]);
    }
    
    // Update estimate status
    await db.execute(
      'UPDATE estimates SET status = ?, converted_to_invoice_id = ? WHERE id = ?',
      ['converted', invoiceId, estimateId]
    );
    
    res.json({ invoiceId, message: 'Estimate converted to invoice successfully' });
  } catch (error) {
    console.error('Error converting estimate:', error);
    res.status(500).json({ error: 'Failed to convert estimate' });
  }
});

// Get customer estimates
app.get('/api/customers/:companyId/:customerId/estimates', authenticateToken, async (req, res) => {
  try {
    const { companyId, customerId } = req.params;
    const [estimates] = await db.execute(`
      SELECT * FROM estimates 
      WHERE company_id = ? AND customer_id = ? AND status NOT IN ('converted', 'declined')
      ORDER BY created_at DESC
    `, [companyId, customerId]);
    
    res.json(estimates);
  } catch (error) {
    console.error('Error fetching customer estimates:', error);
    res.status(500).json({ error: 'Failed to fetch customer estimates' });
  }
});

// Enhanced invoice routes
app.get('/api/invoices/:companyId', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { status, customer, dateFrom, dateTo, employee } = req.query;
    
    let query = `
      SELECT i.*, c.name as customer_name, emp.first_name, emp.last_name,
             CASE 
               WHEN i.balance_due = 0 THEN 'paid'
               WHEN i.paid_amount > 0 THEN 'partially_paid'
               WHEN i.due_date < CURDATE() AND i.balance_due > 0 THEN 'overdue'
               ELSE i.status
             END as computed_status
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN employees emp ON i.employee_id = emp.id
      WHERE i.company_id = ?
    `;
    
    const params = [companyId];
    
    if (status) {
      query += ' AND i.status = ?';
      params.push(status);
    }
    
    if (customer) {
      query += ' AND i.customer_id = ?';
      params.push(customer);
    }
    
    if (employee) {
      query += ' AND i.employee_id = ?';
      params.push(employee);
    }
    
    if (dateFrom) {
      query += ' AND i.invoice_date >= ?';
      params.push(dateFrom);
    }
    
    if (dateTo) {
      query += ' AND i.invoice_date <= ?';
      params.push(dateTo);
    }
    
    query += ' ORDER BY i.created_at DESC';
    
    const [invoices] = await db.execute(query, params);
    
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Add payment to invoice
app.post('/api/invoices/:companyId/:invoiceId/payments', authenticateToken, async (req, res) => {
  try {
    const { companyId, invoiceId } = req.params;
    const { amount, payment_method, reference_number, payment_date, notes } = req.body;
    
    // Get invoice details
    const [invoice] = await db.execute(
      'SELECT * FROM invoices WHERE id = ? AND company_id = ?',
      [invoiceId, companyId]
    );
    
    if (invoice.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    const inv = invoice[0];
    const newPaidAmount = parseFloat(inv.paid_amount) + parseFloat(amount);
    const newBalanceDue = parseFloat(inv.total_amount) - newPaidAmount;
    
    // Generate payment number
    const paymentNumber = `PAY-${Date.now()}`;
    
    // Create payment record
    await db.execute(`
      INSERT INTO payments (
        company_id, invoice_id, payment_number, payment_date, amount,
        payment_method, reference_number, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      companyId, invoiceId, paymentNumber, payment_date, amount,
      payment_method, reference_number, notes, req.user.userId
    ]);
    
    // Update invoice
    let newStatus = 'partially_paid';
    if (newBalanceDue <= 0) {
      newStatus = 'paid';
    }
    
    await db.execute(`
      UPDATE invoices 
      SET paid_amount = ?, balance_due = ?, status = ?
      WHERE id = ? AND company_id = ?
    `, [newPaidAmount, Math.max(0, newBalanceDue), newStatus, invoiceId, companyId]);
    
    // Update customer balance
    await db.execute(`
      UPDATE customers 
      SET balance = balance - ?
      WHERE id = ? AND company_id = ?
    `, [amount, inv.customer_id, companyId]);
    
    res.json({ message: 'Payment added successfully' });
  } catch (error) {
    console.error('Error adding payment:', error);
    res.status(500).json({ error: 'Failed to add payment' });
  }
});

// Get invoice payments
app.get('/api/invoices/:companyId/:invoiceId/payments', authenticateToken, async (req, res) => {
  try {
    const { companyId, invoiceId } = req.params;
    const [payments] = await db.execute(`
      SELECT p.*, u.first_name, u.last_name
      FROM payments p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.company_id = ? AND p.invoice_id = ?
      ORDER BY p.payment_date DESC
    `, [companyId, invoiceId]);
    
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Expenses routes
app.get('/api/expenses/:companyId', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    const [expenses] = await db.execute(`
      SELECT e.*, v.name as vendor_name, emp.first_name, emp.last_name, a.account_name
      FROM expenses e
      LEFT JOIN vendors v ON e.vendor_id = v.id
      LEFT JOIN employees emp ON e.employee_id = emp.id
      LEFT JOIN accounts a ON e.account_id = a.id
      WHERE e.company_id = ?
      ORDER BY e.created_at DESC
    `, [companyId]);
    
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

app.post('/api/expenses/:companyId', authenticateToken, upload.single('receipt'), async (req, res) => {
  try {
    const { companyId } = req.params;
    const {
      vendor_id,
      employee_id,
      account_id,
      expense_date,
      amount,
      tax_amount,
      payment_method,
      reference_number,
      description
    } = req.body;
    
    const receiptFile = req.file ? `/uploads/${req.file.filename}` : null;
    const totalAmount = parseFloat(amount) + parseFloat(tax_amount || 0);
    const expenseNumber = `EXP-${Date.now()}`;
    
    const [result] = await db.execute(`
      INSERT INTO expenses (
        company_id, expense_number, vendor_id, employee_id, account_id,
        expense_date, amount, tax_amount, total_amount, payment_method,
        reference_number, description, receipt_file, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      companyId, expenseNumber, vendor_id, employee_id, account_id,
      expense_date, amount, tax_amount, totalAmount, payment_method,
      reference_number, description, receiptFile, req.user.userId
    ]);
    
    res.json({ id: result.insertId, message: 'Expense created successfully' });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// Get tax rates for company
app.get('/api/tax-rates/:companyId', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    const [taxRates] = await db.execute(
      'SELECT * FROM tax_rates WHERE company_id = ? AND is_active = TRUE',
      [companyId]
    );
    res.json(taxRates);
  } catch (error) {
    console.error('Error fetching tax rates:', error);
    res.status(500).json({ error: 'Failed to fetch tax rates' });
  }
});

// Get accounts for company
app.get('/api/accounts/:companyId', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    const [accounts] = await db.execute(
      'SELECT * FROM accounts WHERE company_id = ? AND is_active = TRUE ORDER BY account_code',
      [companyId]
    );
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// Generic CRUD routes for different entities
const entities = ['customers', 'vendors', 'products', 'employees'];

entities.forEach(entity => {
  // GET all
  app.get(`/api/${entity}/:companyId`, authenticateToken, async (req, res) => {
    try {
      const { companyId } = req.params;
      const [rows] = await db.execute(`SELECT * FROM ${entity} WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
      res.json(rows);
    } catch (error) {
      console.error(`Error fetching ${entity}:`, error);
      res.status(500).json({ error: `Failed to fetch ${entity}` });
    }
  });
  
  // POST create
  app.post(`/api/${entity}/:companyId`, authenticateToken, async (req, res) => {
    try {
      const { companyId } = req.params;
      const data = { ...req.body, company_id: companyId };
      
      const columns = Object.keys(data).join(', ');
      const placeholders = Object.keys(data).map(() => '?').join(', ');
      const values = Object.values(data);
      
      const [result] = await db.execute(
        `INSERT INTO ${entity} (${columns}) VALUES (${placeholders})`,
        values
      );
      
      res.json({ id: result.insertId, message: `${entity.slice(0, -1)} created successfully` });
    } catch (error) {
      console.error(`Error creating ${entity.slice(0, -1)}:`, error);
      res.status(500).json({ error: `Failed to create ${entity.slice(0, -1)}` });
    }
  });
  
  // PUT update
  app.put(`/api/${entity}/:companyId/:id`, authenticateToken, async (req, res) => {
    try {
      const { companyId, id } = req.params;
      const data = req.body;
      
      const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(data), companyId, id];
      
      await db.execute(
        `UPDATE ${entity} SET ${setClause} WHERE company_id = ? AND id = ?`,
        values
      );
      
      res.json({ message: `${entity.slice(0, -1)} updated successfully` });
    } catch (error) {
      console.error(`Error updating ${entity.slice(0, -1)}:`, error);
      res.status(500).json({ error: `Failed to update ${entity.slice(0, -1)}` });
    }
  });
  
  // DELETE
  app.delete(`/api/${entity}/:companyId/:id`, authenticateToken, async (req, res) => {
    try {
      const { companyId, id } = req.params;
      
      await db.execute(
        `DELETE FROM ${entity} WHERE company_id = ? AND id = ?`,
        [companyId, id]
      );
      
      res.json({ message: `${entity.slice(0, -1)} deleted successfully` });
    } catch (error) {
      console.error(`Error deleting ${entity.slice(0, -1)}:`, error);
      res.status(500).json({ error: `Failed to delete ${entity.slice(0, -1)}` });
    }
  });
});

// Initialize database and start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});