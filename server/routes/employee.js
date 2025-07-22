const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const authorizedRoles = require('../middleware/authorized-roles');
const { 
    createEmployee,
    getEmployees,
    updateEmployee,
    deleteEmployee
} = require('../controllers/employee_controller');

router.post(
    '/employees',
    verifyToken,
    authorizedRoles(['admin']),
    createEmployee
);

router.get(
    '/employees',
    verifyToken,
    authorizedRoles(['admin', 'user']),
    getEmployees
);

router.put(
    '/employees/:id',
    verifyToken,
    authorizedRoles(['admin']),
    updateEmployee
);

router.delete(
    '/employees/:id',
    verifyToken,
    authorizedRoles(['admin']),
    deleteEmployee
);

module.exports = router;