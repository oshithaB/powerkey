const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const authorizedRoles = require('../middleware/authorized-roles');

const {
    createExpense,
    getExpenses,
    addPayee,
    getPayees,
    addCategory,
    getExpenseCategories,
    addPaymentAccount,
    getPaymentAccounts
} = require('../controllers/expense_controller');

router.post(
    '/createExpense',
    verifyToken,
    authorizedRoles(['admin', 'sale', 'staff']),
    createExpense
);

router.get(
    '/getExpenses/:companyId',
    verifyToken,
    getExpenses
);

router.post(
    '/addPayee',
    verifyToken,
    authorizedRoles(['admin', 'sale', 'staff']),
    addPayee
);

router.get(
    '/getPayees/:companyId',
    verifyToken,
    getPayees
);

router.post(
    '/addCategory',
    verifyToken,
    authorizedRoles(['admin', 'sale', 'staff']),
    addCategory
);

router.get(
    '/getExpenseCategories/:companyId',
    verifyToken,
    getExpenseCategories
);

router.post(
    '/addPaymentAccount',
    verifyToken,
    authorizedRoles(['admin', 'sale', 'staff']),
    addPaymentAccount
);

router.get(
    '/getPaymentAccounts/:companyId',
    verifyToken,
    getPaymentAccounts
);

module.exports = router;