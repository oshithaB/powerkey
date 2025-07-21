const db = require("../DB/db");

const createEmployee = async (req, res) => {
    try {
        const { name, email, address, phone, hire_date } = req.body;

        console.log('Create employee request received:', req.body);

        // Validate required fields
        if (!name || name.trim() === '') {
            return res.status(400).json({ success: false, message: 'Name is required' });
        }
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email format' });
        }

        // Check if employee already exists by email (email is unique in the database)
        const [existingEmployee] = await db.query(
            'SELECT * FROM employees WHERE email = ? AND is_active = 1', 
            [email]
        );
        console.log('Existing employee check result:', existingEmployee);

        if (existingEmployee.length > 0) {
            return res.status(400).json({ success: false, message: 'Employee with this email already exists' });
        }

        // Insert new employee
        const [result] = await db.query(
            'INSERT INTO employees (name, email, address, phone, hire_date, is_active) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email || null, address || null, phone || null, hire_date || null, true]
        );
        console.log('New employee created:', result);

        const employeeData = {
            id: result.insertId,
            name,
            email: email || null,
            address: address || null,
            phone: phone || null,
            hire_date: hire_date || null,
            is_active: true,
            created_at: new Date()
        };

        return res.status(201).json({ 
            success: true, 
            message: 'Employee created successfully', 
            employee: employeeData
        });

    } catch (error) {
        console.error('Error creating employee:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getEmployees = async (req, res) => {
    try {
        console.log('Get employees request received');
        const [employees] = await db.query('SELECT * FROM employees WHERE is_active = 1 ORDER BY created_at DESC');
        
        console.log('Employees fetched:', employees);        
        return res.status(200).json(employees);
    } catch (error) {
        console.error('Error fetching employees:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, address, hire_date, is_active } = req.body;

        console.log('Update employee request received for id:', id, req.body);

        // Validate required fields
        if (!name || name.trim() === '') {
            return res.status(400).json({ success: false, message: 'Name is required' });
        }
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email format' });
        }

        // Check if employee exists
        const [existingEmployee] = await db.query(
            'SELECT * FROM employees WHERE id = ?', 
            [id]
        );

        if (existingEmployee.length === 0) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        // Check if email is already used by another employee
        if (email) {
            const [emailCheck] = await db.query(
                'SELECT * FROM employees WHERE email = ? AND id != ?', 
                [email, id]
            );
            if (emailCheck.length > 0) {
                return res.status(400).json({ success: false, message: 'Email already in use by another employee' });
            }
        }

        // Update employee
        await db.query(
            'UPDATE employees SET name = ?, email = ?, address = ?, phone = ?, hire_date = ?, is_active = ? WHERE id = ?',
            [name, email || null, address || null, phone || null, hire_date || null, is_active !== undefined ? is_active : existingEmployee[0].is_active, id]
        );

        const employeeData = {
            id: parseInt(id),
            name,
            email: email || null,
            address: address || null,
            phone: phone || null,
            hire_date: hire_date || null,
            is_active: is_active !== undefined ? is_active : existingEmployee[0].is_active,
            created_at: existingEmployee[0].created_at
        };

        console.log('Employee updated:', employeeData);
        return res.status(200).json({ 
            success: true, 
            message: 'Employee updated successfully',
            employee: employeeData
        });

    } catch (error) {
        console.error('Error updating employee:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Delete employee request received for id:', id);

        // Check if employee exists
        const [existingEmployee] = await db.query(
            'SELECT * FROM employees WHERE id = ?', 
            [id]
        );

        if (existingEmployee.length === 0) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        // Delete employee
        await db.query('DELETE FROM employees WHERE id = ?', [id]);
        console.log('Employee deleted:', id);

        return res.status(200).json({ 
            success: true, 
            message: 'Employee deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting employee:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = { 
    createEmployee,
    getEmployees,
    updateEmployee,
    deleteEmployee
};