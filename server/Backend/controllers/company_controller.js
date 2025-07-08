const db = require("../DB/db");
const jwt = require('jsonwebtoken');

const createCompany = async (req, res) => {
    try {
        const { companyName, isTaxable, taxNumber, companyAddress, companyPhone, companyRegistrationNumber, email, notes, termsAndConditions } = req.body;
        const companyLogo = req.file ? `/uploads/${req.file.filename}` : null; // Store relative path

        console.log('Create company request received:', req.body);
        console.log('File received:', req.file);

        // Check if company already exists
        const [existingCompany] = await db.query(
            'SELECT * FROM company WHERE registration_number = ?', 
            [companyRegistrationNumber]
        );
        console.log('Existing company check result:', existingCompany);

        if (existingCompany.length > 0) {
            return res.status(400).json({ success: false, message: 'Company with this registration number already exists.' });
        }

        // Insert new company
        const [result] = await db.query(
            'INSERT INTO company (name, is_taxable, tax_number, company_logo, address, contact_number, email_address, registration_number, terms_and_conditions, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [companyName, isTaxable === 'Taxable' ? 1 : 0, taxNumber, companyLogo, companyAddress, companyPhone, email, companyRegistrationNumber, termsAndConditions, notes]
        );

        if (result.affectedRows === 0) {
            return res.status(500).json({ success: false, message: 'Failed to create company' });
        }
        
        console.log('New company created:', result);

        // Generate new JWT token with company ID
        const token = jwt.sign(
            { userId: req.userId, role: req.role, companyId: result.insertId },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        console.log('New JWT token generated:', token);

        // Return company data along with token
        const companyData = {
            id: result.insertId,
            name: companyName,
            is_taxable: isTaxable === 'Taxable' ? 1 : 0,
            tax_number: taxNumber,
            logo: companyLogo,
            address: companyAddress,
            phone: companyPhone,
            email: email,
            registration_number: companyRegistrationNumber,
            terms_and_conditions: termsAndConditions,
            notes: notes
        };

        return res.status(201).json({ 
            success: true, 
            message: 'Company created successfully', 
            token,
            company: companyData
        });

    } catch (error) {
        console.error('Error creating company:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getCompanies = async (req, res) => {
    try {
        console.log('Get companies request received');
        const [companies] = await db.query('SELECT * FROM company');
        console.log('Companies fetched:', companies);        
        return res.status(200).json(companies);
    } catch (error) {
        console.error('Error fetching companies:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getDashboardData = async (req, res) => {
    try {
        const { companyId } = req.params;
        console.log('Get dashboard data for companyId:', companyId);

        // Get basic metrics
        const [customers] = await db.query('SELECT COUNT(*) as count FROM customers WHERE company_id = ?', [companyId]);
        const [products] = await db.query('SELECT COUNT(*) as count FROM products WHERE company_id = ?', [companyId]);
        const [invoices] = await db.query('SELECT COUNT(*) as count FROM invoices WHERE company_id = ?', [companyId]);
        const [revenue] = await db.query('SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices WHERE company_id = ? AND status != "cancelled"', [companyId]);

        // Get recent invoices
        const [recentInvoices] = await db.query(`
            SELECT 
                i.id,
                i.invoice_number,
                i.total_amount,
                i.created_at,
                c.name as customer_name
            FROM invoices i
            LEFT JOIN customers c ON i.customer_id = c.id
            WHERE i.company_id = ?
            ORDER BY i.created_at DESC
            LIMIT 5
        `, [companyId]);

        const dashboardData = {
            metrics: {
                customers: customers[0]?.count || 0,
                products: products[0]?.count || 0,
                invoices: invoices[0]?.count || 0,
                totalRevenue: revenue[0]?.total || 0
            },
            recentInvoices: recentInvoices || []
        };

        console.log('Dashboard data:', dashboardData);
        return res.status(200).json(dashboardData);

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Return empty data instead of error to prevent dashboard from breaking
        return res.status(200).json({
            metrics: {
                customers: 0,
                products: 0,
                invoices: 0,
                totalRevenue: 0
            },
            recentInvoices: []
        });
    }
};

const selectCompany = async (req, res) => {
    try {
        const { companyId } = req.params;
        console.log('Select company request received for companyId:', companyId);
        
        const [company] = await db.query(
            'SELECT * FROM company WHERE company_id = ?', 
            [companyId]
        );
        
        if (company.length === 0) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }
        
        const token = jwt.sign(
            { userId: req.userId, role: req.role, companyId: companyId },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        
        console.log('New JWT token generated for company selection:', token);
        return res.status(200).json({ success: true, message: 'Company selected successfully', token });
    } catch (error) {
        console.error('Error selecting company:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const updateCompany = async (req, res) => {
    try {
        const companyId = req.companyId;
        const updates = req.body;
        const companyLogo = req.file ? `/uploads/${req.file.filename}` : null;
        console.log('Update company request received for companyId:', companyId, 'with updates:', updates);

        if (Object.keys(updates).length === 0 && !companyLogo) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        const allowedFields = [
            'name', 'is_taxable', 'tax_number', 'company_logo', 
            'address', 'contact_number', 'email_address', 
            'registration_number', 'terms_and_conditions', 'notes'
        ];

        const fieldsToUpdate = {};
        for (const key of allowedFields) {
            if (updates[key]) {
                fieldsToUpdate[key] = updates[key];
            }
        }

        if (companyLogo) {
            fieldsToUpdate.company_logo = companyLogo;
        }

        console.log(fieldsToUpdate);

        const [existingCompanyData] = await db.query(
            'SELECT * FROM company WHERE company_id = ?',
            [companyId]
        );

        if (existingCompanyData.length === 0) {
            return res.status(404).json({ success: false, message: 'Company not found for update' });
        }

        if (fieldsToUpdate.name) {
            if (fieldsToUpdate.name === existingCompanyData[0].name) {
                delete fieldsToUpdate.name;
            }
        }

        if (fieldsToUpdate.is_taxable) {
            if (fieldsToUpdate.is_taxable === existingCompanyData[0].is_taxable) {
                delete fieldsToUpdate.is_taxable;
            } else {
                fieldsToUpdate.is_taxable = fieldsToUpdate.is_taxable === 'Taxable' ? 1 : 0;
            }
        }

        if (fieldsToUpdate.tax_number && fieldsToUpdate.is_taxable === 1 || fieldsToUpdate.tax_number && existingCompanyData[0].is_taxable === 1) {
            if (fieldsToUpdate.tax_number === existingCompanyData[0].tax_number) {
                delete fieldsToUpdate.tax_number;
            }
        } else {
            if (fieldsToUpdate.tax_number) {
                fieldsToUpdate.tax_number = null; // Set to null if not taxable
            }
        }

        if (fieldsToUpdate.address) {
            if (fieldsToUpdate.address === existingCompanyData[0].address) {
                delete fieldsToUpdate.address;
            }
        }

        if (fieldsToUpdate.contact_number) {
            if (fieldsToUpdate.contact_number === existingCompanyData[0].contact_number) {
                delete fieldsToUpdate.contact_number;
            }
        }

        if (fieldsToUpdate.email_address) {
            if (fieldsToUpdate.email_address === existingCompanyData[0].email_address) {
                delete fieldsToUpdate.email_address;
            }
        }

        if (fieldsToUpdate.registration_number) {
            if (fieldsToUpdate.registration_number === existingCompanyData[0].registration_number) {
                delete fieldsToUpdate.registration_number;
            }

            const [conflict] = await db.query(
                'SELECT * FROM company WHERE registration_number = ? AND company_id != ?',
                [fieldsToUpdate.registration_number, companyId]
            );

            if (conflict.length > 0) {
                return res.status(400).json({ success: false, message: 'Company with this registration number already exists' });
            }
        }

        const setClauses = [];
        const values = [];

        for (const key in fieldsToUpdate) {
            setClauses.push(`${key} = ?`);
            values.push(fieldsToUpdate[key]);
        }

        if (setClauses.length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields to update' });
        }

        values.push(companyId);

        const updateQuery = `UPDATE company SET ${setClauses.join(', ')} WHERE company_id = ?`;
        const [result] = await db.query(updateQuery, values);

        if (result.affectedRows === 0) {
            return res.status(400).json({ success: false, message: 'No changes made to the company' });
        }

        const updatedCompanyData = {
            id: companyId,
            ...fieldsToUpdate
        };

        return res.status(200).json({ success: true, message: 'Company updated successfully', updateCompany: updatedCompanyData });

    } catch (error) {
        console.error('Error updating company:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = { 
    createCompany, 
    selectCompany, 
    getCompanies, 
    getDashboardData,
    updateCompany
};