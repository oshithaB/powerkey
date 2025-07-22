const db = require("../DB/db");

const getEstimates = async (req, res) => {
    try {
        const { companyId } = req.params;

        if (!companyId) {
            return res.status(400).json({ error: "Company ID is required" });
        }

        const query = `SELECT 
                            e.id,
                            e.estimate_number,
                            e.company_id,
                            e.customer_id,
                            c.name AS customer_name,
                            e.employee_id,
                            emp.name AS employee_name, -- Fixed alias reference
                            e.estimate_date,
                            e.expiry_date,
                            e.subtotal,
                            e.discount_type,
                            e.discount_value,
                            e.discount_amount,
                            e.tax_amount,
                            e.total_amount,
                            e.status,
                            e.is_active,
                            e.notes,
                            e.terms,
                            e.invoice_id,
                            e.created_at
                        FROM 
                            estimates e
                        JOIN 
                            customer c ON e.customer_id = c.id
                        JOIN 
                            employees emp ON e.employee_id = emp.id
                        WHERE 
                            e.company_id = ?;
                        `;
        const [estimates] = await db.query(query, [companyId]);
        res.json(estimates);
    } catch (error) {
        console.error("Error fetching estimates:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = {
    getEstimates
};