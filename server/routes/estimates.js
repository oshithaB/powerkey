const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const authorizedRoles = require('../middleware/authorized-roles');

const {
    getEstimates,
    createEstimate,
    deleteEstimate,
    getEstimatesItems
} = require('../controllers/estimate_controller');

router.get(
    '/estimates/:companyId',
    verifyToken,
    authorizedRoles(['admin', 'user']),
    getEstimates
);

router.post(
    '/createEstimates/:companyId',
    verifyToken,
    authorizedRoles(['admin', 'user']),
    createEstimate
);

router.delete(
    '/deleteEstimate/:company_id/:estimateId',
    verifyToken,
    authorizedRoles(['admin', 'user']),
    deleteEstimate
);

router.get(
    '/estimatesItems/:companyId/:estimateId',
    verifyToken,
    authorizedRoles(['admin', 'user']),
    getEstimatesItems
);

module.exports = router;