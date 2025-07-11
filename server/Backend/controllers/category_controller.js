const db = require("../DB/db");

const getCategories = async (req, res) => {
    try {
        const { company_id } = req.params;
        console.log('Get categories request received for company:', company_id);

        if (!company_id) {
            return res.status(400).json({ success: false, message: 'Company ID is required' });
        }

        const [categories] = await db.query(`
            SELECT 
                c.*,
                tr.name as tax_name,
                tr.rate as tax_rate,
                e.name as employee_name
            FROM categories c
            LEFT JOIN tax_rates tr ON c.tax_rate_id = tr.tax_rate_id
            LEFT JOIN employees e ON c.employee_id = e.id
            WHERE c.company_id = ?
            ORDER BY c.created_at DESC
        `, [company_id]);

        console.log('Categories fetched:', categories);

        return res.status(200).json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

const createCategory = async (req, res) => {
    try {
        const { company_id } = req.params;
        const { name, description, amount, tax_rate_id, employee_id } = req.body;
        
        console.log('Create category request received:', req.body);

        if (!company_id) {
            return res.status(400).json({ success: false, message: 'Company ID is required' });
        }

        if (!name || name.trim() === '') {
            return res.status(400).json({ success: false, message: 'Name is required' });
        }

        // Check if category with same name exists in this company
        const [existingCategory] = await db.query(
            'SELECT * FROM categories WHERE name = ? AND company_id = ?', 
            [name, company_id]
        );

        if (existingCategory.length > 0) {
            return res.status(400).json({ success: false, message: 'Category with this name already exists in this company' });
        }

        // Validate tax_rate_id if provided
        if (tax_rate_id) {
            const [taxRate] = await db.query(
                'SELECT * FROM tax_rates WHERE tax_rate_id = ? AND company_id = ?',
                [tax_rate_id, company_id]
            );
            if (taxRate.length === 0) {
                return res.status(400).json({ success: false, message: 'Invalid tax rate selected' });
            }
        }

        // Validate employee_id if provided
        if (employee_id) {
            const [employee] = await db.query(
                'SELECT * FROM employees WHERE id = ?',
                [employee_id]
            );
            if (employee.length === 0) {
                return res.status(400).json({ success: false, message: 'Invalid employee selected' });
            }
        }

        const [result] = await db.query(
            'INSERT INTO categories (name, description, amount, tax_rate_id, employee_id, company_id) VALUES (?, ?, ?, ?, ?, ?)',
            [
                name, 
                description || null, 
                amount || 0, 
                tax_rate_id || null, 
                employee_id || null, 
                company_id
            ]
        );

        console.log('New category created:', result);

        // Fetch the created category with joined data
        const [newCategory] = await db.query(`
            SELECT 
                c.*,
                tr.name as tax_name,
                tr.rate as tax_rate,
                e.name as employee_name
            FROM categories c
            LEFT JOIN tax_rates tr ON c.tax_rate_id = tr.tax_rate_id
            LEFT JOIN employees e ON c.employee_id = e.id
            WHERE c.id = ?
        `, [result.insertId]);

        return res.status(201).json({ 
            success: true, 
            message: 'Category created successfully', 
            category: newCategory[0]
        });
    } catch (error) {
        console.error('Error creating category:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

const updateCategory = async (req, res) => {
    try {
        const { company_id, id } = req.params;
        const { name, description, amount, tax_rate_id, employee_id } = req.body;
        
        console.log('Update category request received:', req.body);

        if (!company_id || !id) {
            return res.status(400).json({ success: false, message: 'Company ID and Category ID are required' });
        }

        if (!name || name.trim() === '') {
            return res.status(400).json({ success: false, message: 'Name is required' });
        }

        // Check if category exists
        const [existingCategory] = await db.query(
            'SELECT * FROM categories WHERE id = ? AND company_id = ?', 
            [id, company_id]
        );

        if (existingCategory.length === 0) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        // Check for name conflicts (excluding current category)
        const [nameConflict] = await db.query(
            'SELECT * FROM categories WHERE name = ? AND company_id = ? AND id != ?', 
            [name, company_id, id]
        );

        if (nameConflict.length > 0) {
            return res.status(400).json({ success: false, message: 'Category with this name already exists in this company' });
        }

        // Validate tax_rate_id if provided
        if (tax_rate_id) {
            const [taxRate] = await db.query(
                'SELECT * FROM tax_rates WHERE tax_rate_id = ? AND company_id = ?',
                [tax_rate_id, company_id]
            );
            if (taxRate.length === 0) {
                return res.status(400).json({ success: false, message: 'Invalid tax rate selected' });
            }
        }

        // Validate employee_id if provided
        if (employee_id) {
            const [employee] = await db.query(
                'SELECT * FROM employees WHERE id = ?',
                [employee_id]
            );
            if (employee.length === 0) {
                return res.status(400).json({ success: false, message: 'Invalid employee selected' });
            }
        }

        const [result] = await db.query(
            'UPDATE categories SET name = ?, description = ?, amount = ?, tax_rate_id = ?, employee_id = ? WHERE id = ? AND company_id = ?',
            [
                name, 
                description || null, 
                amount || 0, 
                tax_rate_id || null, 
                employee_id || null, 
                id, 
                company_id
            ]
        );

        console.log('Category updated:', result);

        // Fetch the updated category with joined data
        const [updatedCategory] = await db.query(`
            SELECT 
                c.*,
                tr.name as tax_name,
                tr.rate as tax_rate,
                e.name as employee_name
            FROM categories c
            LEFT JOIN tax_rates tr ON c.tax_rate_id = tr.tax_rate_id
            LEFT JOIN employees e ON c.employee_id = e.id
            WHERE c.id = ? AND c.company_id = ?
        `, [id, company_id]);

        return res.status(200).json({ 
            success: true, 
            message: 'Category updated successfully', 
            category: updatedCategory[0]
        });
    } catch (error) {
        console.error('Error updating category:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

const deleteCategory = async(req, res) => {
    try {
        const { company_id, id } = req.params;
        
        console.log('Delete category request received for ID:', id, 'Company:', company_id);

        if (!company_id || !id) {
            return res.status(400).json({ success: false, message: 'Company ID and Category ID are required' });
        }

        const [existingCategory] = await db.query(
            'SELECT * FROM categories WHERE id = ? AND company_id = ?', 
            [id, company_id]
        );

        if (existingCategory.length === 0) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        await db.query('DELETE FROM categories WHERE id = ? AND company_id = ?', [id, company_id]);
        console.log('Category deleted successfully');

        return res.status(200).json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

// Get tax rates for a company
const getTaxRates = async (req, res) => {
    try {
        const { company_id } = req.params;
        
        if (!company_id) {
            return res.status(400).json({ success: false, message: 'Company ID is required' });
        }

        const [taxRates] = await db.query(
            'SELECT tax_rate_id, name, rate FROM tax_rates WHERE company_id = ? ORDER BY name',
            [company_id]
        );

        return res.status(200).json(taxRates);
    } catch (error) {
        console.error('Error fetching tax rates:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

// Get employees
const getEmployees = async (req, res) => {
    try {
        const [employees] = await db.query(
            'SELECT id, name FROM employees WHERE is_active = 1 ORDER BY name'
        );

        return res.status(200).json(employees);
    } catch (error) {
        console.error('Error fetching employees:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

module.exports = {
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory,
    getTaxRates,
    getEmployees
};