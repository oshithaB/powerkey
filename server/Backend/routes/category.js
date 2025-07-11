const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const authorizedRoles = require('../middleware/authorized-roles');

const {
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory,
    getTaxRates,
    getEmployees
} = require('../controllers/category_controller');

// Category routes
router.post(
    '/categories/:company_id',
    verifyToken,
    authorizedRoles(['admin']),
    createCategory
);

router.get(
    '/categories/:company_id',
    verifyToken,
    getCategories
);

router.put(
    '/categories/:company_id/:id',
    verifyToken,
    authorizedRoles(['admin']),
    updateCategory
);

router.delete(
    '/categories/:company_id/:id',
    verifyToken,
    authorizedRoles(['admin']),
    deleteCategory
);

// Helper routes for form data
router.get(
    '/tax-rates/:company_id',
    verifyToken,
    getTaxRates
);

router.get(
    '/employees',
    verifyToken,
    getEmployees
);

module.exports = router;