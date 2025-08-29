const db = require('../../DB/db');

class ReportController {

    static async getProfitAndLossData(req, res) {
        try {
            const { company_id } = req.params;
            const { start_date, end_date } = req.query;
            
            if (!company_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            // Build date filter condition
            const today = new Date().toISOString().split('T')[0];
            const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
            let dateCondition = 'AND i.invoice_date BETWEEN ? AND ?';
            let dateParams = [startOfYear, today];
            
            if (start_date && end_date) {
                dateCondition = 'AND i.invoice_date BETWEEN ? AND ?';
                dateParams = [start_date, end_date];
            } else if (start_date) {
                dateCondition = 'AND i.invoice_date >= ?';
                dateParams = [start_date];
            } else if (end_date) {
                dateCondition = 'AND i.invoice_date <= ?';
                dateParams = [end_date];
            }

            // 1. INCOME CALCULATIONS
            
            // Sales of Product Income - Total revenue from products
            const [productIncomeResult] = await db.execute(`
                SELECT 
                    COALESCE(SUM(ii.quantity * ii.actual_unit_price), 0) as product_income
                FROM invoices i
                INNER JOIN invoice_items ii ON i.id = ii.invoice_id
                WHERE i.company_id = ? 
                AND i.status IN ('paid', 'partially_paid', 'sent', 'opened')
                ${dateCondition}
            `, [company_id, ...dateParams]);

            // Shipping Income - Total shipping charges
            const [shippingIncomeResult] = await db.execute(`
                SELECT 
                    COALESCE(SUM(i.shipping_cost), 0) as shipping_income
                FROM invoices i
                WHERE i.company_id = ? 
                AND i.status IN ('paid', 'partially_paid', 'sent', 'opened')
                ${dateCondition}
            `, [company_id, ...dateParams]);

            // Discounts Given - Total discounts provided (shown as negative)
            const [discountsResult] = await db.execute(`
                SELECT 
                    COALESCE(SUM(i.discount_amount), 0) as discounts_given
                FROM invoices i
                WHERE i.company_id = ? 
                AND i.status IN ('paid', 'partially_paid', 'sent', 'opened')
                ${dateCondition}
            `, [company_id, ...dateParams]);

            // Tax Income - Total tax collected
            const [taxIncomeResult] = await db.execute(`
                SELECT 
                    COALESCE(SUM(i.tax_amount), 0) as tax_income
                FROM invoices i
                WHERE i.company_id = ? 
                AND i.status IN ('paid', 'partially_paid', 'sent', 'opened')
                ${dateCondition}
            `, [company_id, ...dateParams]);

            // 2. COST OF SALES CALCULATIONS

            // Cost of Sales - Based on product cost prices
            const [costOfSalesResult] = await db.execute(`
                SELECT 
                    COALESCE(SUM(ii.quantity * p.cost_price), 0) as cost_of_sales
                FROM invoices i
                INNER JOIN invoice_items ii ON i.id = ii.invoice_id
                LEFT JOIN products p ON ii.product_id = p.id
                WHERE i.company_id = ? 
                AND i.status IN ('paid', 'partially_paid', 'sent', 'opened')
                ${dateCondition}
            `, [company_id, ...dateParams]);

            // Inventory Shrinkage - Calculate based on expected vs actual inventory
            const [inventoryShrinkageResult] = await db.execute(`
                SELECT 
                    COALESCE(SUM(
                        CASE 
                            WHEN p.quantity_on_hand > p.manual_count 
                            THEN (p.quantity_on_hand - p.manual_count) * p.cost_price 
                            ELSE 0 
                        END
                    ), 0) as inventory_shrinkage
                FROM products p
                WHERE p.company_id = ?
                AND p.is_active = TRUE
            `, [company_id]);

            // 3. OTHER INCOME AND EXPENSES (placeholders for future implementation)
            
            // Other Income - From non-product sources
            const [otherIncomeResult] = await db.execute(`
                SELECT 0 as other_income
            `);

            // Expenses - Operating expenses
            const [expensesResult] = await db.execute(`
                SELECT 0 as expenses
            `);

            // Other Expenses - Non-operating expenses
            const [otherExpensesResult] = await db.execute(`
                SELECT 0 as other_expenses
            `);

            // 4. ADDITIONAL METRICS

            // Total Paid Amount - Actual cash received
            const [totalPaidResult] = await db.execute(`
                SELECT 
                    COALESCE(SUM(i.paid_amount), 0) as total_paid
                FROM invoices i
                WHERE i.company_id = ? 
                AND i.status IN ('paid', 'partially_paid')
                ${dateCondition}
            `, [company_id, ...dateParams]);

            // Outstanding Balance - Amount still owed
            const [outstandingResult] = await db.execute(`
                SELECT 
                    COALESCE(SUM(i.balance_due), 0) as outstanding_balance
                FROM invoices i
                WHERE i.company_id = ? 
                AND i.balance_due > 0
                ${dateCondition}
            `, [company_id, ...dateParams]);

            // Extract values
            const productIncome = parseFloat(productIncomeResult[0]?.product_income || 0);
            const shippingIncome = parseFloat(shippingIncomeResult[0]?.shipping_income || 0);
            const discountsGiven = parseFloat(discountsResult[0]?.discounts_given || 0);
            const taxIncome = parseFloat(taxIncomeResult[0]?.tax_income || 0);
            const costOfSales = parseFloat(costOfSalesResult[0]?.cost_of_sales || 0);
            const inventoryShrinkage = parseFloat(inventoryShrinkageResult[0]?.inventory_shrinkage || 0);
            const otherIncome = parseFloat(otherIncomeResult[0]?.other_income || 0);
            const expenses = parseFloat(expensesResult[0]?.expenses || 0);
            const otherExpenses = parseFloat(otherExpensesResult[0]?.other_expenses || 0);
            const totalPaid = parseFloat(totalPaidResult[0]?.total_paid || 0);
            const outstandingBalance = parseFloat(outstandingResult[0]?.outstanding_balance || 0);

            // 5. CALCULATE TOTALS AND DERIVED METRICS

            // Total Income (before discounts)
            const totalIncome = productIncome + shippingIncome + taxIncome;

            // Net Income (after discounts)
            const netIncome = totalIncome - discountsGiven;

            // Total Cost of Sales
            const totalCostOfSales = costOfSales + inventoryShrinkage;

            // Gross Profit
            const grossProfit = netIncome - totalCostOfSales;

            // Net Earnings (Final profit/loss)
            const netEarnings = grossProfit + otherIncome - expenses - otherExpenses;

            // Profit Margins
            const grossProfitMargin = totalIncome > 0 ? (grossProfit / totalIncome) * 100 : 0;
            const netProfitMargin = totalIncome > 0 ? (netEarnings / totalIncome) * 100 : 0;

            // 6. GET COMPANY DETAILS
            const [companyResult] = await db.execute(`
                SELECT name, address, email_address, contact_number
                FROM company
                WHERE company_id = ?
            `, [company_id]);

            const companyInfo = companyResult[0] || {};

            // 7. PREPARE RESPONSE DATA
            const profitAndLossData = {
                company: {
                    id: company_id,
                    name: companyInfo.name || 'Company Name',
                    address: companyInfo.address,
                    email: companyInfo.email_address,
                    phone: companyInfo.contact_number
                },
                period: {
                    start_date: startOfYear,
                    end_date: today,
                    generated_at: new Date().toISOString()
                },
                income: {
                    sales_of_product_income: productIncome,
                    shipping_income: shippingIncome,
                    tax_income: taxIncome,
                    discounts_given: -discountsGiven,
                    other_income: otherIncome,
                    total_income: totalIncome,
                    net_income: netIncome
                },
                cost_of_sales: {
                    cost_of_sales: costOfSales,
                    inventory_shrinkage: inventoryShrinkage,
                    total_cost_of_sales: totalCostOfSales
                },
                expenses: {
                    operating_expenses: expenses,
                    other_expenses: otherExpenses,
                    total_expenses: expenses + otherExpenses
                },
                profitability: {
                    gross_profit: grossProfit,
                    net_earnings: netEarnings,
                    gross_profit_margin: parseFloat(grossProfitMargin.toFixed(2)),
                    net_profit_margin: parseFloat(netProfitMargin.toFixed(2))
                },
                cash_flow: {
                    total_invoiced: totalIncome,
                    total_paid: totalPaid,
                    outstanding_balance: outstandingBalance,
                    collection_rate: totalIncome > 0 ? parseFloat(((totalPaid / totalIncome) * 100).toFixed(2)) : 0
                },
                summary: {
                    total_revenue: totalIncome,
                    total_costs: totalCostOfSales + expenses + otherExpenses,
                    net_profit_loss: netEarnings,
                    is_profitable: netEarnings > 0
                }
            };

            return res.status(200).json({
                success: true,
                message: 'Profit and Loss data retrieved successfully',
                data: profitAndLossData
            });

        } catch (error) {
            console.error('Error in getProfitAndLossData:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
            });
        }
    }

    /**
     * Get Monthly Profit and Loss Comparison
     * Provides month-by-month breakdown for trend analysis
     */
    static async getMonthlyProfitAndLoss(req, res) {
        try {
            const { company_id, year } = req.params;
            
            if (!company_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const targetYear = year || new Date().getFullYear();

            const [monthlyData] = await db.execute(`
                SELECT 
                    MONTH(STR_TO_DATE(i.invoice_date, '%Y-%m-%d')) as month,
                    MONTHNAME(STR_TO_DATE(i.invoice_date, '%Y-%m-%d')) as month_name,
                    COALESCE(SUM(ii.quantity * ii.actual_unit_price), 0) as product_income,
                    COALESCE(SUM(i.shipping_cost), 0) as shipping_income,
                    COALESCE(SUM(i.discount_amount), 0) as discounts_given,
                    COALESCE(SUM(i.tax_amount), 0) as tax_income,
                    COALESCE(SUM(ii.quantity * COALESCE(p.cost_price, 0)), 0) as cost_of_sales,
                    COUNT(DISTINCT i.id) as invoice_count
                FROM invoices i
                INNER JOIN invoice_items ii ON i.id = ii.invoice_id
                LEFT JOIN products p ON ii.product_id = p.id
                WHERE i.company_id = ? 
                AND YEAR(STR_TO_DATE(i.invoice_date, '%Y-%m-%d')) = ?
                AND i.status IN ('paid', 'partially_paid', 'sent', 'opened')
                GROUP BY MONTH(STR_TO_DATE(i.invoice_date, '%Y-%m-%d')), 
                         MONTHNAME(STR_TO_DATE(i.invoice_date, '%Y-%m-%d'))
                ORDER BY month
            `, [company_id, targetYear]);

            const processedData = monthlyData.map(row => {
                const productIncome = parseFloat(row.product_income);
                const shippingIncome = parseFloat(row.shipping_income);
                const taxIncome = parseFloat(row.tax_income);
                const discountsGiven = parseFloat(row.discounts_given);
                const costOfSales = parseFloat(row.cost_of_sales);
                
                const totalIncome = productIncome + shippingIncome + taxIncome;
                const netIncome = totalIncome - discountsGiven;
                const grossProfit = netIncome - costOfSales;
                
                return {
                    month: row.month,
                    month_name: row.month_name,
                    product_income: productIncome,
                    shipping_income: shippingIncome,
                    tax_income: taxIncome,
                    discounts_given: discountsGiven,
                    total_income: totalIncome,
                    net_income: netIncome,
                    cost_of_sales: costOfSales,
                    gross_profit: grossProfit,
                    invoice_count: parseInt(row.invoice_count),
                    profit_margin: totalIncome > 0 ? parseFloat(((grossProfit / totalIncome) * 100).toFixed(2)) : 0
                };
            });

            return res.status(200).json({
                success: true,
                message: 'Monthly Profit and Loss data retrieved successfully',
                data: {
                    year: targetYear,
                    company_id: company_id,
                    monthly_breakdown: processedData
                }
            });

        } catch (error) {
            console.error('Error in getMonthlyProfitAndLoss:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
            });
        }
    }

}

module.exports = ReportController;