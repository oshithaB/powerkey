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

module.exports = {
    getSupplierBalanceSummary
}