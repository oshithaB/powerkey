const db = require('../../../DB/db');

const getSupplierBalanceSummary = async (req, res) => {
    try {
        const { company_id } = req.params;
        const { start_date, end_date } = req.query;

        console.log('Received params:', { company_id, start_date, end_date });

        let query = `
            SELECT
                v.vendor_id,
                v.name AS customer_name,
                v.email,
                v.phone,
                v.balance AS total_balance_due
            FROM vendor v
            LEFT JOIN orders o ON v.vendor_id = o.vendor_id
            WHERE v.company_id = ?
            AND v.is_active = 1
        `;

        const queryParams = [company_id];

        if (start_date && end_date) {
            query += ` AND DATE(o.order_date) BETWEEN DATE(?) AND DATE(?)`;
            queryParams.push(start_date, end_date);
            console.log('Date filter applied:', { start_date, end_date });
        }

        query += ` GROUP BY v.vendor_id, v.name, v.email, v.phone`;
        query += ` ORDER BY total_balance_due DESC`;

        console.log('Final query:', query);
        console.log('Query params:', queryParams);

        const [results] = await db.execute(query, queryParams);

        console.log(`Found ${results.length} records`);
        if (results.length > 0 && start_date && end_date) {
            console.log('Date range in results:', {
                earliest: start_date,
                latest: end_date
            });
        }

        res.json({
            success: true,
            data: results,
            total_records: results.length,
            filter_applied: { start_date, end_date }
        });
    } catch (error) {
        console.error('Error fetching vendor balance summary report:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getSupplierBalanceDetail = async (req, res) => {
    try {
        const { company_id, vendor_id } = req.params;
        const { start_date, end_date } = req.query;

        let query = `
            SELECT
                o.id,
                v.vendor_id,
                v.name AS vendor_name,
                v.email AS vendor_email,
                v.phone AS vendor_phone,
                o.order_no,
                o.order_date,
                o.status,
                oi.name AS product_name,
                oi.sku AS product_sku,
                oi.qty AS quantity,
                oi.rate AS unit_cost_price,
                (oi.qty * oi.rate) AS total_cost_price
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN vendor v ON o.vendor_id = v.vendor_id
            WHERE o.company_id = ?
            AND o.vendor_id = ?
        `;

        const queryParams = [company_id, vendor_id];

        if (start_date && end_date) {
            query += ` AND DATE(o.order_date) BETWEEN DATE(?) AND DATE(?)`;
            queryParams.push(start_date, end_date);
        }

        query += ` ORDER BY o.order_date DESC`;

        const [results] = await db.execute(query, queryParams);

        res.json({
            success: true,
            data: results,
            total_records: results.length,
            filter_applied: { start_date, end_date }
        });
    } catch (error) {
        console.error('Error fetching vendor balance detail report:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getAPAgingSummary = async(req, res) => {
    // try {
    //     const { company_id } = req.params;
    //     const { start_date, end_date } = req.query;

    //     let currentDate = end_date ? new Date(end_date) : new Date();
    //     let startDate = start_date ? new Date(start_date) : null;

    //     if (!startDate) {
    //         if (req.query.filter === 'week') {
    //             startDate = new Date(currentDate);
    //             startDate.setDate(currentDate.getDate() - 7);
    //         } else if (req.query.filter === 'month') {
    //             startDate = new Date(currentDate);
    //             startDate.setMonth(currentDate.getMonth() - 1);
    //         } else {
    //             startDate = new Date(currentDate.getFullYear(), 0, 1);
    //         }
    //     }

    //     const next15Days = new Date(currentDate);
    //     next15Days.setDate(currentDate.getDate() + 15);
    //     const next30Days = new Date(currentDate);
    //     next30Days.setDate(currentDate.getDate() + 30);
    //     const next60Days = new Date(currentDate);
    //     next60Days.setDate(currentDate.getDate() + 60);

    //     const query = `
    //         SELECT 
    //             co.name AS company_name,
    //             v.vendor_id AS vendor_id,
    //             v.name AS vendor_name,
    //             SUM(CASE WHEN b.due_date = ? THEN b.total_amount ELSE 0 END) AS due_today,
    //             SUM(CASE WHEN b.due_date > ? AND b.due_date <= ? THEN b.total_amount ELSE 0 END) AS due_15_days,
    //             SUM(CASE WHEN b.due_date > ? AND b.due_date <= ? THEN b.total_amount ELSE 0 END) AS due_30_days,
    //             SUM(CASE WHEN b.due_date > ? AND b.due_date <= ? THEN b.total_amount ELSE 0 END) AS due_60_days,
    //             SUM(CASE WHEN b.due_date < ? OR b.due_date IS NULL THEN b.total_amount ELSE 0 END) AS over_60_days
    //         FROM 
    //             bills b
    //         LEFT JOIN 
    //             vendor v ON b.vendor_id = v.vendor_id
    //         LEFT JOIN 
    //             company co ON b.company_id = co.company_id
    //         WHERE 
    //             b.company_id = ?
    //         GROUP BY 
    //             co.name, v.name
    //         ORDER BY 
    //             v.name ASC
    //     `;

    //     const params = [
    //         currentDate.toISOString().split('T')[0],
    //         currentDate.toISOString().split('T')[0], next15Days.toISOString().split('T')[0],
    //         next15Days.toISOString().split('T')[0], next30Days.toISOString().split('T')[0],
    //         next30Days.toISOString().split('T')[0], next60Days.toISOString().split('T')[0],
    //         currentDate.toISOString().split('T')[0],
    //         company_id,
    //         startDate.toISOString().split('T')[0],
    //         currentDate.toISOString().split('T')[0]
    //     ];

    //     const [results] = await db.execute(query, params);

    //     const agingSummary = results.map(row => ({
    //         company_name: row.company_name,
    //         vendor_id: row.vendor_id,
    //         vendor_name: row.vendor_name,
    //         due_today: parseFloat(row.due_today) || 0,
    //         due_15_days: parseFloat(row.due_15_days) || 0,
    //         due_30_days: parseFloat(row.due_30_days) || 0,
    //         due_60_days: parseFloat(row.due_60_days) || 0,
    //         over_60_days: parseFloat(row.over_60_days) || 0
    //     }));

    //     res.status(200).json({
    //         success: true,
    //         data: agingSummary,
    //         message: 'A/R Aging Summary report retrieved successfully'
    //     });
    // } catch (error) {
    //     console.error('Error generating A/R Aging Summary report:', error);
    //     res.status(500).json({
    //         success: false,
    //         message: 'Failed to generate A/R Aging Summary report',
    //         error: error.message
    //     });
    // }
};

module.exports = {
    getSupplierBalanceSummary,
    getSupplierBalanceDetail,
    getAPAgingSummary,
}