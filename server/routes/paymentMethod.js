const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const authorizedRoles = require('../middleware/authorized-roles');

const {
    createPaymentMethod,
    getPaymentMethods
} = require('../controllers/paymentMethod_controller');

router.post(
    '/createPaymentMethod',
    verifyToken,
    authorizedRoles(['admin', 'sale', 'staff']),
    createPaymentMethod
);

router.get(
    '/getPaymentMethods',
    verifyToken,
    authorizedRoles(['admin', 'sale', 'staff']),
    getPaymentMethods
);

module.exports = router;