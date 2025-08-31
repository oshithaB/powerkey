const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reports/profit&lossreport_controller');
const commissionReportController = require('../controllers/reports/commissionreport_controller');
const salesReportController = require('../controllers/reports/salesreport_controller');
const aragingReportController = require('../controllers/reports/ar_aging_controller');
const verifyToken = require('../middleware/verifyToken');
const authorizedRoles = require('../middleware/authorized-roles');

// Importing profit and loss report controller functions
const {
    getProfitAndLossData,
    getMonthlyProfitAndLoss,
    getProfitAndLossByEmployeeId,
    getProfitAndLossByCustomerId,
} = reportController;

// Importing commission report controller functions
const {
    getCommissionReport,
    getCommissionReportByEmployeeId
} = commissionReportController;

// Importing sales report controller functions
const {
    getSalesReport,
    getSalesReportByEmployeeId
} = salesReportController;

// Importing A/R Aging report controller functions
const {
    getARAgingSummary,
    getCustomerInvoices,
} = aragingReportController;

//====================================================================================================================

// Profit and Loss Report Routes
router.get(
    '/profit-and-loss/:company_id',
    verifyToken,
    authorizedRoles(['admin', 'manager', 'accountant']),
    getProfitAndLossData
);

router.get(
    '/monthly-profit-and-loss/:company_id',
    verifyToken,
    authorizedRoles(['admin', 'manager', 'accountant']),
    getMonthlyProfitAndLoss
);

router.get(
    '/profit-and-loss-by-emp/:company_id/:employee_id',
    verifyToken,
    authorizedRoles(['admin', 'manager', 'accountant']),
    getProfitAndLossByEmployeeId
);

router.get(
    '/profit-and-loss-by-cust/:company_id/:customer_id',
    verifyToken,
    authorizedRoles(['admin', 'manager', 'accountant']),
    getProfitAndLossByCustomerId
);

// Commission Report Route
router.get(
    '/commission-report',
    verifyToken,
    authorizedRoles(['admin', 'staff']),
    getCommissionReport
);

router.get(
    '/commission-report/:employeeId',
    verifyToken,
    authorizedRoles(['admin', 'staff', 'sale']),
    getCommissionReportByEmployeeId
);

// Sales Report Route
router.get (
    '/sales-report',
    verifyToken,
    authorizedRoles(['admin', 'manager', 'sales']),
    getSalesReport
);

router.get (
    '/sales-report/:employeeId',
    verifyToken,
    authorizedRoles(['admin', 'manager', 'sales']),
    getSalesReportByEmployeeId
);

// A/R Aging Summary Report Route
router.get(
    '/ar-aging-summary/:company_id',
    verifyToken,
    authorizedRoles(['admin', 'manager', 'accountant']),
    getARAgingSummary
);

router.get(
    '/customer-invoices/:company_id/:customer_id',
    verifyToken,
    authorizedRoles(['admin', 'manager', 'accountant']),
    getCustomerInvoices
)


module.exports = router;
