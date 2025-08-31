const db = require('../../DB/db');

const getARAgingSummary = async (req, res) => {
    try {
        const currentDate = new Date();
        const next15Days = new Date(currentDate);
        next15Days.setDate(currentDate.getDate() + 15);
        const next30Days = new Date(currentDate);
        next30Days.setDate(currentDate.getDate() + 30);
        const next60Days = new Date(currentDate);
        next60Days.setDate(currentDate.getDate() + 60);

        const { company_id } = req.params;

        const query = `
            SELECT 
                co.name AS company_name,
                c.name AS customer_name,
                SUM(CASE WHEN i.due_date = ? THEN i.balance_due ELSE 0 END) AS due_today,
                SUM(CASE WHEN i.due_date > ? AND i.due_date <= ? THEN i.balance_due ELSE 0 END) AS due_15_days,
                SUM(CASE WHEN i.due_date > ? AND i.due_date <= ? THEN i.balance_due ELSE 0 END) AS due_30_days,
                SUM(CASE WHEN i.due_date > ? AND i.due_date <= ? THEN i.balance_due ELSE 0 END) AS due_60_days,
                SUM(CASE WHEN i.due_date < ? OR i.due_date IS NULL THEN i.balance_due ELSE 0 END) AS over_60_days
            FROM 
                invoices i
            LEFT JOIN 
                customer c ON i.customer_id = c.id
            LEFT JOIN 
                company co ON i.company_id = co.company_id
            WHERE 
                i.status IN ('opened', 'sent', 'partially_paid', 'overdue')
                AND i.balance_due > 0
                AND i.company_id = ?
            GROUP BY 
                co.name, c.name
            ORDER BY 
                c.name ASC
        `;

        const params = [
            currentDate.toISOString().split('T')[0],
            currentDate.toISOString().split('T')[0], next15Days.toISOString().split('T')[0],
            next15Days.toISOString().split('T')[0], next30Days.toISOString().split('T')[0],
            next30Days.toISOString().split('T')[0], next60Days.toISOString().split('T')[0],
            currentDate.toISOString().split('T')[0],
            company_id
        ];

        const [results] = await db.execute(query, params);

        const agingSummary = results.map(row => ({
            companyName: row.company_name,
            customerName: row.customer_name,
            dueToday: parseFloat(row.due_today).toFixed(2),
            due15Days: parseFloat(row.due_15_days).toFixed(2),
            due30Days: parseFloat(row.due_30_days).toFixed(2),
            due60Days: parseFloat(row.due_60_days).toFixed(2),
            over60Days: parseFloat(row.over_60_days).toFixed(2),
            total: parseFloat(parseFloat(row.due_today) + parseFloat(row.due_15_days) + parseFloat(row.due_30_days) + parseFloat(row.due_60_days) + parseFloat(row.over_60_days)).toFixed(2)
        }));

        res.status(200).json({
            success: true,
            data: agingSummary,
            message: 'A/R Aging Summary report retrieved successfully'
        });
    } catch (error) {
        console.error('Error generating A/R Aging Summary report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate A/R Aging Summary report',
            error: error.message
        });
    }
};

module.exports = {
    getARAgingSummary
};