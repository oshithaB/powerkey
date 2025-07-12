const db = require("../DB/db");

const getProducts = async (req, res) => {
    try {
        const { company_id } = req.params;
        
        if (!company_id) {
            return res.status(400).json({ success: false, message: 'Company ID is required' });
        }

        const [products] = await db.query(
            'SELECT * FROM products WHERE company_id = ? ORDER BY created_at DESC',
            [company_id]
        );

        return res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const createProduct = async (req, res) => {
    try {
        const { company_id } = req.params;
        const {
            sku,
            name,
            image, // New field
            description,
            category_id, // Changed from category
            preferred_vendor_id, // New field
            added_employee_id, // New field
            unit_price,
            cost_price,
            quantity_on_hand,
            reorder_level
        } = req.body;

        if (!company_id) {
            return res.status(400).json({ success: false, message: 'Company ID is required' });
        }

        if (!name || name.trim() === '') {
            return res.status(400).json({ success: false, message: 'Product name is required' });
        }

        // Check if product with same SKU exists for this company
        if (sku) {
            const [existingProduct] = await db.query(
                'SELECT * FROM products WHERE company_id = ? AND sku = ?',
                [company_id, sku]
            );

            if (existingProduct.length > 0) {
                return res.status(400).json({ success: false, message: 'Product with this SKU already exists' });
            }
        }

        // Validate category_id, preferred_vendor_id, and added_employee_id if provided
        if (category_id) {
            const [category] = await db.query('SELECT id FROM categories WHERE id = ? AND company_id = ?', [category_id, company_id]);
            if (category.length === 0) {
                return res.status(400).json({ success: false, message: 'Invalid category ID' });
            }
        }

        if (preferred_vendor_id) {
            const [vendor] = await db.query('SELECT vendor_id FROM vendor WHERE vendor_id = ? AND company_id = ?', [preferred_vendor_id, company_id]);
            if (vendor.length === 0) {
                return res.status(400).json({ success: false, message: 'Invalid vendor ID' });
            }
        }

        if (added_employee_id) {
            const [employee] = await db.query('SELECT id FROM employees WHERE id = ?', [added_employee_id]);
            if (employee.length === 0) {
                return res.status(400).json({ success: false, message: 'Invalid employee ID' });
            }
        }

        // Generate SKU if not provided
        let productSku = sku;
        if (!productSku) {
            const [lastProduct] = await db.query(
                'SELECT sku FROM products WHERE company_id = ? AND sku IS NOT NULL ORDER BY id DESC LIMIT 1',
                [company_id]
            );

            let skuNumber = 1;
            if (lastProduct.length > 0 && lastProduct[0].sku) {
                const lastSku = lastProduct[0].sku;
                const lastNumber = parseInt(lastSku.replace('PRD', ''));
                if (!isNaN(lastNumber)) {
                    skuNumber = lastNumber + 1;
                }
            }
            productSku = `PRD${String(skuNumber).padStart(3, '0')}`;
        }

        const [result] = await db.query(
            `INSERT INTO products (
                company_id, sku, name, image, description, category_id, 
                preferred_vendor_id, added_employee_id, unit_price, cost_price, 
                quantity_on_hand, reorder_level, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                company_id, productSku, name, image || null, description || null, category_id || null,
                preferred_vendor_id || null, added_employee_id || null, unit_price || 0, cost_price || 0,
                quantity_on_hand || 0, reorder_level || 0, true
            ]
        );

        const productData = {
            id: result.insertId,
            company_id: parseInt(company_id),
            sku: productSku,
            name,
            image: image || null,
            description: description || null,
            category_id: category_id || null,
            preferred_vendor_id: preferred_vendor_id || null,
            added_employee_id: added_employee_id || null,
            unit_price: unit_price || 0,
            cost_price: cost_price || 0,
            quantity_on_hand: quantity_on_hand || 0,
            reorder_level: reorder_level || 0,
            is_active: true,
            created_at: new Date()
        };

        return res.status(201).json({
            success: true,
            message: 'Product created successfully',
            product: productData
        });

    } catch (error) {
        console.error('Error creating product:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { company_id, product_id } = req.params;
        const {
            sku,
            name,
            image,
            description,
            category_id,
            preferred_vendor_id,
            added_employee_id,
            unit_price,
            cost_price,
            quantity_on_hand,
            reorder_level,
            is_active
        } = req.body;

        if (!company_id || !product_id) {
            return res.status(400).json({ success: false, message: 'Company ID and Product ID are required' });
        }

        // Check if product exists
        const [existingProduct] = await db.query(
            'SELECT * FROM products WHERE id = ? AND company_id = ?',
            [product_id, company_id]
        );

        if (existingProduct.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Check for SKU conflicts
        if (sku) {
            const [skuConflict] = await db.query(
                'SELECT * FROM products WHERE company_id = ? AND sku = ? AND id != ?',
                [company_id, sku, product_id]
            );

            if (skuConflict.length > 0) {
                return res.status(400).json({ success: false, message: 'SKU already in use by another product' });
            }
        }

        // Validate category_id, preferred_vendor_id, and added_employee_id if provided
        if (category_id) {
            const [category] = await db.query('SELECT id FROM categories WHERE id = ? AND company_id = ?', [category_id, company_id]);
            if (category.length === 0) {
                return res.status(400).json({ success: false, message: 'Invalid category ID' });
            }
        }

        if (preferred_vendor_id) {
            const [vendor] = await db.query('SELECT vendor_id FROM vendor WHERE vendor_id = ? AND company_id = ?', [preferred_vendor_id, company_id]);
            if (vendor.length === 0) {
                return res.status(400).json({ success: false, message: 'Invalid vendor ID' });
            }
        }

        if (added_employee_id) {
            const [employee] = await db.query('SELECT id FROM employees WHERE id = ?', [added_employee_id]);
            if (employee.length === 0) {
                return res.status(400).json({ success: false, message: 'Invalid employee ID' });
            }
        }

        const allowedFields = [
            'sku', 'name', 'image', 'description', 'category_id', 
            'preferred_vendor_id', 'added_employee_id', 'unit_price', 
            'cost_price', 'quantity_on_hand', 'reorder_level', 'is_active'
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

        const setClauses = [];
        const values = [];

        for (const key in fieldsToUpdate) {
            setClauses.push(`${key} = ?`);
            values.push(fieldsToUpdate[key]);
        }

        values.push(product_id, company_id);

        const updateQuery = `UPDATE products SET ${setClauses.join(', ')} WHERE id = ? AND company_id = ?`;
        const [result] = await db.query(updateQuery, values);

        if (result.affectedRows === 0) {
            return res.status(400).json({ success: false, message: 'No changes made to the product' });
        }

        return res.status(200).json({
            success: true,
            message: 'Product updated successfully'
        });

    } catch (error) {
        console.error('Error updating product:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { company_id, product_id } = req.params;

        if (!company_id || !product_id) {
            return res.status(400).json({ success: false, message: 'Company ID and Product ID are required' });
        }

        // Check if product exists
        const [existingProduct] = await db.query(
            'SELECT * FROM products WHERE id = ? AND company_id = ?',
            [product_id, company_id]
        );

        if (existingProduct.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Check if product is used in any invoice or estimate items
        const [invoiceItemCount] = await db.query(
            'SELECT COUNT(*) as count FROM invoice_items WHERE product_id = ?',
            [product_id]
        );

        const [estimateItemCount] = await db.query(
            'SELECT COUNT(*) as count FROM estimate_items WHERE product_id = ?',
            [product_id]
        );

        if (invoiceItemCount[0]?.count > 0 || estimateItemCount[0]?.count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete product that is used in invoices or estimates'
            });
        }

        const [result] = await db.query(
            'DELETE FROM products WHERE id = ? AND company_id = ?',
            [product_id, company_id]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({ success: false, message: 'Failed to delete product' });
        }

        return res.status(200).json({
            success: true,
            message: 'Product deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting product:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getCategories = async (req, res) => {
    try {
        const { company_id } = req.params;
        if (!company_id) {
            return res.status(400).json({ success: false, message: 'Company ID is required' });
        }

        const [categories] = await db.query(
            'SELECT id, name FROM categories WHERE company_id = ? ORDER BY name ASC',
            [company_id]
        );

        return res.status(200).json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getVendors = async (req, res) => {
    try {
        const { company_id } = req.params;
        if (!company_id) {
            return res.status(400).json({ success: false, message: 'Company ID is required' });
        }

        const [vendors] = await db.query(
            'SELECT vendor_id, name FROM vendor WHERE company_id = ? AND is_active = 1 ORDER BY name ASC',
            [company_id]
        );

        return res.status(200).json(vendors);
    } catch (error) {
        console.error('Error fetching vendors:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getEmployees = async (req, res) => {
    try {
        const [employees] = await db.query(
            'SELECT id, name FROM employees WHERE is_active = 1 ORDER BY name ASC'
        );

        return res.status(200).json(employees);
    } catch (error) {
        console.error('Error fetching employees:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getCategories,
    getVendors,
    getEmployees
};