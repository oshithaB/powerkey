const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const authorizedRoles = require('../middleware/authorized-roles');

const {
    getCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer
} = require('../controllers/customer_controller');

router.get('/customers/:company_id', verifyToken, getCustomers);
router.post('/customers/:company_id', verifyToken, authorizedRoles(['admin']), createCustomer);
router.put('/customers/:company_id/:customer_id', verifyToken, authorizedRoles(['admin']), updateCustomer);
router.delete('/customers/:company_id/:customer_id', verifyToken, authorizedRoles(['admin']), deleteCustomer);

module.exports = router;