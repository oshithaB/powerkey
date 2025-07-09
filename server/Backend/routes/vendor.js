const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const authorizedRoles = require('../middleware/authorized-roles');

const {
  getVendors
} = require('../controllers/vendor_controller');

router.get('/vendors/:company_id', verifyToken, getVendors);

module.exports = router;