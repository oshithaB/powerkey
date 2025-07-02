const db = require("../DB/db");
const jwt = require('jsonwebtoken');

const createCompany = async (req, res) => {
    try {
        const { companyName, isTaxable, companyAddress, companyPhone, companyRegistrationNumber } = req.body;
        const companyLogo = req.file ? req.file.filename : null;

        console.log('Create company request received:', req.body);
        console.log('File received:', req.file);

        const [existingCompany] = await db.query(
            'SELECT * FROM company WHERE registration_number = ?', 
            [companyRegistrationNumber]
        );
        console.log('Existing company check result:', existingCompany);

        if (existingCompany.length > 0) {
            return res.status(400).json({ success: false, message: 'Company with this registration number already exists.' });
        }

        const [result] = await db.query(
            'INSERT INTO company (name, is_taxable, company_logo, address, contact_number, registration_number) VALUES (?, ?, ?, ?, ?, ?)',
            [companyName, isTaxable === 'Taxable' ? 1 : 0, companyLogo, companyAddress, companyPhone, companyRegistrationNumber]
        );
        console.log('New company created:', result);
        const token = jwt.sign(  //New JWT token generated after company creation with userId, role, and companyId
            { userId: req.userId, role: req.role, companyId: result.insertId },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        console.log('New JWT token generated:', token);
        return res.status(201).json({ success: true, message: 'Company created successfully', token });

    } catch (error) {
        console.error('Error creating company:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
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
        const token = jwt.sign( //New JWT token generated after company selection with userId, role, and companyId
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

module.exports = { createCompany, selectCompany };
