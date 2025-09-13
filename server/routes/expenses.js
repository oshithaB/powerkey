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
    getPaymentAccounts,
    addPaymentAccountType,
    getPaymentAccountTypes,
    getDetailTypesByAccountTypeId
} = require('../controllers/expense_controller');

router.post(
    '/createExpense',
    verifyToken,
    authorizedRoles(['admin', 'sale', 'staff']),
    createExpense
);

router.get(
    '/getExpenses/:company_id',
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
    '/getExpenseCategories/:company_id',
    verifyToken,
    getExpenseCategories
);

router.post(
    '/addPaymentAccount/:company_id',
    verifyToken,
    authorizedRoles(['admin', 'sale', 'staff']),
    addPaymentAccount
);

router.get(
    '/getPaymentAccounts/:company_id',
    verifyToken,
    getPaymentAccounts
);

router.post(
    '/addPaymentAccountType/:company_id',
    verifyToken,
    authorizedRoles(['admin', 'sale', 'staff']),
    addPaymentAccountType
);

router.get(
    '/getPaymentAccountTypes/:company_id',
    verifyToken,
    getPaymentAccountTypes
);

router.get(
    '/getPaymentAccountTypeDetails/:account_type_id',
    verifyToken,
    getDetailTypesByAccountTypeId
);

module.exports = router;