const db = require('../DB/db'); // Assuming db is the MySQL connection/pool

// Fetch all orders for a company
const getOrders = async (req, res) => {
    const { companyId } = req.params;
    try {
        const [orders] = await db.execute(
            `SELECT o.id, v.name AS supplier, o.order_no, o.order_date, c.name AS category, o.class, o.location, o.total_amount, o.status, o.created_at, o.mailling_address, o.email, o.customer_id, o.shipping_address, o.ship_via
             FROM orders o
             LEFT JOIN vendor v ON o.vendor_id = v.vendor_id
             LEFT JOIN categories c ON o.category_id = c.id
             WHERE o.company_id = ?`,
            [companyId]
        );
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Failed to fetch orders' });
    }
};

// Fetch all order items for a company
const getOrderItems = async (req, res) => {
    const { companyId } = req.params;
    try {
        const [orderItems] = await db.execute(
            `SELECT oi.id, oi.order_id, oi.product_id, oi.name, oi.sku, oi.description, oi.qty, oi.rate, oi.amount, oi.class, oi.received, oi.closed, oi.created_at
             FROM order_items oi
             JOIN orders o ON oi.order_id = o.id
             WHERE o.company_id = ?`,
            [companyId]
        );
        res.json(orderItems);
    } catch (error) {
        console.error('Error fetching order items:', error);
        res.status(500).json({ message: 'Failed to fetch order items' });
    }
};

// Get order count for a company
const getOrderCount = async (req, res) => {
    const { companyId } = req.params;
    try {
        const [result] = await db.execute(
            'SELECT COUNT(*) as count FROM orders WHERE company_id = ?',
            [companyId]
        );
        res.json({ count: result[0].count });
    } catch (error) {
        console.error('Error fetching order count:', error);
        res.status(500).json({ message: 'Failed to fetch order count' });
    }
};

// Create a new order
const createOrder = async (req, res) => {
    const { companyId } = req.params;
    const {
        vendor_id, mailling_address, email, customer_id, shipping_address, order_no, order_date,
        category_id, class: orderClass, location, ship_via, total_amount, status
    } = req.body;

    try {
        const [result] = await db.execute(
            `INSERT INTO orders (
                company_id, vendor_id, mailling_address, email, customer_id, shipping_address,
                order_no, order_date, category_id, class, location, ship_via, total_amount, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                companyId,
                vendor_id || null,
                mailling_address || null,
                email || null,
                customer_id || null,
                shipping_address || null,
                order_no,
                order_date,
                category_id || null,
                orderClass || null,
                location || null,
                ship_via || null,
                total_amount || 0,
                status || 'open'
            ]
        );
        res.json({ id: result.insertId, message: 'Order created successfully' });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Failed to create order' });
    }
};

// Create a new order item
const createOrderItem = async (req, res) => {
    const { companyId } = req.params;
    const { order_id, product_id, name, sku, description, qty, rate, amount, class: itemClass, received, closed } = req.body;

    try {
        // Verify the order belongs to the company
        const [order] = await db.execute(
            'SELECT id FROM orders WHERE id = ? AND company_id = ?',
            [order_id, companyId]
        );
        if (order.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const [result] = await db.execute(
            `INSERT INTO order_items (
                order_id, product_id, name, sku, description, qty, rate, amount, class, received, closed
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                order_id,
                product_id || null,
                name,
                sku || null,
                description || null,
                qty,
                rate,
                amount || 0,
                itemClass || null,
                received || false,
                closed || false
            ]
        );
        res.json({ id: result.insertId, message: 'Order item created successfully' });
    } catch (error) {
        console.error('Error creating order item:', error);
        res.status(500).json({ message: 'Failed to create order item' });
    }
};

// Delete an order
const deleteOrder = async (req, res) => {
    const { companyId, orderId } = req.params;
    try {
        // Verify the order belongs to the company
        const [order] = await db.execute(
            'SELECT id FROM orders WHERE id = ? AND company_id = ?',
            [orderId, companyId]
        );
        if (order.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Delete the order (order_items will be deleted automatically due to ON DELETE CASCADE)
        await db.execute('DELETE FROM orders WHERE id = ?', [orderId]);
        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ message: 'Failed to delete order' });
    }
};

module.exports = {
    getOrders,
    getOrderItems,
    getOrderCount,
    createOrder,
    createOrderItem,
    deleteOrder,
};