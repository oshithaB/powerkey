const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reports/profit&lossreport_controller');
const commissionReportController = require('../controllers/reports/commissionreport_controller');
const salesReportController = require('../controllers/reports/salesreport_controller');
const aragingReportController = require('../controllers/reports/ar_aging_controller');
const balanceSheetController = require('../controllers/reports/balancesheet_controller');
const salesAndCustomerController = require('../controllers/reports/Sales&Customers/sales$customers_controller');
const employeeController = require('../controllers/reports/Employees/Employee_controller');
const verifyToken = require('../middleware/verifyToken');
const authorizedRoles = require('../middleware/authorized-roles');

// Importing profit and loss report controller functions
const {
    getProfitAndLossData,
    getMonthlyProfitAndLoss,
    getProfitAndLossByEmployeeId,
    getProfitAndLossByCustomerId,
    getProfitAndLossForAllEmployees,
    getInventoryShrinkageByCompanyId,
    getInvoicesByEmployeeId,
    getProfitAndLossForAllCustomers,
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
    getARAgingSummaryInDetails,
} = aragingReportController;

// Importing balance sheet report controller functions
const {
    getBalanceSheetData,
    getFormattedBalanceSheet,
} = balanceSheetController;

// Importing customer contact controller functions
const {
    getCustomerContacts,
    getSalesByEmployeeSummary,
    getSalesByCustomerSummary,
    getSalesByCustomerDetail,
    getSalesByEmployeeDetail,
    getDepositDetail,
    getEstimatesByCustomer,
    getInventoryValuationSummary,
    getInventoryValuationDetail,
    getPaymentMethodList,
    getStockTakeWorksheet,
    getTimeActivitiesByCustomerDetail,
    getTransactionListByCustomer,
    getProductServiceList,
    getSalesByProductServiceSummary,
    getSalesByProductServiceDetail,
    getIncomeByCustomerSummary,
    getCustomerPhoneList,
    getSalesByCustomerIDDetail,
} = salesAndCustomerController;

// Importing employee report controller functions
const {
    getEmployeeContacts,
} = employeeController;

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
    '/invoices-by-employee/:company_id/:employee_id',
    verifyToken,
    authorizedRoles(['admin', 'manager', 'accountant']),
    getInvoicesByEmployeeId
);

router.get(
    '/profit-and-loss-by-cust/:company_id/:customer_id',
    verifyToken,
    authorizedRoles(['admin', 'manager', 'accountant']),
    getProfitAndLossByCustomerId
);

router.get(
    '/profit-and-loss-all-employees/:company_id',
    verifyToken,
    authorizedRoles(['admin', 'manager', 'accountant']),
    getProfitAndLossForAllEmployees
);

router.get(
    '/inventory-shrinkage/:company_id',
    verifyToken,
    authorizedRoles(['admin', 'manager', 'accountant']),
    getInventoryShrinkageByCompanyId
);

router.get(
    '/profit-and-loss-all-customers/:company_id',
    verifyToken,
    authorizedRoles(['admin', 'manager', 'accountant']),
    getProfitAndLossForAllCustomers
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
);

router.get(
    '/ar-aging-summary-details/:customer_id/:company_id',
    verifyToken,
    authorizedRoles(['admin', 'manager', 'accountant']),
    getARAgingSummaryInDetails
);

// Balance Sheet Report Route
router.get(
    '/balance-sheet/:company_id',
    verifyToken,
    authorizedRoles(['admin', 'staff', 'sales']),
    getBalanceSheetData
);

router.get(
    '/formatted-balance-sheet/:company_id',
    verifyToken,
    authorizedRoles(['admin', 'staff', 'sales']),
    getFormattedBalanceSheet
);


// Sales and Customer routes
router.get(
    '/customer-contacts/:company_id',
    verifyToken,
    authorizedRoles(['admin', 'sales', 'staff']),
    getCustomerContacts
);

router.get(
    '/sales-by-employee-summary/:company_id',
    verifyToken,
    authorizedRoles(['admin', 'sales', 'staff']),
    getSalesByEmployeeSummary
);

router.get(
    '/sales-by-customer-summary/:company_id',
    verifyToken,
    authorizedRoles(['admin', 'sales', 'staff']),
    getSalesByCustomerSummary
);

router.get(
    '/sales-by-customer-detail/:company_id',
    verifyToken,
    authorizedRoles(['admin', 'sales', 'staff']),
    getSalesByCustomerDetail
);

router.get(
    '/sales-by-employee-detail/:company_id',
    verifyToken,
    authorizedRoles(['admin', 'sales', 'staff']),
    getSalesByEmployeeDetail
);

router.get(
    '/deposit-detail/:company_id',
    verifyToken,
    authorizedRoles(['admin', 'sales', 'staff']),
    getDepositDetail
);

router.get(
    '/estimates-by-customer/:company_id',
    verifyToken,
    authorizedRoles(['admin', 'sales', 'staff']),
    getEstimatesByCustomer
);

router.get(
    '/inventory-valuation-summary/:company_id',
    verifyToken,
    authorizedRoles(['admin', 'sales', 'staff']),
    getInventoryValuationSummary
);

router.get(
    '/inventory-valuation-detail/:company_id',
    verifyToken,
    authorizedRoles(['admin', 'sales', 'staff']),
    getInventoryValuationDetail
);

router.get(
    '/payment-methods/:company_id',
    verifyToken,
    authorizedRoles(['admin', 'sales', 'staff']),
    getPaymentMethodList
);

router.get(
    '/stock-take-worksheet/:company_id',
    verifyToken,
    authorizedRoles(['admin', 'sales', 'staff']),
    getStockTakeWorksheet
);

router.get(
    '/time-activities-by-customer-detail/:company_id',
    verifyToken,
    authorizedRoles(['admin', 'sales', 'staff']),
    getTimeActivitiesByCustomerDetail
);

router.get(
    '/transaction-list-by-customer/:company_id',
    verifyToken,
    authorizedRoles(['admin', 'sales', 'staff']),
    getTransactionListByCustomer
);

router.get(
    '/product-service-list/:company_id',
    verifyToken,
    authorizedRoles(['admin', 'sales', 'staff']),
    getProductServiceList
);

router.get(
    '/sales-by-product-service-summary/:company_id',
    verifyToken,
    authorizedRoles(['admin', 'sales', 'staff']),
    getSalesByProductServiceSummary
);

router.get(
    '/sales-by-product-service-detail/:company_id/:product_id',
    verifyToken,
    authorizedRoles(['admin', 'sales', 'staff']),
    getSalesByProductServiceDetail
);

router.get(
    '/income-by-customer-summary/:company_id',
    verifyToken,
    authorizedRoles(['admin', 'sales', 'staff']),
    getIncomeByCustomerSummary
);

router.get(
    '/customer-phone-list/:company_id',
    verifyToken,
    authorizedRoles(['admin', 'sales', 'staff']),
    getCustomerPhoneList
);

router.get(
    '/sales-by-customerid-detail/:company_id/:customer_id',
    verifyToken,
    authorizedRoles(['admin', 'sales', 'staff']),
    getSalesByCustomerIDDetail
);


// Employee routes
router.get(
    '/employee-contacts/:company_id',
    verifyToken,
    authorizedRoles(['admin', 'manager', 'hr']),
    getEmployeeContacts
);

module.exports = router;
