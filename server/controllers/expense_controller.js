const db = require('../DB/db');

const createExpense = async (req, res) => {
  const { company_id, expense_number, category_id, payment_account_id, payment_date, payment_method, payee, notes, total_amount, items } = req.body;

  // Validate required fields
  if (!company_id || !expense_number || !category_id || !payment_date || !total_amount || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Company ID, expense number, category ID, payment date, total amount, and at least one item are required.' });
  }

  try {
    // Start a transaction
    await db.execute('START TRANSACTION');

    // Insert expense
    const expenseQuery = `
      INSERT INTO expenses (company_id, expense_number, category_id, payment_account_id, payment_date, payment_method, payee, notes, total_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [expenseResult] = await db.execute(expenseQuery, [
      company_id,
      expense_number.trim(),
      category_id,
      payment_account_id || null,
      payment_date,
      payment_method || null,
      payee || null,
      notes || null,
      total_amount
    ]);

    const expenseId = expenseResult.insertId;

    // Insert expense items
    const itemQuery = `
      INSERT INTO expense_items (expense_id, product_id, product_name, description, quantity, unit_price, total_price)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    for (const item of items) {
      if (!item.product_id || !item.quantity || !item.unit_price) {
        throw new Error('Each item must have a product ID, quantity, and unit price.');
      }
      await db.execute(itemQuery, [
        expenseId,
        item.product_id,
        item.product_name || null,
        item.description || null,
        item.quantity,
        item.unit_price,
        item.total_price || (item.quantity * item.unit_price)
      ]);
    }

    // Commit transaction
    await db.execute('COMMIT');

    res.status(201).json({
      message: 'Expense created successfully.',
      expenseId,
      expense_number: expense_number.trim(),
      total_amount
    });
  } catch (error) {
    await db.execute('ROLLBACK');
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense.' });
  }
};

const getExpenses = async (req, res) => {
  const { company_id } = req.params;

  if (!company_id) {
    return res.status(400).json({ error: 'Company ID is required.' });
  }

  try {
    const expenseQuery = `
      SELECT e.*, c.name as category_name, pa.name as payment_account_name
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN payment_accounts pa ON e.payment_account_id = pa.id
      WHERE e.company_id = ?
    `;
    const [expenses] = await db.execute(expenseQuery, [company_id]);

    const itemQuery = `
      SELECT ei.*
      FROM expense_items ei
      WHERE ei.expense_id = ?
    `;

    const expensesWithItems = await Promise.all(expenses.map(async (expense) => {
      const [items] = await db.execute(itemQuery, [expense.id]);
      return { ...expense, items };
    }));

    res.status(200).json(expensesWithItems);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses.' });
  }
};

const addPayee = async (req, res) => {
  const { name, company_id } = req.body;

  if (!name || name.trim() === '' || !company_id) {
    return res.status(400).json({ error: 'Payee name and company ID are required.' });
  }

  try {
    const query = 'INSERT INTO payees (name, company_id) VALUES (?, ?)';
    const [result] = await db.execute(query, [name.trim(), company_id]);

    res.status(201).json({
      message: 'Payee created successfully.',
      payeeId: result.insertId,
      name: name.trim()
    });
  } catch (error) {
    console.error('Error creating payee:', error);
    res.status(500).json({ error: 'Failed to create payee.' });
  }
};

const getPayees = async (req, res) => {
  const { company_id } = req.params;

  if (!company_id) {
    return res.status(400).json({ error: 'Company ID is required.' });
  }

  try {
    const query = 'SELECT * FROM payees WHERE company_id = ?';
    const [payees] = await db.execute(query, [company_id]);

    res.status(200).json(payees);
  } catch (error) {
    console.error('Error fetching payees:', error);
    res.status(500).json({ error: 'Failed to fetch payees.' });
  }
};

const addCategory = async (req, res) => {
  const { name, company_id } = req.body;

  if (!name || name.trim() === '' || !company_id) {
    return res.status(400).json({ error: 'Category name and company ID are required.' });
  }

  try {
    const query = 'INSERT INTO expense_categories (name, company_id) VALUES (?, ?)';
    const [result] = await db.execute(query, [name.trim(), company_id]);

    res.status(201).json({
      message: 'Category created successfully.',
      categoryId: result.insertId,
      name: name.trim()
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category.' });
  }
};

const getExpenseCategories = async (req, res) => {
  const { company_id } = req.params;

  if (!company_id) {
    return res.status(400).json({ error: 'Company ID is required.' });
  }

  try {
    const query = 'SELECT * FROM expense_categories WHERE company_id = ?';
    const [categories] = await db.execute(query, [company_id]);

    res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
};

const addPaymentAccount = async (req, res) => {
  const { name, company_id } = req.body;

  if (!name || name.trim() === '' || !company_id) {
    return res.status(400).json({ error: 'Payment account name and company ID are required.' });
  }

  try {
    const query = 'INSERT INTO payment_accounts (name, company_id) VALUES (?, ?)';
    const [result] = await db.execute(query, [name.trim(), company_id]);

    res.status(201).json({
      message: 'Payment account created successfully.',
      paymentAccountId: result.insertId,
      name: name.trim()
    });
  } catch (error) {
    console.error('Error creating payment account:', error);
    res.status(500).json({ error: 'Failed to create payment account.' });
  }
};

const getPaymentAccounts = async (req, res) => {
  const { company_id } = req.params;

  if (!company_id) {
    return res.status(400).json({ error: 'Company ID is required.' });
  }

  try {
    const query = 'SELECT * FROM payment_accounts WHERE company_id = ?';
    const [paymentAccounts] = await db.execute(query, [company_id]);

    res.status(200).json(paymentAccounts);
  } catch (error) {
    console.error('Error fetching payment accounts:', error);
    res.status(500).json({ error: 'Failed to fetch payment accounts.' });
  }
};

module.exports = {
  createExpense,
  getExpenses,
  addPayee,
  getPayees,
  addCategory,
  getExpenseCategories,
  addPaymentAccount,
  getPaymentAccounts
};