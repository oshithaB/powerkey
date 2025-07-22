const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const authorizedRoles = require('../middleware/authorized-roles');

const {
    getEstimates,
} = require('../controllers/estimate_controller');

router.get(
    '/estimates/:companyId',
    verifyToken,
    authorizedRoles(['admin', 'user']),
    getEstimates
);

module.exports = router;