const db = require("../DB/db");
const jwt = require('jsonwebtoken');

const createCompany = async (req, res) => {
    try {
        const { companyName, isTaxable, taxNumber, companyAddress, companyPhone, companyRegistrationNumber, privacyPolicy } = req.body;
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
            'INSERT INTO company (name, is_taxable, tax_number, company_logo, address, contact_number, registration_number, privacy_policy) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [companyName, isTaxable === 'Taxable' ? 1 : 0, taxNumber, companyLogo, companyAddress, companyPhone, companyRegistrationNumber, privacyPolicy]
        );
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
            address: companyAddress,
            phone: companyPhone,
            email: null,
            logo: companyLogo,
            role: 'owner'
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
        return res.status(200).json({ success: true, companies });
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

module.exports = { 
    createCompany, 
    selectCompany, 
    getCompanies, 
    getDashboardData 
};