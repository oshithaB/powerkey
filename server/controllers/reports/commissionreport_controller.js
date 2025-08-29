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

// getCommissionReportByEmployeeId
const getCommissionReportByEmployeeId = async (req, res) => {
    const { employeeId } = req.params;
    try {
        // Query to calculate total commission for a specific employee
        const totalCommissionQuery = `
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
                e.is_active = TRUE AND e.id = ?
            GROUP BY
                e.id, e.name, e.email
        `;

        // Query to fetch invoice details for the employee
        const invoicesQuery = `
            SELECT
                i.id AS invoice_id,
                i.invoice_number,
                i.invoice_date,
                i.customer_id,
                i.company_id,
                i.total_amount,
                i.discount_amount,
                co.name AS company_name,
                c.name AS customer_name,
                p.id AS product_id,
                p.name AS product_name,
                ii.quantity,
                p.commission AS commission_per_unit,
                (ii.quantity * p.commission) AS total_commission
            FROM
                employees e
            LEFT JOIN
                products p ON e.id = p.added_employee_id
            LEFT JOIN
                invoice_items ii ON p.id = ii.product_id
            LEFT JOIN
                invoices i ON ii.invoice_id = i.id
            LEFT JOIN
                customer c ON i.customer_id = c.id
            LEFT JOIN
                company co ON i.company_id = co.company_id
            WHERE
                e.is_active = TRUE AND e.id = ? AND i.id IS NOT NULL
            ORDER BY
                i.invoice_date DESC
        `;

        // Execute the queries
        const [totalCommissionResults] = await db.execute(totalCommissionQuery, [employeeId]);
        const [invoicesResults] = await db.execute(invoicesQuery, [employeeId]);

        if (totalCommissionResults.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found or has no commission data'
            });
        }

        const row = totalCommissionResults[0];
        const commissionReport = {
            employeeId: row.employee_id,
            employeeName: row.employee_name,
            employeeEmail: row.employee_email,
            totalCommission: parseFloat(row.total_commission).toFixed(2),
            invoices: invoicesResults.map(invoice => ({
                invoiceId: invoice.invoice_id,
                companyId: invoice.company_id,
                companyName: invoice.company_name,
                invoiceNumber: invoice.invoice_number,
                invoiceDate: invoice.invoice_date,
                discountAmount: parseFloat(invoice.discount_amount).toFixed(2),
                totalAmount: parseFloat(invoice.total_amount).toFixed(2),
                customerId: invoice.customer_id,
                customerName: invoice.customer_name,
                productId: invoice.product_id,
                productName: invoice.product_name,
                quantity: invoice.quantity,
                commissionPerUnit: parseFloat(invoice.commission_per_unit).toFixed(2),
                totalCommission: parseFloat(invoice.total_commission).toFixed(2),
            }))
        };

        // Send the response
        res.status(200).json({
            success: true,
            data: commissionReport,
            message: 'Commission report for employee retrieved successfully'
        });
    } catch (error) {
        console.error('Error generating commission report for employee:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate commission report for employee',
            error: error.message
        });
    }
};

module.exports = {
    getCommissionReport,
    getCommissionReportByEmployeeId
};