const db = require('../../DB/db');

const getCommissionReport = async (req, res) => {
    try {
        // Query to calculate total commission per employee as quantity * commission
        const query = `
            SELECT 
                e.id AS employee_id,
                e.name AS employee_name,
                e.email AS employee_email,
                COALESCE(SUM(ii.quantity * p.commission), 0) AS total_commission
            FROM 
                employees e
            LEFT JOIN 
                products p ON e.id = p.added_employee_id
            LEFT JOIN 
                invoice_items ii ON p.id = ii.product_id
            LEFT JOIN 
                invoices i ON ii.invoice_id = i.id
            WHERE 
                e.is_active = TRUE
            GROUP BY 
                e.id, e.name, e.email
            ORDER BY 
                e.name ASC
        `;

        // Execute the query
        const [results] = await db.execute(query);

        // Format the response
        const commissionReport = results.map(row => ({
            employeeId: row.employee_id,
            employeeName: row.employee_name,
            employeeEmail: row.employee_email,
            totalCommission: parseFloat(row.total_commission).toFixed(2)
        }));

        // Send the response
        res.status(200).json({
            success: true,
            data: commissionReport,
            message: 'Commission report retrieved successfully'
        });
    } catch (error) {
        console.error('Error generating commission report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate commission report',
            error: error.message
        });
    }
};

module.exports = { getCommissionReport };