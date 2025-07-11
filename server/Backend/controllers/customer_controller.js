const db = require("../DB/db");

const getCustomers = async (req, res) => {
    try {
        const { company_id } = req.params;
        
        if (!company_id) {
            return res.status(400).json({ success: false, message: 'Company ID is required' });
        }

        const [customers] = await db.query(
            'SELECT * FROM customer WHERE company_id = ? ORDER BY created_at DESC',
            [company_id]
        );

        return res.status(200).json(customers);
    } catch (error) {
        console.error('Error fetching customers:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const createCustomer = async (req, res) => {
    try {
        const { company_id } = req.params;
        const {
            name,
            email,
            is_taxable,
            tax_number,
            phone,
            vehicle_number,
            credit_limit,
            current_balance,
            billing_address,
            billing_city,
            billing_province,
            billing_postal_code,
            billing_country,
            shipping_same_as_billing,
            shipping_address,
            shipping_city,
            shipping_province,
            shipping_postal_code,
            shipping_country,
            primary_payment_method,
            terms,
            delivery_option,
            invoice_language,
            sales_tax_registration,
            opening_balance,
            as_of_date
        } = req.body;

        if (!company_id) {
            return res.status(400).json({ success: false, message: 'Company ID is required' });
        }

        if (!name || name.trim() === '') {
            return res.status(400).json({ success: false, message: 'Customer name is required' });
        }

        if (email) {
            const [existingCustomer] = await db.query(
                'SELECT * FROM customer WHERE company_id = ? AND email = ?',
                [company_id, email]
            );

            if (existingCustomer.length > 0) {
                return res.status(400).json({ success: false, message: 'Customer with this email already exists' });
            }
        }

        // const [lastCustomer] = await db.query(
        //     'SELECT id FROM customer WHERE company_id = ? ORDER BY id DESC LIMIT 1',
        //     [company_id]
        // );

        // let customerCode = 'CUST001';
        // if (lastCustomer.length > 0 && lastCustomer[0].id) {
        //     const lastCode = lastCustomer[0].id;
        //     const lastNumber = parseInt(lastCode.replace('CUST', ''));
        //     customerCode = `CUST${String(lastNumber + 1).padStart(3, '0')}`;
        // }

        const [result] = await db.query(
            `INSERT INTO customer (
                company_id, name, email, is_taxable, tax_number, phone, 
                vehicle_number, credit_limit, current_balance, billing_address, billing_city, 
                billing_province, billing_postal_code, billing_country, shipping_same_as_billing,
                shipping_address, shipping_city, shipping_province, shipping_postal_code,
                shipping_country, primary_payment_method, terms, delivery_option,
                invoice_language, sales_tax_registration, opening_balance, as_of_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                company_id,
                name,
                email || null,
                is_taxable || false,
                tax_number || null,
                phone || null,
                vehicle_number || null,
                credit_limit || 0,
                current_balance || 0,
                billing_address || null,
                billing_city || null,
                billing_province || null,
                billing_postal_code || null,
                billing_country || null,
                shipping_same_as_billing || true,
                shipping_same_as_billing ? billing_address : shipping_address || null,
                shipping_same_as_billing ? billing_city : shipping_city || null,
                shipping_same_as_billing ? billing_province : shipping_province || null,
                shipping_same_as_billing ? billing_postal_code : shipping_postal_code || null,
                shipping_same_as_billing ? billing_country : shipping_country || null,
                primary_payment_method || null,
                terms || null,
                delivery_option || null,
                invoice_language || null,
                sales_tax_registration || null,
                opening_balance || 0,
                as_of_date || null
            ]
        );

        const customerData = {
            id: result.insertId,
            company_id: parseInt(company_id),
            name,
            email: email || null,
            is_taxable: is_taxable || false,
            tax_number: tax_number || null,
            phone: phone || null,
            vehicle_number: vehicle_number || null,
            credit_limit: credit_limit || 0,
            current_balance: current_balance || 0,
            billing_address: billing_address || null,
            billing_city: billing_city || null,
            billing_province: billing_province || null,
            billing_postal_code: billing_postal_code || null,
            billing_country: billing_country || null,
            shipping_same_as_billing: shipping_same_as_billing || true,
            shipping_address: shipping_same_as_billing ? billing_address : shipping_address || null,
            shipping_city: shipping_same_as_billing ? billing_city : shipping_city || null,
            shipping_province: shipping_same_as_billing ? billing_province : shipping_province || null,
            shipping_postal_code: shipping_same_as_billing ? billing_postal_code : shipping_postal_code || null,
            shipping_country: shipping_same_as_billing ? billing_country : shipping_country || null,
            primary_payment_method: primary_payment_method || null,
            terms: terms || null,
            delivery_option: delivery_option || null,
            invoice_language: invoice_language || null,
            sales_tax_registration: sales_tax_registration || null,
            opening_balance: opening_balance || 0,
            as_of_date: as_of_date || null,
            created_at: new Date()
        };

        return res.status(201).json({
            success: true,
            message: 'Customer created successfully',
            customer: customerData
        });

    } catch (error) {
        console.error('Error creating customer:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const updateCustomer = async (req, res) => {
    try {
        const { company_id, customer_id } = req.params;
        const {
            name,
            email,
            is_taxable,
            tax_number,
            phone,
            vehicle_number,
            credit_limit,
            current_balance,
            billing_address,
            billing_city,
            billing_province,
            billing_postal_code,
            billing_country,
            shipping_same_as_billing,
            shipping_address,
            shipping_city,
            shipping_province,
            shipping_postal_code,
            shipping_country,
            primary_payment_method,
            terms,
            delivery_option,
            invoice_language,
            sales_tax_registration,
            opening_balance,
            as_of_date
        } = req.body;

        if (!company_id || !customer_id) {
            return res.status(400).json({ success: false, message: 'Company ID and Customer ID are required' });
        }

        const [existingCustomer] = await db.query(
            'SELECT * FROM customer WHERE id = ? AND company_id = ?',
            [customer_id, company_id]
        );

        if (existingCustomer.length === 0) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        if (email) {
            const [emailConflict] = await db.query(
                'SELECT * FROM customer WHERE company_id = ? AND email = ? AND id != ?',
                [company_id, email, customer_id]
            );

            if (emailConflict.length > 0) {
                return res.status(400).json({ success: false, message: 'Email already in use by another customer' });
            }
        }

        const allowedFields = [
            'name',
            'email',
            'is_taxable',
            'tax_number',
            'phone',
            'vehicle_number',
            'credit_limit',
            'current_balance',
            'billing_address',
            'billing_city',
            'billing_province',
            'billing_postal_code',
            'billing_country',
            'shipping_same_as_billing',
            'shipping_address',
            'shipping_city',
            'shipping_province',
            'shipping_postal_code',
            'shipping_country',
            'primary_payment_method',
            'terms',
            'delivery_option',
            'invoice_language',
            'sales_tax_registration',
            'opening_balance',
            'as_of_date'
        ];

        const fieldsToUpdate = {};
        for (const key of allowedFields) {
            if (req.body[key] !== undefined) {
                fieldsToUpdate[key] = req.body[key];
            }
        }

        if (Object.keys(fieldsToUpdate).length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields to update' });
        }

        if (fieldsToUpdate.shipping_same_as_billing) {
            fieldsToUpdate.shipping_address = fieldsToUpdate.billing_address;
            fieldsToUpdate.shipping_city = fieldsToUpdate.billing_city;
            fieldsToUpdate.shipping_province = fieldsToUpdate.billing_province;
            fieldsToUpdate.shipping_postal_code = fieldsToUpdate.billing_postal_code;
            fieldsToUpdate.shipping_country = fieldsToUpdate.billing_country;
        }

        const setClauses = [];
        const values = [];

        for (const key in fieldsToUpdate) {
            setClauses.push(`${key} = ?`);
            values.push(fieldsToUpdate[key]);
        }

        values.push(customer_id, company_id);

        const updateQuery = `UPDATE customer SET ${setClauses.join(', ')} WHERE id = ? AND company_id = ?`;
        const [result] = await db.query(updateQuery, values);

        if (result.affectedRows === 0) {
            return res.status(400).json({ success: false, message: 'No changes made to the customer' });
        }

        return res.status(200).json({
            success: true,
            message: 'Customer updated successfully'
        });

    } catch (error) {
        console.error('Error updating customer:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const deleteCustomer = async (req, res) => {
    try {
        const { company_id, customer_id } = req.params;

        if (!company_id || !customer_id) {
            return res.status(400).json({ success: false, message: 'Company ID and Customer ID are required' });
        }

        const [existingCustomer] = await db.query(
            'SELECT * FROM customer WHERE id = ? AND company_id = ?',
            [customer_id, company_id]
        );

        if (existingCustomer.length === 0) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        const [invoiceCount] = await db.query(
            'SELECT COUNT(*) as count FROM invoices WHERE customer_id = ?',
            [customer_id]
        );

        const [estimateCount] = await db.query(
            'SELECT COUNT(*) as count FROM estimates WHERE customer_id = ?',
            [customer_id]
        );

        if (invoiceCount[0]?.count > 0 || estimateCount[0]?.count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete customer with existing invoices or estimates'
            });
        }

        const [result] = await db.query(
            'DELETE FROM customer WHERE id = ? AND company_id = ?',
            [customer_id, company_id]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({ success: false, message: 'Failed to delete customer' });
        }

        return res.status(200).json({
            success: true,
            message: 'Customer deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting customer:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    getCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer
};