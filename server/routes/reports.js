const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reports/profit&lossreport_controller');
const commissionReportController = require('../controllers/reports/commissionreport_controller');
const verifyToken = require('../middleware/verifyToken');
const authorizedRoles = require('../middleware/authorized-roles');

const {
    getProfitAndLossData,
    getMonthlyProfitAndLoss,
} = reportController;

const {
    getCommissionReport,
    getCommissionReportByEmployeeId
} = commissionReportController;

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
)

module.exports = router;
