const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const authorizedRoles = require('../middleware/authorized-roles');

const {
    createCategory,
    getCategories,
    updateCategory,
    permanentDeleteCategory,
    softDeleteCategory
} = require('../controllers/product_category_controller');

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

router.put(
    '/categories/softDelete/:company_id/:id',
    verifyToken,
    authorizedRoles(['admin']),
    softDeleteCategory
);

router.delete(
    '/categories/:company_id/:id',
    verifyToken,
    authorizedRoles(['admin']),
    permanentDeleteCategory
);

module.exports = router;