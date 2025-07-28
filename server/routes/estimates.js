const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const authorizedRoles = require('../middleware/authorized-roles');

const {
    getEstimates,
    createEstimate,
    deleteEstimate,
    editEstimate,
    getEstimatesItems
} = require('../controllers/estimate_controller');

router.get(
    '/getEstimates/:companyId',
    verifyToken,
    authorizedRoles(['admin', 'sale', 'staff']),
    getEstimates
);

router.post(
    '/createEstimates/:companyId',
    verifyToken,
    authorizedRoles(['admin', 'sale', 'staff']),
    createEstimate
);

router.put(
    '/editEstimate/:company_id/:estimateId',
    verifyToken,
    authorizedRoles(['admin', 'sale', 'staff']),
    editEstimate
);


router.delete(
    '/deleteEstimate/:company_id/:estimateId',
    verifyToken,
    authorizedRoles(['admin', 'sale', 'staff']),
    deleteEstimate
);

router.get(
    '/estimatesItems/:companyId/:estimateId',
    verifyToken,
    authorizedRoles(['admin', 'sale', 'staff']),
    getEstimatesItems
);

module.exports = router;