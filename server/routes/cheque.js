const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const authorizedRoles = require('../middleware/authorized-roles');

const {
    addCheque,
    getChequesByCompanyId,
    updateCheque,
    deleteCheque
} = require('../controllers/cheque_controller');

router.post (
    '/addCheque',
    verifyToken,
    authorizedRoles(['admin', 'staff', 'sale']),
    addCheque
);

router.get (
    '/getChequesByCompanyId/:company_id',
    verifyToken,
    authorizedRoles(['admin', 'staff', 'sale']),
    getChequesByCompanyId
);

router.put (
    '/updateCheque/:cheque_id',
    verifyToken,
    authorizedRoles(['admin', 'staff', 'sale']),
    updateCheque
);

router.delete (
    '/deleteCheque/:cheque_id',
    verifyToken,
    authorizedRoles(['admin', 'staff', 'sale']),
    deleteCheque
);

module.exports = router;