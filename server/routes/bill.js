const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const authorizedRoles = require('../middleware/authorized-roles');

const {
    createBill,
    getAllBills,
    getBillById,
    updateBill
} = require('../controllers/bill_controller');

router.post(
    '/createBill/:company_id',
    verifyToken,
    authorizedRoles(['admin', 'sale', 'staff']),
    createBill
);

router.get(
    '/getAllBills/:company_id',
    verifyToken,
    getAllBills
);

module.exports = router;

