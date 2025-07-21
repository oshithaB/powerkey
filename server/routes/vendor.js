const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const authorizedRoles = require('../middleware/authorized-roles');

const {
  getVendors,
  createVendor,
  updateVendor,
  deleteVendor
} = require('../controllers/vendor_controller');

router.get('/vendors/:company_id', verifyToken, getVendors);
router.post('/vendors/:company_id', verifyToken, authorizedRoles(['admin']), createVendor);
router.put('/vendors/:company_id/:vendor_id', verifyToken, authorizedRoles(['admin']), updateVendor);
router.delete('/vendors/:company_id/:vendor_id', verifyToken, authorizedRoles(['admin']), deleteVendor);

module.exports = router;